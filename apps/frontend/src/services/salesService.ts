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
