import { db, KiranaDatabase } from '../db';
import { Product, Supplier, ReorderRecommendation, ReorderMode, ProductUnit } from '../types';
import { getAllProducts } from './inventoryService';
import { getAllSuppliers } from './supplierService';

export interface HistoricalSalePoint {
  quantity: number;
  date: string; // ISO timestamp
}

export interface ReorderCalculationOptions {
  historicalWindowDays?: number; // Default: 14 days
  minSalesCountForDemand?: number; // Minimum number of sale events to trust daily demand (Default: 2)
  safetyDays?: number; // Default: 1 day safety stock buffer
  defaultLeadTimeDays?: number; // Fallback lead time if supplier has none (Default: 2 days)
  now?: Date; // For deterministic unit testing
}

/**
 * Rounds a recommended quantity according to the physical nature of the unit.
 * Discrete units (packet, piece) are rounded up to whole integers (Math.ceil).
 * Fractional units (kg, litre) are rounded to 2 decimal places.
 * Grams (gm) are rounded to whole numbers.
 */
export const roundReorderQuantity = (qty: number, unit: ProductUnit): number => {
  if (qty <= 0) return 0;

  switch (unit) {
    case 'packet':
    case 'piece':
      return Math.ceil(qty);
    case 'gm':
      return Math.ceil(qty);
    case 'kg':
    case 'litre':
    default:
      return Number(qty.toFixed(2));
  }
};

/**
 * Pure, deterministic calculation function for a single product.
 * Compares current stock with minimum thresholds and historical sales demand.
 */
