import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  Product,
  Sale,
  ShopPreferences,
  Language,
  SaleCartItem,
} from '../types';
import {
  getAllProducts,
  addProduct as dbAddProduct,
  updateProduct as dbUpdateProduct,
  addStock as dbAddStock,
  adjustStock as dbAdjustStock,
  seedInitialSampleData,
  resetDatabaseToSampleData,
  getSlowMovingAnalysis,
} from '../services/inventoryService';
import {
  recordSale as dbRecordSale,
  getAllSales,
} from '../services/salesService';
import { Translations, t } from '../i18n';

interface SlowMovingItem {
  product: Product;
  lastSoldDate: string | null;
  daysSinceLastSale: number | null;
  isNewlyAdded: boolean;
  isSlowMoving: boolean;
}

interface ShopContextType {
  products: Product[];
  sales: Sale[];
  transactions: Sale[]; // Backward compatibility alias
  preferences: ShopPreferences;
  language: Language;
  isLoading: boolean;
  setLanguage: (lang: Language) => void;
  setShopName: (name: string, nameHindi?: string) => void;
  setOwnerName: (name: string) => void;

  // Real IndexedDB Mutations
  addProduct: (
    item: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'currentStock' | 'minThreshold'>
  ) => Promise<Product>;
  updateProduct: (id: number, updates: Partial<Omit<Product, 'id' | 'createdAt'>>) => Promise<Product>;
  addStock: (productId: number, quantityToAdd: number, note?: string) => Promise<Product>;
  adjustStock: (productId: number, newQuantity: number, reason?: string) => Promise<Product>;
  recordRealSale: (
    items: { productId: number; quantity: number }[],
    paymentMethod?: 'cash' | 'upi' | 'credit_udhaar'
  ) => Promise<Sale>;
  recordDemoSale: (
    items: SaleCartItem[],
    paymentMethod?: 'cash' | 'upi' | 'credit_udhaar'
  ) => Promise<Sale>;
  seedSampleCatalog: () => Promise<number>;
  resetToSampleData: () => Promise<number>;
  refreshData: () => Promise<void>;

  // Translation helper
  t: (key: keyof Translations) => string;

  // Computed summary metrics
  totalProducts: number;
  inStockCount: number;
  lowStockCount: number;
  slowMovingCount: number;
  todaySalesTotal: number;
  todaySalesCount: number;
  lowStockProducts: Product[];
  slowMovingAnalysis: SlowMovingItem[];
  slowMovingProducts: Product[]; // Backward compatibility
}

const PREF_STORAGE_KEY = 'kiranasathi_preferences_v2';

