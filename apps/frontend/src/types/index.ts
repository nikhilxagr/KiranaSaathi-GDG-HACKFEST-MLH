export type NetworkStatus = 'online' | 'offline';

export type Language = 'hi' | 'en';

export type ProductUnit = 'kg' | 'gm' | 'litre' | 'packet' | 'piece';

export type ProductCategory =
  | 'grains'
  | 'oil'
  | 'spices'
  | 'snacks'
  | 'dairy'
  | 'household';

export interface HealthCheckResponse {
  success?: boolean;
  status: 'ok' | 'degraded' | 'error';
  service: string;
  appName?: string;
  version: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
}

export interface ReadinessResponse {
  success: boolean;
  ready: boolean;
  service: string;
  timestamp: string;
}

export type BackendConnectionStatus = 'connected' | 'unavailable' | 'checking';

export interface Product {
  id?: number;
  name: string;
  nameHindi?: string;
  barcode?: string;
  category: ProductCategory;
  quantity: number; // Stored as finite JavaScript number supporting fractional values (e.g. 2.5 kg)
  unit: ProductUnit;
  minimumStock: number; // Reorder threshold
  costPrice?: number;
  sellingPrice?: number;
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string

  // Backward-compatibility properties for existing Phase 1 components
  currentStock?: number;
  minThreshold?: number;
  daysSinceLastSale?: number;
}

// Backward-compatibility type alias for Phase 1 seed data & legacy components
export interface KiranaProduct {
  id?: number;
  name: string;
  nameHindi?: string;
  barcode?: string;
  category: ProductCategory;
  quantity?: number;
  unit: ProductUnit;
  minimumStock?: number;
  costPrice?: number;
  sellingPrice?: number;
  createdAt?: string;
  updatedAt?: string;
  currentStock: number;
  minThreshold: number;
  daysSinceLastSale?: number;
}

/**
 * Line item snapshot recorded inside a completed Sale
 */
export interface SaleItem {
  productId?: number;
  productName: string;
  productNameHindi?: string;
  quantity: number; // Supports fractional numbers (e.g. 0.5 litre)
  unit: ProductUnit;
  unitPrice?: number; // Optional price snapshot
  lineTotal?: number; // Optional line total (unitPrice * quantity)
  price?: number; // Backward-compatibility alias
  subtotal?: number; // Backward-compatibility alias
}

/**
 * Sale Record Data Model (IndexedDB Table: sales)
 */
export interface Sale {
  id?: number | string;
  receiptNumber?: string;
  items: SaleItem[];
  totalAmount?: number;
  paymentMethod: 'cash' | 'upi' | 'credit_udhaar';
  createdAt?: string; // ISO 8601 string
  timestamp?: string; // Backward-compatibility alias
  isDemo?: boolean;
}

// Backward-compatibility type alias
export type DemoSaleTransaction = Sale;

export type StockMovementType = 'sale' | 'restock' | 'adjustment';

/**
 * Stock Movement Ledger Data Model (IndexedDB Table: stockMovements)
 */
export interface StockMovement {
  id?: number;
  productId: number;
  productName: string;
  type: StockMovementType;
  quantityDelta: number; // Signed delta: negative for sale (-1.5), positive for restock (+10)
  resultingQuantity: number;
  saleId?: number;
  note?: string;
  createdAt: string; // ISO 8601 string
}

/**
 * Counter Cart item selected during quick sales
 */
export interface SaleCartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface ShopPreferences {
  shopName: string;
  shopNameHindi: string;
  ownerName: string;
  language: Language;
  currencySymbol: string;
}

export interface NavigationItem {
  name: string;
  hindiName: string;
  path: string;
  icon: string;
  badge?: string;
}
