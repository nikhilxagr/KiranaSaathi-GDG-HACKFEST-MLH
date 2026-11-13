import { db, KiranaDatabase } from '../db';
import { Sale, SaleItem, ProductUnit } from '../types';

export interface RecordSaleInput {
  items: {
    productId: number;
    quantity: number;
  }[];
  paymentMethod: 'cash' | 'upi' | 'credit_udhaar';
  receiptNumber?: string;
}

// Concurrency mutex lock to prevent concurrent or duplicate sale submissions
let isSaleProcessing = false;

/**
 * Atomic sale recording service
 * Handles transactions, stock validation, rollback on insufficient stock,
 * integer-safe monetary calculations, and stock movement logs.
 */
export const recordSale = async (
  input: RecordSaleInput,
  database: KiranaDatabase = db
): Promise<Sale> => {
  // 1. Concurrency guard: reject concurrent submissions at service level
  if (isSaleProcessing) {
    throw new Error('A sale transaction is currently being processed. Please wait.');
  }

  isSaleProcessing = true;

  try {
    // 2. Validate cart input
    if (!input.items || input.items.length === 0) {
      throw new Error('Sale cart cannot be empty.');
    }

    for (const item of input.items) {
      if (typeof item.productId !== 'number' || isNaN(item.productId)) {
        throw new Error('Invalid product ID in sale cart.');
      }
      if (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0) {
        throw new Error('Sale quantity must be a positive number.');
      }
    }

    // 3. Open atomic Dexie transaction covering products, sales, and stock movements
    return await database.transaction(
      'rw',
      [database.products, database.sales, database.stockMovements],
      async () => {
        const now = new Date().toISOString();
        const saleItems: SaleItem[] = [];
        let totalPaise = 0;
        let hasPrice = false;

        // 4 & 5. Read current saved stock and verify availability inside transaction
        for (const cartItem of input.items) {
          const product = await database.products.get(cartItem.productId);

          if (!product) {
            throw new Error(`Product with ID ${cartItem.productId} not found in inventory.`);
          }

          if (product.quantity < cartItem.quantity) {
            throw new Error(
              `Insufficient stock for "${product.name}". Requested ${cartItem.quantity} ${product.unit}, but only ${product.quantity} ${product.unit} available.`
            );
          }

          // Integer-safe money handling using paise (1 Rupee = 100 Paise)
          let unitPrice: number | undefined = undefined;
          let lineTotal: number | undefined = undefined;

          if (product.sellingPrice !== undefined && Number.isFinite(product.sellingPrice)) {
            hasPrice = true;
            unitPrice = product.sellingPrice;
            const unitPricePaise = Math.round(product.sellingPrice * 100);
            const lineTotalPaise = Math.round(cartItem.quantity * unitPricePaise);
            totalPaise += lineTotalPaise;
            lineTotal = Number((lineTotalPaise / 100).toFixed(2));
          }

          saleItems.push({
            productId: product.id!,
            productName: product.name,
            productNameHindi: product.nameHindi,
            quantity: Number(cartItem.quantity.toFixed(2)),
            unit: product.unit as ProductUnit,
            unitPrice,
            lineTotal,
          });
        }

        // 6 & 7. Decrease quantities and record stock movements
        const receiptNumber =
          input.receiptNumber ||
          `REC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

        const saleRecord: Sale = {
          receiptNumber,
          items: saleItems,
          totalAmount: hasPrice ? Number((totalPaise / 100).toFixed(2)) : undefined,
          paymentMethod: input.paymentMethod,
          createdAt: now,
        };

        const saleId = await database.sales.add(saleRecord);
        const savedSale: Sale = { ...saleRecord, id: Number(saleId) };

        for (const item of saleItems) {
          const pid = Number(item.productId);
          const product = (await database.products.get(pid))!;
          const resultingQuantity = Number((product.quantity - item.quantity).toFixed(2));

          // Atomically update product stock
          await database.products.update(pid, {
            quantity: resultingQuantity,
            updatedAt: now,
          });

          // Atomically log stock movement
          await database.stockMovements.add({
            productId: pid,
            productName: product.name,
            type: 'sale',
            quantityDelta: -Number(item.quantity.toFixed(2)),
            resultingQuantity,
            saleId: Number(saleId),
            createdAt: now,
          });
        }

        // 8. Transaction commits automatically when this block returns
        return savedSale;
      }
    );
  } finally {
    isSaleProcessing = false;
  }
};

/**
 * Fetch all recorded sales from IndexedDB
 */
export const getAllSales = async (database: KiranaDatabase = db): Promise<Sale[]> => {
  return await database.sales.reverse().sortBy('createdAt');
};

/**
 * Fetch recent sales with limit
 */
export const getRecentSales = async (
  limit = 5,
  database: KiranaDatabase = db
): Promise<Sale[]> => {
  return await database.sales.reverse().limit(limit).toArray();
};

/**
 * Format an itemized customer receipt for WhatsApp / Text sharing
 */
export const formatCustomerReceiptText = (params: {
  sale: Sale;
  shopName: string;
  shopNameHindi?: string;
  ownerName?: string;
  language?: 'hi' | 'en';
}): string => {
  const isHindi = params.language === 'hi';
  const storeTitle = isHindi ? (params.shopNameHindi || params.shopName) : params.shopName;
  const header = `🧾 *${storeTitle}*\n📍 ${isHindi ? 'डिजिटल बिल रसीद' : 'Digital Sales Receipt'}\n`;
  const receiptNo = params.sale.receiptNumber ? `#${params.sale.receiptNumber}` : `#KS-${params.sale.id}`;
  const dateStr = new Date(params.sale.createdAt || params.sale.timestamp || Date.now()).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentLabel =
    params.sale.paymentMethod === 'cash'
      ? (isHindi ? 'नकद (Cash)' : 'Cash')
      : params.sale.paymentMethod === 'upi'
      ? (isHindi ? 'UPI / क्यूआर कोड' : 'UPI')
      : (isHindi ? 'उधार (Khata)' : 'Customer Credit (Khata)');

  const meta = `-----------------------------\n${isHindi ? 'रसीद संख्या' : 'Receipt'}: *${receiptNo}*\n${isHindi ? 'तारीख' : 'Date'}: ${dateStr}\n${isHindi ? 'भुगतान माध्यम' : 'Payment Mode'}: *${paymentLabel}*\n-----------------------------\n`;

  const itemsList = params.sale.items
    .map((item, idx) => {
      const name = isHindi ? item.productNameHindi || item.productName : item.productName;
      const rate = item.unitPrice ? ` × ₹${item.unitPrice}` : '';
      const lineAmt = item.lineTotal ?? item.subtotal ?? (item.quantity * (item.unitPrice ?? 0));
      return `${idx + 1}. *${name}*\n   ${item.quantity} ${item.unit}${rate} = *₹${lineAmt}*`;
    })
    .join('\n');

  const total = `\n-----------------------------\n💰 *${isHindi ? 'कुल राशि (Total Bill)' : 'Grand Total'}*: *₹${params.sale.totalAmount ?? 0}*\n-----------------------------\n`;

  const footer = `🙏 ${isHindi ? 'दुकान पर आने के लिए धन्यवाद!' : 'Thank you for shopping with us!'}\n📱 KiranaSathi - आपका भरोसेमंद डिजिटल साथी`;

  return `${header}${meta}${itemsList}${total}${footer}`;
};

/**
 * Builds a WhatsApp customer bill URL
 */
export const buildCustomerWhatsAppUrl = (
  phone: string | undefined,
  receiptText: string
): string => {
  const encoded = encodeURIComponent(receiptText);
  if (!phone || !phone.trim()) {
    return `https://wa.me/?text=${encoded}`;
  }
  const cleanPhone = phone.replace(/[^0-9+]/g, '').replace(/^\+/, '');
  const withCountryCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  return `https://wa.me/${withCountryCode}?text=${encoded}`;
};

/**
 * Generates an NPCI-standard UPI deep-link URL
 */
export const buildUpiPaymentUrl = (params: {
  upiId: string;
  shopName: string;
  amount: number;
  note?: string;
}): string => {
  const { upiId, shopName, amount, note } = params;
  const cleanUpi = upiId.trim();
  const cleanAmount = Number(amount.toFixed(2));
  const encodedName = encodeURIComponent(shopName.trim());
  const encodedNote = encodeURIComponent((note || `KiranaSathi Bill`).trim());
  return `upi://pay?pa=${cleanUpi}&pn=${encodedName}&am=${cleanAmount.toFixed(2)}&cu=INR&tn=${encodedNote}`;
};