const defaultPreferences: ShopPreferences = {
  shopName: 'Radhe Kirana Store',
  shopNameHindi: 'राधे किराना स्टोर',
  ownerName: 'Ramesh Gupta',
  language: 'hi',
  currencySymbol: '₹',
};

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [slowMovingAnalysis, setSlowMovingAnalysis] = useState<SlowMovingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize preferences from localStorage if available
  const [preferences, setPreferences] = useState<ShopPreferences>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(PREF_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return defaultPreferences;
  });

  const language = preferences.language;

  // Persist preferences on change
  const savePreferences = (updated: ShopPreferences) => {
    setPreferences(updated);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch {
      // Ignore
    }
  };

  const setLanguage = (lang: Language) => {
    savePreferences({ ...preferences, language: lang });
  };

  const setShopName = (name: string, nameHindi?: string) => {
    savePreferences({
      ...preferences,
      shopName: name,
      shopNameHindi: nameHindi || name,
    });
  };

  const setOwnerName = (name: string) => {
    savePreferences({ ...preferences, ownerName: name });
  };

  // Reactive data loader from IndexedDB + MongoDB sync
  const refreshData = useCallback(async () => {
    try {
      const [allProducts, allSales] = await Promise.all([
        getAllProducts(),
        getAllSales(),
      ]);

      // If database is completely empty on first launch, optionally seed sample products
      if (allProducts.length === 0) {
        await seedInitialSampleData();
        const seededProducts = await getAllProducts();
        setProducts(seededProducts);
      } else {
        setProducts(allProducts);
      }

      setSales(allSales);

      // Analyze slow moving inventory from real sale records
      const slowAnalysis = await getSlowMovingAnalysis();
      setSlowMovingAnalysis(slowAnalysis);
    } catch (err) {
      console.error('Failed to load data from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Real Database Mutations
  const addProduct = async (
    item: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'currentStock' | 'minThreshold'>
  ): Promise<Product> => {
    const saved = await dbAddProduct(item);
    await refreshData();
    return saved;
  };

  const updateProduct = async (
    id: number,
    updates: Partial<Omit<Product, 'id' | 'createdAt'>>
  ): Promise<Product> => {
    const saved = await dbUpdateProduct(id, updates);
    await refreshData();
    return saved;
  };

  const addStock = async (
    productId: number,
    quantityToAdd: number,
    note?: string
  ): Promise<Product> => {
    const saved = await dbAddStock(productId, quantityToAdd, note);
    await refreshData();
    return saved;
  };

  const adjustStock = async (
    productId: number,
    newQuantity: number,
    reason?: string
  ): Promise<Product> => {
    const saved = await dbAdjustStock(productId, newQuantity, reason);
    await refreshData();
    return saved;
  };

  const recordRealSale = async (
    items: { productId: number; quantity: number }[],
    paymentMethod: 'cash' | 'upi' | 'credit_udhaar' = 'cash'
  ): Promise<Sale> => {
    const sale = await dbRecordSale({ items, paymentMethod });
    await refreshData();
    return sale;
  };

  // Backward compatible signature accepting cart items
  const recordDemoSale = async (
    items: SaleCartItem[],
    paymentMethod: 'cash' | 'upi' | 'credit_udhaar' = 'cash'
  ): Promise<Sale> => {
    return await recordRealSale(
      items.map((i) => ({ productId: i.product.id!, quantity: i.quantity })),
      paymentMethod
    );
  };

  const seedSampleCatalog = async (): Promise<number> => {
    const count = await seedInitialSampleData();
    await refreshData();
    return count;
  };

  const resetToSampleData = async (): Promise<number> => {
    const count = await resetDatabaseToSampleData();
    await refreshData();
    return count;
  };

  // Translation helper bound to current language
  const translate = (key: keyof Translations) => t(key, language);

  // Computed metrics from real data
  const totalProducts = products.length;

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.quantity <= p.minimumStock);
  }, [products]);

  const slowMovingProducts = useMemo(() => {
    return slowMovingAnalysis.filter((item) => item.isSlowMoving).map((item) => item.product);
  }, [slowMovingAnalysis]);

  const lowStockCount = lowStockProducts.length;
  const slowMovingCount = slowMovingProducts.length;
  const inStockCount = products.filter((p) => p.quantity > p.minimumStock).length;

  // Compute sales recorded today
  const todaySales = useMemo(() => {
    const today = new Date().toDateString();
    return sales.filter(
      (s) => new Date(s.createdAt || s.timestamp || Date.now()).toDateString() === today
    );
  }, [sales]);

  const todaySalesTotal = useMemo(() => {
    return todaySales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  }, [todaySales]);

  const todaySalesCount = todaySales.length;

  return (
    <ShopContext.Provider
      value={{
        products,
        sales,
        transactions: sales,
        preferences,
        language,
        isLoading,
        setLanguage,
        setShopName,
        setOwnerName,
        addProduct,
        updateProduct,
        addStock,
        adjustStock,
        recordRealSale,
        recordDemoSale,
        seedSampleCatalog,
        resetToSampleData,
        refreshData,
        t: translate,
        totalProducts,
        inStockCount,
        lowStockCount,
        slowMovingCount,
        todaySalesTotal,
        todaySalesCount,
        lowStockProducts,
        slowMovingAnalysis,
        slowMovingProducts,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = (): ShopContextType => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
