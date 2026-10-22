import React, { useState, useMemo } from 'react';
import {
  Search,
  PlusCircle,
  AlertTriangle,
  X,
  PackageCheck,
  PackageX,
  DollarSign,
  Edit2,
  Plus,
  Loader2,
  CheckCircle2,
  Boxes,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AddProductModal } from '../features/inventory/AddProductModal';
import { Product, ProductCategory } from '../types';

export const InventoryPage: React.FC = () => {
  const { products, isLoading, addStock, seedSampleCatalog, t, language } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Quick Stock Addition Modal State
  const [stockActionProduct, setStockActionProduct] = useState<Product | null>(null);
  const [stockToAdd, setStockToAdd] = useState<string>('5');
  const [stockNote, setStockNote] = useState<string>('');
  const [isAddingStock, setIsAddingStock] = useState<boolean>(false);
  const [stockSuccessMsg, setStockSuccessMsg] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

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
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = product.name.toLowerCase().includes(q);
      const hindiMatch = (product.nameHindi || '').toLowerCase().includes(q);
      const barcodeMatch = product.barcode && product.barcode.includes(q);
      const matchesSearch = !q || nameMatch || hindiMatch || barcodeMatch;

      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      const stock = product.quantity ?? product.currentStock ?? 0;
      const threshold = product.minimumStock ?? product.minThreshold ?? 0;
      const matchesLowStock = !showLowStockOnly || stock <= threshold;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [products, searchQuery, selectedCategory, showLowStockOnly]);

  // Overall catalog stock value
  const totalStockValue = useMemo(() => {
    return products.reduce((sum, p) => {
      const stock = p.quantity ?? p.currentStock ?? 0;
      const price = p.sellingPrice ?? 0;
      return sum + stock * price;
    }, 0);
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

  const handleOpenAddStock = (p: Product) => {
    setStockActionProduct(p);
    setStockToAdd('5');
    setStockNote('');
    setStockSuccessMsg(null);
  };

  const handleConfirmAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockActionProduct?.id) return;

    const parsedQty = parseFloat(stockToAdd);
    if (isNaN(parsedQty) || parsedQty <= 0) return;

    setIsAddingStock(true);
    try {
      await addStock(
        stockActionProduct.id,
        parsedQty,
        stockNote.trim() || undefined
      );
      setStockSuccessMsg(
        language === 'hi'
          ? `+${parsedQty} ${stockActionProduct.unit} स्टॉक जुड़ गया!`
          : `Added +${parsedQty} ${stockActionProduct.unit} successfully!`
      );
      setTimeout(() => {
        setStockActionProduct(null);
        setStockSuccessMsg(null);
      }, 800);
    } catch (err) {
      console.error('Failed to add stock:', err);
    } finally {
      setIsAddingStock(false);
    }
  };

  const handleSeedSampleData = async () => {
    setIsSeeding(true);
    try {
      await seedSampleCatalog();
    } catch (err) {
      console.error('Failed to seed sample catalog:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="inventory-page">
      {/* 1. Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('inventoryTitle')}
          </h1>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
            <span data-testid="total-products-count">
              {products.length} {language === 'hi' ? 'सामान दर्ज हैं' : 'total items'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <DollarSign className="w-3 h-3 text-kirana-700" />
              {language === 'hi' ? 'अनुमानित मूल्य:' : 'Est. Value:'} ₹
              {Math.round(totalStockValue).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          className="gap-2 font-bold shrink-0 shadow-sm"
          onClick={() => setIsAddModalOpen(true)}
          data-testid="add-product-button"
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
            data-testid="search-inventory-input"
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
            data-testid="filter-low-stock-toggle"
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
      {isLoading ? (
        /* Loading skeleton while refreshing IndexedDB/MongoDB */
        <div className="kirana-card p-12 text-center max-w-md mx-auto my-6 space-y-3" data-testid="loading-indicator">
          <Loader2 className="w-8 h-8 text-kirana-700 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700">
            {language === 'hi' ? 'डेटा लोड हो रहा है...' : 'Loading catalog...'}
          </p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="space-y-2.5" data-testid="product-list">
          {filteredProducts.map((product) => {
            const stock = product.quantity ?? product.currentStock ?? 0;
            const threshold = product.minimumStock ?? product.minThreshold ?? 0;
            const price = product.sellingPrice ?? 0;
            const isOutOfStock = stock === 0;
            const isLowStock = !isOutOfStock && stock <= threshold;
            const itemValue = stock * price;

            return (
              <div
                key={product.id || product.name}
                data-testid={`product-card-${product.name}`}
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
                      <Badge
                        variant="warning"
                        dot
                        className="bg-rose-100 text-rose-800 border-rose-300"
                      >
                        {t('statusOutOfStock')}
                      </Badge>
                    ) : isLowStock ? (
                      <Badge variant="warning" dot>
                        {t('statusLow')}
                      </Badge>
                    ) : (
                      <Badge variant="success">{t('statusHealthy')}</Badge>
                    )}
                  </div>

                  <h3
                    className="font-bold text-slate-900 text-sm sm:text-base leading-snug"
                    data-testid={`product-title-${product.name}`}
                  >
                    {language === 'hi' ? product.nameHindi || product.name : product.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'hi' ? product.name : product.nameHindi || ''}
                  </p>
                </div>

                {/* Stock Details, Pricing & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Stock Quantity */}
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 block">{t('colStock')}</span>
                    <span
                      data-testid={`stock-${product.name}`}
                      className={`text-base font-extrabold ${
                        isOutOfStock
                          ? 'text-rose-700'
                          : isLowStock
                          ? 'text-amber-700'
                          : 'text-slate-900'
                      }`}
                    >
                      {stock} {product.unit}
                    </span>
                    <span
                      data-testid={`min-stock-${product.name}`}
                      className="text-[11px] text-slate-400 block"
                    >
                      Min: {threshold} {product.unit}
                    </span>
                  </div>

                  {/* Price & Value */}
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">{t('colPrice')}</span>
                    <span className="text-base font-extrabold text-slate-900">
                      ₹{price}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Val: ₹{Math.round(itemValue).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Quick Action Buttons: Add Stock & Edit */}
                  <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenAddStock(product)}
                      title={language === 'hi' ? 'स्टॉक जोड़ें' : 'Add Stock'}
                      className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-kirana-50 hover:border-kirana-400 text-slate-700 hover:text-kirana-800 transition-colors"
                      aria-label="Add Stock"
                      data-testid={`add-stock-btn-${product.name}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(product)}
                      title={language === 'hi' ? 'उत्पाद बदलें' : 'Edit Product'}
                      className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors"
                      aria-label="Edit Product"
                      data-testid={`edit-product-btn-${product.name}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : products.length === 0 ? (
        /* Empty Catalog - First Run State */
        <div className="kirana-card p-8 sm:p-12 text-center max-w-lg mx-auto my-6 space-y-4" data-testid="empty-catalog-state">
          <div className="w-16 h-16 bg-kirana-50 text-kirana-700 rounded-2xl mx-auto flex items-center justify-center">
            <Boxes className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              {language === 'hi'
                ? 'आपकी दुकान का डेटाबेस खाली है'
                : 'Your Local Catalog is Empty'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-sm mx-auto">
              {language === 'hi'
                ? 'नया सामान जोड़ें या तुरंत परीक्षण के लिए 16 सामान्य भारतीय किराना उत्पाद लोड करें।'
                : 'Add your own products or load 16 realistic Indian kirana items to get started.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleSeedSampleData}
              disabled={isSeeding}
              className="gap-2 font-bold w-full sm:w-auto shadow-sm"
              data-testid="load-sample-products-button"
            >
              {isSeeding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PackageCheck className="w-4 h-4" />
              )}
              <span>
                {language === 'hi'
                  ? '16 नमूना उत्पाद लोड करें'
                  : 'Load 16 Sample Products'}
              </span>
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsAddModalOpen(true)}
              className="gap-2 font-semibold w-full sm:w-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('btnAddProduct')}</span>
            </Button>
          </div>
        </div>
      ) : (
        /* Filter Empty State */
        <div className="kirana-card p-12 text-center max-w-md mx-auto my-6">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl mx-auto flex items-center justify-center mb-3">
            <PackageX className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {language === 'hi' ? 'कोई सामान नहीं मिला' : 'No products found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'hi'
              ? 'खोज शब्द बदलकर देखें या फ़िल्टर हटाएं।'
              : 'Try adjusting your search query or filters.'}
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

      {/* Add New Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Existing Product Modal */}
      {editingProduct && (
        <AddProductModal
          isOpen={Boolean(editingProduct)}
          onClose={() => setEditingProduct(null)}
          productToEdit={editingProduct}
        />
      )}

      {/* Quick Add Stock Modal Dialog */}
      {stockActionProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="kirana-card w-full max-w-sm p-5 sm:p-6 bg-white animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                {language === 'hi' ? 'स्टॉक जोड़ें (Restock)' : 'Add Stock (Restock)'}
              </h3>
              <button
                type="button"
                onClick={() => setStockActionProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3">
              <p className="font-bold text-sm text-slate-800">
                {language === 'hi'
                  ? stockActionProduct.nameHindi || stockActionProduct.name
                  : stockActionProduct.name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'hi' ? 'वर्तमान स्टॉक:' : 'Current Stock:'}{' '}
                <strong className="text-slate-700">
                  {stockActionProduct.quantity ?? stockActionProduct.currentStock ?? 0}{' '}
                  {stockActionProduct.unit}
                </strong>
              </p>

              {stockSuccessMsg ? (
                <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{stockSuccessMsg}</span>
                </div>
              ) : (
                <form onSubmit={handleConfirmAddStock} className="space-y-3 mt-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'hi'
                        ? `कितनी मात्रा जोड़नी है? (${stockActionProduct.unit})`
                        : `Quantity to add (${stockActionProduct.unit})`}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      value={stockToAdd}
                      onChange={(e) => setStockToAdd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-kirana-500"
                      data-testid="quick-restock-quantity-input"
                    />

                    {/* Quick increment pills */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {[1, 5, 10, 25].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setStockToAdd(String(amt))}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-kirana-50 hover:border-kirana-300 text-slate-700 transition-colors"
                        >
                          +{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'hi' ? 'विवरण / स्रोत (वैकल्पिक)' : 'Note / Supplier (Optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        language === 'hi'
                          ? 'उदा. थोक मंडी से खरीद'
                          : 'e.g. Wholesale replenishment'
                      }
                      value={stockNote}
                      onChange={(e) => setStockNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-kirana-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setStockActionProduct(null)}
                    >
                      {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={isAddingStock}
                      className="gap-1 font-bold"
                      data-testid="confirm-quick-restock-button"
                    >
                      {isAddingStock ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      <span>{language === 'hi' ? 'स्टॉक जोड़ें' : 'Save Stock'}</span>
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
