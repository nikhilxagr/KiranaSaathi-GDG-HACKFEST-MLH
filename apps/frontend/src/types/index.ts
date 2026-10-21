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
  status: 'ok' | 'degraded' | 'error';
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
}

export interface KiranaProduct {
  id: number;
  name: string;
  nameHindi: string;
  barcode?: string;
  category: ProductCategory;
  costPrice: number;
  sellingPrice: number;
  currentStock: number; // Supports fractional numbers like 2.5 kg
  minThreshold: number;
  unit: ProductUnit;
  daysSinceLastSale: number; // Identifies slow-moving items (e.g. > 15 days)
  updatedAt: string;
}

export interface SaleCartItem {
  product: KiranaProduct;
  quantity: number;
  subtotal: number;
}

export interface DemoSaleTransaction {
  id: string;
  timestamp: string;
  items: {
    productName: string;
    productNameHindi: string;
    quantity: number;
    unit: ProductUnit;
    price: number;
    subtotal: number;
  }[];
  totalAmount: number;
  paymentMethod: 'cash' | 'upi' | 'credit_udhaar';
  isDemo: true;
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