export const calculateReorderForProduct = (
  product: Product,
  salesHistory: HistoricalSalePoint[] = [],
  supplier?: Supplier,
  options: ReorderCalculationOptions = {}
): ReorderRecommendation => {
  const currentStock = Number((product.quantity ?? product.currentStock ?? 0).toFixed(2));
  const minimumStock = Number((product.minimumStock ?? product.minThreshold ?? 0).toFixed(2));
  const unit = product.unit;

  const now = options.now ? options.now.getTime() : Date.now();
  const windowDays = Math.max(1, options.historicalWindowDays ?? 14);
  const minSalesCount = Math.max(1, options.minSalesCountForDemand ?? 2);
  const safetyDays = Math.max(0, options.safetyDays ?? 1);
  const leadTimeDays =
    supplier?.leadTimeDays !== undefined && supplier.leadTimeDays > 0
      ? supplier.leadTimeDays
      : options.defaultLeadTimeDays ?? 2;

  const windowStartTime = now - windowDays * 24 * 60 * 60 * 1000;

  // 1. Filter valid sales strictly within the historical window [now - windowDays, now]
  // Never use future sales (date > now) or invalid records
  const validSalesInWindow = salesHistory.filter((s) => {
    if (typeof s.quantity !== 'number' || !Number.isFinite(s.quantity) || s.quantity <= 0) {
      return false;
    }
    const saleTime = new Date(s.date).getTime();
    return !isNaN(saleTime) && saleTime >= windowStartTime && saleTime <= now;
  });

  const totalSoldInWindow = validSalesInWindow.reduce((acc, s) => acc + s.quantity, 0);
  const hasSufficientHistory = validSalesInWindow.length >= minSalesCount && totalSoldInWindow > 0;

  // 2. Decide Mode: Sales-aware vs. Basic Threshold Fallback
  if (hasSufficientHistory) {
    // Mode: Sales-Aware Demand Estimation
    const dailyDemand = Number((totalSoldInWindow / windowDays).toFixed(3));
    const coverageDays = leadTimeDays + safetyDays;
    const targetStock = Number((dailyDemand * coverageDays).toFixed(2));
    const rawShortfall = targetStock - currentStock;

    // If current stock is below target, or below minimum stock threshold
    const effectiveShortfall = Math.max(
      0,
      Math.max(rawShortfall, minimumStock - currentStock)
    );

    const recommendedQty = roundReorderQuantity(effectiveShortfall, unit);

    const reason =
      recommendedQty > 0
        ? `Sales-aware: based on ~${dailyDemand} ${unit}/day demand across ${windowDays}d with ${leadTimeDays}d lead + ${safetyDays}d safety stock.`
        : `Stock is currently healthy based on ~${dailyDemand} ${unit}/day demand.`;

    const reasonHindi =
      recommendedQty > 0
        ? `मांग पर आधारित: पिछले ${windowDays} दिनों में ~${dailyDemand} ${unit}/दिन बिक्री + ${leadTimeDays} दिन डिलीवरी समय के अनुसार।`
        : `स्टॉक पर्याप्त है (दैनिक खपत: ~${dailyDemand} ${unit}/दिन)।`;

    return {
      productId: product.id ?? 0,
      productName: product.name,
      productNameHindi: product.nameHindi,
      category: product.category,
      unit,
      currentStock,
      minimumStock,
      mode: 'sales_aware',
      recommendedQuantity: recommendedQty,
      reason,
      reasonHindi,
      supplierId: supplier?.id || product.supplierId,
      supplierName: supplier?.name,
      supplierPhone: supplier?.phone,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      metrics: {
        averageDailyDemand: dailyDemand,
        historicalWindowDays: windowDays,
        leadTimeDays,
        safetyDays,
        targetStock,
      },
    };
  }

  // Fallback Mode: Basic Threshold Mode
  const shortfall = Math.max(0, minimumStock - currentStock);
  const recommendedQty = roundReorderQuantity(shortfall, unit);

  const fallbackExplanation =
    validSalesInWindow.length === 0
      ? `No recorded sales in the last ${windowDays} days. Using minimum safety threshold.`
      : `Insufficient sales records (< ${minSalesCount} transactions). Using minimum safety threshold.`;

  const fallbackExplanationHindi =
    validSalesInWindow.length === 0
      ? `पिछले ${windowDays} दिनों में कोई बिक्री नहीं मिली। सुरक्षा सीमा (Minimum Threshold) का उपयोग किया गया है।`
      : `सीमित बिक्री रिकॉर्ड। सुरक्षा सीमा (Minimum Threshold) का उपयोग किया गया है।`;

  const reason =
    recommendedQty > 0
      ? `Threshold suggestion: current stock (${currentStock} ${unit}) is below minimum (${minimumStock} ${unit}). ${fallbackExplanation}`
      : `Stock is above minimum threshold (${minimumStock} ${unit}). ${fallbackExplanation}`;

  const reasonHindi =
    recommendedQty > 0
      ? `न्यूनतम सीमा सुझाव: स्टॉक (${currentStock} ${unit}) न्यूनतम स्तर (${minimumStock} ${unit}) से कम है। ${fallbackExplanationHindi}`
      : `स्टॉक न्यूनतम स्तर से अधिक है। ${fallbackExplanationHindi}`;

  return {
    productId: product.id ?? 0,
    productName: product.name,
    productNameHindi: product.nameHindi,
    category: product.category,
    unit,
    currentStock,
    minimumStock,
    mode: 'threshold',
    recommendedQuantity: recommendedQty,
    reason,
    reasonHindi,
    supplierId: supplier?.id || product.supplierId,
    supplierName: supplier?.name,
    supplierPhone: supplier?.phone,
    costPrice: product.costPrice,
    sellingPrice: product.sellingPrice,
  };
};

/**
 * Fetch products and calculate reorder recommendations using real IndexedDB data
 */
