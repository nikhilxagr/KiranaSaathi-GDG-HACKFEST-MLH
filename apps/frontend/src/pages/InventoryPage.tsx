import React, { useState, useMemo } from 'react';
import {
  Search,
  PlusCircle,
  AlertTriangle,
  X,
  PackageCheck,
  PackageX,
  DollarSign,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AddProductModal } from '../features/inventory/AddProductModal';
import { ProductCategory } from '../types';

export const InventoryPage: React.FC = () => {
  const { products, t, language } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const categories: { key: string; label: string }[] = [
    { key: 'all', label: t('filterAll') },
    { key: 'grains', label: t('catGrains') },
    { key: 'oil', label: t('catOil') },
    { key: 'spices', label: t('catSpices') },
    { key: 'snacks', label: t('catSnacks') },
    { key: 'dairy', label: t('catDairy') },
    { key: 'household', label: t('catHousehold') },
  ];

  // Filtered product catalog
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Search filter (English name, Hindi name, or Barcode)
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.nameHindi.toLowerCase().includes(q) ||
        (product.barcode && product.barcode.includes(q));

      // 2. Category filter
      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      // 3. Low stock filter
      const matchesLowStock = !showLowStockOnly || product.currentStock <= product.minThreshold;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [products, searchQuery, selectedCategory, showLowStockOnly]);

  // Overall catalog stock value
  const totalStockValue = useMemo(() => {
    return products.reduce(
      (sum, p) => sum + p.currentStock * p.sellingPrice,
      0
    );
  }, [products]);

  const getCategoryLabel = (cat: ProductCategory) => {
    switch (cat) {
      case 'grains':
        return t('catGrains');
      case 'oil':
        return t('catOil');
      case 'spices':
        return t('catSpices');
      case 'snacks':
        return t('catSnacks');
      case 'dairy':
        return t('catDairy');
      case 'household':
        return t('catHousehold');
      default:
        return cat;
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('inventoryTitle')}
          </h1>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
            <span>{products.length} {language === 'hi' ? 'सामान दर्ज हैं' : 'total items'}</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <DollarSign className="w-3 h-3 text-kirana-700" />
              {language === 'hi' ? 'अनुमानित मूल्य:' : 'Est. Value:'} ₹{Math.round(totalStockValue).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          className="gap-2 font-bold shrink-0 shadow-sm"
          onClick={() => setIsAddModalOpen(true)}
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('btnAddProduct')}</span>
        </Button>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="kirana-card p-3 sm:p-4 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500 bg-surface/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear Search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filter Buttons & Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {/* Low Stock Toggle Pill */}
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`touch-target px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
              showLowStockOnly
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t('filterLowStock')}</span>
          </button>

          <span className="w-px h-5 bg-slate-200 shrink-0" />

          {/* Category Filter Pills */}
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`touch-target px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors border ${
                selectedCategory === cat.key
                  ? 'bg-kirana-700 text-white border-kirana-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Product Catalog List */}
      {filteredProducts.length > 0 ? (
        <div className="space-y-2">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.currentStock === 0;
            const isLowStock = !isOutOfStock && product.currentStock <= product.minThreshold;
            const itemValue = product.currentStock * product.sellingPrice;

            return (
              <div
                key={product.id}
                className={`kirana-card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isOutOfStock
                    ? 'border-rose-300 bg-rose-50/20'
                    : isLowStock
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'hover:border-slate-300'
                }`}
              >
                {/* Product Name & Category */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {getCategoryLabel(product.category)}
                    </span>
                    {isOutOfStock ? (
                      <Badge variant="warning" dot className="bg-rose-100 text-rose-800 border-rose-300">
                        {t('statusOutOfStock')}
                      </Badge>
                    ) : isLowStock ? (
                      <Badge variant="warning" dot>
                        {t('statusLow')}
                      </Badge>
                    ) : (
                      <Badge variant="success">
                        {t('statusHealthy')}
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                    {language === 'hi' ? product.nameHindi : product.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'hi' ? product.name : product.nameHindi}
                  </p>
                </div>

                {/* Stock Details & Pricing */}
                <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Stock Quantity */}
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 block">{t('colStock')}</span>
                    <span
                      className={`text-base font-extrabold ${
                        isOutOfStock
                          ? 'text-rose-700'
                          : isLowStock
                          ? 'text-amber-700'
                          : 'text-slate-900'
                      }`}
                    >
                      {product.currentStock} {product.unit}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Min: {product.minThreshold} {product.unit}
                    </span>
                  </div>

                  {/* Price & Value */}
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">{t('colPrice')}</span>
                    <span className="text-base font-extrabold text-slate-900">
                      ₹{product.sellingPrice}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Val: ₹{Math.round(itemValue).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="kirana-card p-12 text-center max-w-md mx-auto my-6">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl mx-auto flex items-center justify-center mb-3">
            <PackageX className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {language === 'hi' ? 'कोई सामान नहीं मिला' : 'No products found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'hi'
              ? 'खोज शब्द बदलकर देखें या नया सामान जोड़ें।'
              : 'Try adjusting your search or category filters.'}
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setShowLowStockOnly(false);
              }}
            >
              {language === 'hi' ? 'फ़िल्टर हटाएं' : 'Reset Filters'}
            </Button>
          </div>
        </div>
      )}

      {/* Add Product Modal Dialog */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
