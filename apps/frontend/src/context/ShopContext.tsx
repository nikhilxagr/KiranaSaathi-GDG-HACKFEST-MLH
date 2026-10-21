import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  KiranaProduct,
  DemoSaleTransaction,
  ShopPreferences,
  Language,
  SaleCartItem,
} from '../types';
import {
  INITIAL_MOCK_PRODUCTS,
  INITIAL_MOCK_TRANSACTIONS,
} from '../data/mockProducts';
import { Translations, t } from '../i18n';

interface ShopContextType {
  products: KiranaProduct[];
  transactions: DemoSaleTransaction[];
  preferences: ShopPreferences;
  language: Language;
  setLanguage: (lang: Language) => void;
  setShopName: (name: string, nameHindi?: string) => void;
  setOwnerName: (name: string) => void;
  addProduct: (
    item: Omit<KiranaProduct, 'id' | 'updatedAt' | 'daysSinceLastSale'>
  ) => KiranaProduct;
  updateProduct: (id: number, updates: Partial<KiranaProduct>) => void;
  recordDemoSale: (
    items: SaleCartItem[],
    paymentMethod?: 'cash' | 'upi' | 'credit_udhaar'
  ) => DemoSaleTransaction;
  resetToSampleData: () => void;

  // Translation helper
  t: (key: keyof Translations) => string;

  // Computed summary metrics
  totalProducts: number;
  inStockCount: number;
  lowStockCount: number;
  slowMovingCount: number;
  todaySalesTotal: number;
  todaySalesCount: number;
  lowStockProducts: KiranaProduct[];
  slowMovingProducts: KiranaProduct[];
}

const defaultPreferences: ShopPreferences = {
  shopName: 'Radhe Kirana Store',
  shopNameHindi: 'राधे किराना स्टोर',
  ownerName: 'Ramesh Gupta',
  language: 'hi',
  currencySymbol: '₹',
};

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [products, setProducts] = useState<KiranaProduct[]>(INITIAL_MOCK_PRODUCTS);
  const [transactions, setTransactions] = useState<DemoSaleTransaction[]>(
    INITIAL_MOCK_TRANSACTIONS
  );
  const [preferences, setPreferences] = useState<ShopPreferences>(defaultPreferences);

  const language = preferences.language;

  const setLanguage = (lang: Language) => {
    setPreferences((prev) => ({ ...prev, language: lang }));
  };

  const setShopName = (name: string, nameHindi?: string) => {
    setPreferences((prev) => ({
      ...prev,
      shopName: name,
      shopNameHindi: nameHindi || name,
    }));
  };

  const setOwnerName = (name: string) => {
    setPreferences((prev) => ({ ...prev, ownerName: name }));
  };

  const addProduct = (
    item: Omit<KiranaProduct, 'id' | 'updatedAt' | 'daysSinceLastSale'>
  ): KiranaProduct => {
    const newId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
    const newProduct: KiranaProduct = {
      ...item,
      id: newId,
      daysSinceLastSale: 0,
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (id: number, updates: Partial<KiranaProduct>) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const recordDemoSale = (
    items: SaleCartItem[],
    paymentMethod: 'cash' | 'upi' | 'credit_udhaar' = 'cash'
  ): DemoSaleTransaction => {
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    // In demo mode: reduce stock in memory to simulate active counter inventory
    setProducts((prev) =>
      prev.map((p) => {
        const soldItem = items.find((i) => i.product.id === p.id);
        if (soldItem) {
          const newStock = Math.max(0, p.currentStock - soldItem.quantity);
          return {
            ...p,
            currentStock: Number(newStock.toFixed(2)),
            daysSinceLastSale: 0,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    const newTxn: DemoSaleTransaction = {
      id: `TXN-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      items: items.map((i) => ({
        productName: i.product.name,
        productNameHindi: i.product.nameHindi,
        quantity: i.quantity,
        unit: i.product.unit,
        price: i.product.sellingPrice,
        subtotal: i.subtotal,
      })),
      totalAmount,
      paymentMethod,
      isDemo: true,
    };

    setTransactions((prev) => [newTxn, ...prev]);
    return newTxn;
  };

  const resetToSampleData = () => {
    setProducts(INITIAL_MOCK_PRODUCTS);
    setTransactions(INITIAL_MOCK_TRANSACTIONS);
    setPreferences(defaultPreferences);
  };

  // Helper translation function bound to current language
  const translate = (key: keyof Translations) => t(key, language);

  // Computed metrics
  const totalProducts = products.length;

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.currentStock <= p.minThreshold);
  }, [products]);

  const slowMovingProducts = useMemo(() => {
    return products.filter((p) => p.daysSinceLastSale >= 15);
  }, [products]);

  const lowStockCount = lowStockProducts.length;
  const slowMovingCount = slowMovingProducts.length;
  const inStockCount = products.filter((p) => p.currentStock > p.minThreshold).length;

  const todaySalesTotal = useMemo(() => {
    return transactions.reduce((acc, t) => acc + t.totalAmount, 0);
  }, [transactions]);

  const todaySalesCount = transactions.length;

  return (
    <ShopContext.Provider
      value={{
        products,
        transactions,
        preferences,
        language,
        setLanguage,
        setShopName,
        setOwnerName,
        addProduct,
        updateProduct,
        recordDemoSale,
        resetToSampleData,
        t: translate,
        totalProducts,
        inStockCount,
        lowStockCount,
        slowMovingCount,
        todaySalesTotal,
        todaySalesCount,
        lowStockProducts,
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