export const getReorderRecommendations = async (
  database: KiranaDatabase = db,
  options: ReorderCalculationOptions = {}
): Promise<ReorderRecommendation[]> => {
  const [products, suppliers, sales] = await Promise.all([
    getAllProducts(database),
    getAllSuppliers(database),
    database.sales.toArray(),
  ]);

  const supplierMap = new Map<string, Supplier>();
  for (const s of suppliers) {
    supplierMap.set(s.id, s);
  }

  // Pre-aggregate sales history per product for high performance
  const salesByProduct = new Map<number, HistoricalSalePoint[]>();
  for (const sale of sales) {
    const saleDate = sale.createdAt || sale.timestamp || '';
    if (!saleDate || !sale.items) continue;

    for (const item of sale.items) {
      if (!item.productId) continue;
      const points = salesByProduct.get(item.productId) || [];
      points.push({
        quantity: item.quantity,
        date: saleDate,
      });
      salesByProduct.set(item.productId, points);
    }
  }

  const recommendations = products.map((product) => {
    const history = (product.id ? salesByProduct.get(product.id) : []) || [];
    const supplier = product.supplierId ? supplierMap.get(product.supplierId) : undefined;
    return calculateReorderForProduct(product, history, supplier, options);
  });

  // Sort so items requiring immediate restock appear first
  return recommendations.sort((a, b) => {
    // 1. Items with recommended quantity > 0 first
    if (a.recommendedQuantity > 0 && b.recommendedQuantity === 0) return -1;
    if (a.recommendedQuantity === 0 && b.recommendedQuantity > 0) return 1;

    // 2. Out of stock (0 stock) first
    if (a.currentStock === 0 && b.currentStock > 0) return -1;
    if (a.currentStock > 0 && b.currentStock === 0) return 1;

    // 3. Lowest ratio of current/minimum
    const ratioA = a.minimumStock > 0 ? a.currentStock / a.minimumStock : 1;
    const ratioB = b.minimumStock > 0 ? b.currentStock / b.minimumStock : 1;
    return ratioA - ratioB;
  });
};

/**
 * Formats a clean, readable distributor order list as plain text.
 * Omits internal cost prices or sensitive store data.
 */
export const generateDistributorOrderText = (params: {
  shopName: string;
  ownerName?: string;
  supplierName?: string;
  items: {
    productName: string;
    productNameHindi?: string;
    quantity: number;
    unit: string;
    currentStock?: number;
  }[];
  language?: 'hi' | 'en';
}): string => {
  const isHindi = params.language === 'hi';
  const header = `📦 *${params.shopName}* — ${
    isHindi ? 'सामान का नया ऑर्डर (Wholesale Order)' : 'Wholesale Reorder List'
  }\n`;

  const distributorLine = params.supplierName
    ? `${isHindi ? 'सप्लायर / डीलर' : 'Supplier'}: *${params.supplierName}*\n`
    : '';

  const dateLine = `📅 ${new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}\n--------------------\n`;

  const itemsList = params.items
    .filter((item) => item.quantity > 0)
    .map((item, idx) => {
      const name = isHindi ? item.productNameHindi || item.productName : item.productName;
      const current =
        item.currentStock !== undefined ? ` [${isHindi ? 'मौजूदा' : 'Current'}: ${item.currentStock} ${item.unit}]` : '';
      return `${idx + 1}. *${name}* : *+${item.quantity} ${item.unit}*${current}`;
    })
    .join('\n');

  const sender = params.ownerName
    ? `${params.ownerName} (${params.shopName})`
    : params.shopName;

  const footer = `\n--------------------\n🙏 ${
    isHindi ? 'भेजा गया' : 'Prepared by'
  }: ${sender}\n📱 KiranaSathi Offline Order`;

  return `${header}${distributorLine}${dateLine}${itemsList}${footer}`;
};

/**
 * Builds a WhatsApp web/app share URL with safely URI-encoded text
 */
export const buildWhatsAppOrderUrl = (
  phone: string | undefined,
  orderText: string
): string => {
  const encodedText = encodeURIComponent(orderText);
  if (!phone) {
    return `https://wa.me/?text=${encodedText}`;
  }

  // Normalize phone number (strip spaces, dashes, parentheses)
  const cleanedPhone = phone.replace(/[^0-9+]/g, '').replace(/^\+/, '');
  return `https://wa.me/${cleanedPhone}?text=${encodedText}`;
};
