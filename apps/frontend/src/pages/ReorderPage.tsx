import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  PackageCheck,
  Sparkles,
  Plus,
  Loader2,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Product } from '../types';
import { calculateReorderSuggestion } from '../services/inventoryService';

export const ReorderPage: React.FC = () => {
  const {
    lowStockProducts,
    slowMovingAnalysis,
    preferences,
    addStock,
    t,
    language,
  } = useShop();

  const [activeTab, setActiveTab] = useState<'lowStock' | 'slowMoving'>('lowStock');
  const [copied, setCopied] = useState(false);

  // Quick Restock Dialog State
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<string>('5');
  const [isRestocking, setIsRestocking] = useState<boolean>(false);
  const [restockSuccess, setRestockSuccess] = useState<string | null>(null);

  // Suggested reorder formula: max(0, minimumStock - quantity)
  const getSuggestedQty = (p: Product): number => {
    const raw = calculateReorderSuggestion(p);
    return raw > 0 ? raw : 1;
  };

  // Prepares WhatsApp order message for the wholesale distributor
  const generateOrderText = (): string => {
    const storeTitle = language === 'hi' ? preferences.shopNameHindi : preferences.shopName;
    const header = `📦 *${storeTitle}* - ${
      language === 'hi' ? 'सामान का नया ऑर्डर (Wholesale Order)' : 'Wholesale Reorder List'
    }\n`;
    const dateStr = `📅 ${new Date().toLocaleDateString('en-IN')}\n--------------------\n`;

    const items = lowStockProducts
      .map((p, idx) => {
        const name = language === 'hi' ? p.nameHindi || p.name : p.name;
        const current = p.quantity ?? p.currentStock ?? 0;
        const suggested = getSuggestedQty(p);
        return `${idx + 1}. *${name}* : +${suggested} ${p.unit} (वर्तमान: ${current} ${p.unit})`;
      })
      .join('\n');

    const footer = `\n--------------------\n🙏 ${preferences.ownerName} द्वारा भेजा गया (KiranaSathi)`;
    return `${header}${dateStr}${items}${footer}`;
  };

  const handleCopyOrder = () => {
    const text = generateOrderText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(generateOrderText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleOpenRestock = (p: Product) => {
    const suggested = getSuggestedQty(p);
    setRestockProduct(p);
    setRestockQty(String(suggested));
    setRestockSuccess(null);
  };

  const handleConfirmRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct?.id) return;

    const parsed = parseFloat(restockQty);
    if (isNaN(parsed) || parsed <= 0) return;

    setIsRestocking(true);
    try {
      await addStock(restockProduct.id, parsed, 'Wholesale Restock');
      setRestockSuccess(
        language === 'hi'
          ? `+${parsed} ${restockProduct.unit} स्टॉक जुड़ गया!`
          : `Restocked +${parsed} ${restockProduct.unit} successfully!`
      );
      setTimeout(() => {
        setRestockProduct(null);
        setRestockSuccess(null);
      }, 1000);
    } catch (err) {
      console.error('Failed to restock:', err);
    } finally {
      setIsRestocking(false);
    }
  };

  const slowMovingItems = slowMovingAnalysis.filter((i) => i.isSlowMoving);
  const newlyAddedItems = slowMovingAnalysis.filter((i) => i.isNewlyAdded);

  return (
    <div className="space-y-4">
      {/* 1. Header & Primary WhatsApp/Copy Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('reorderTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {language === 'hi'
              ? 'सप्लायर को ऑर्डर भेजने और धीमी बिक्री वाले सामान की सूची'
              : 'Wholesale order generator & slow moving inventory monitor'}
          </p>
        </div>

        {lowStockProducts.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="md"
              onClick={handleCopyOrder}
              className="gap-2 font-semibold text-xs sm:text-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? t('orderCopied') : t('btnCopyOrder')}</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleWhatsAppShare}
              className="gap-2 font-bold text-xs sm:text-sm shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>{t('btnOrderWhatsApp')}</span>
            </Button>
          </div>
        )}
      </div>

      {/* 2. Section Selector Tabs: Urgent Low Stock vs Slow Moving */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('lowStock')}
          data-testid="low-stock-tab"
          className={`touch-target px-4 py-2.5 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'lowStock'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>{t('tabLowStock')}</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-extrabold">
            {lowStockProducts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('slowMoving')}
          data-testid="slow-moving-tab"
          className={`touch-target px-4 py-2.5 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'slowMoving'
              ? 'border-blue-600 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-blue-600" />
          <span>{t('tabSlowMoving')}</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 font-extrabold">
            {slowMovingItems.length}
          </span>
        </button>
      </div>

      {/* 3. Tab Content: Urgent Low-Stock Items */}
      {activeTab === 'lowStock' && (
        <div className="space-y-3" data-testid="low-stock-list">
          {/* Note Banner */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <span className="font-medium">
              {language === 'hi'
                ? 'ये उत्पाद सुरक्षा सीमा (Minimum Threshold) से कम हैं। सुझावित ऑर्डर मात्रा तुरंत स्टॉक पूरा करने के लिए है।'
                : 'These products are below their minimum threshold. Suggested reorder quantity brings inventory back to safety stock.'}
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded shrink-0 ml-2">
              {language === 'hi' ? 'IndexedDB' : 'Active DB'}
            </span>
          </div>

          {lowStockProducts.length > 0 ? (
            <div className="space-y-2.5">
              {lowStockProducts.map((product) => {
                const stock = product.quantity ?? product.currentStock ?? 0;
                const threshold = product.minimumStock ?? product.minThreshold ?? 0;
                const cost = product.costPrice ?? 0;
                const suggestedQty = getSuggestedQty(product);
                const isZeroStock = stock === 0;

                return (
                  <div
                    key={product.id}
                    data-testid={`low-stock-item-${product.name}`}
                    className="kirana-card p-4 border-amber-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    {/* Item Information */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isZeroStock ? (
                          <Badge
                            variant="warning"
                            dot
                            className="bg-rose-100 text-rose-800 border-rose-300"
                          >
                            {t('statusOutOfStock')}
                          </Badge>
                        ) : (
                          <Badge variant="warning" dot>
                            {t('statusLow')}
                          </Badge>
                        )}
                        <span className="text-xs font-semibold text-slate-500">
                          {product.category}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900">
                        {language === 'hi' ? product.nameHindi || product.name : product.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {language === 'hi' ? product.name : product.nameHindi || ''}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
                        <span>
                          {language === 'hi' ? 'मौजूदा स्टॉक:' : 'Current:'}{' '}
                          <strong
                            data-testid={`current-stock-${product.name}`}
                            className={isZeroStock ? 'text-rose-700' : 'text-amber-800'}
                          >
                            {stock} {product.unit}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          {language === 'hi' ? 'न्यूनतम सीमा:' : 'Min Threshold:'}{' '}
                          <strong>
                            {threshold} {product.unit}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Suggested Reorder & Quick Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 bg-amber-50/50 p-3 rounded-xl sm:bg-transparent sm:p-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] font-bold text-amber-900 block flex items-center sm:justify-end gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          {t('suggestedReorder')}
                        </span>
                        <span
                          data-testid={`suggested-reorder-${product.name}`}
                          className="text-lg font-extrabold text-kirana-800"
                        >
                          +{suggestedQty} {product.unit}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Est: ₹{Math.round(suggestedQty * cost).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenRestock(product)}
                        className="gap-1 font-bold text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'स्टॉक जोड़ें' : 'Restock'}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="kirana-card p-12 text-center max-w-md mx-auto my-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">{t('noLowStock')}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'hi'
                  ? 'सभी उत्पाद पर्याप्त मात्रा में उपलब्ध हैं।'
                  : 'All products are currently above their reorder threshold.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. Tab Content: Slow-Moving Stock Section */}
      {activeTab === 'slowMoving' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900">
            <span className="font-bold block mb-0.5">ℹ️ {t('slowMovingAdvice')}</span>
            <span>
              {language === 'hi'
                ? 'इन उत्पादों की बिक्री पिछले 30 या अधिक दिनों से नहीं हुई है। नए जुड़े उत्पाद (< 30 दिन) इस चेतावनी से सुरक्षित रखे गए हैं।'
                : 'These items have had zero sales for 30+ days based on actual sales records. Newly added products are excluded from slow-moving alerts.'}
            </span>
          </div>

          {slowMovingItems.length > 0 ? (
            <div className="space-y-2.5">
              {slowMovingItems.map((item) => {
                const p = item.product;
                const stock = p.quantity ?? p.currentStock ?? 0;
                return (
                  <div
                    key={p.id}
                    className="kirana-card p-4 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-400 block mb-0.5">
                        {p.category}
                      </span>
                      <h3 className="font-bold text-base text-slate-900">
                        {language === 'hi' ? p.nameHindi || p.name : p.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {language === 'hi' ? p.name : p.nameHindi || ''}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <span className="text-xs text-slate-400 block">{t('colStock')}</span>
                        <span className="text-sm font-bold text-slate-800">
                          {stock} {p.unit}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">
                          {language === 'hi' ? 'निष्क्रिय अवधि' : 'Inactive Period'}
                        </span>
                        <span className="text-sm font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                          {item.daysSinceLastSale !== null
                            ? `${item.daysSinceLastSale} ${t('daysIdle')}`
                            : language === 'hi'
                            ? '30+ दिनों से कोई बिक्री नहीं'
                            : '30+ days no sales'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="kirana-card p-12 text-center max-w-md mx-auto my-6">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl mx-auto flex items-center justify-center mb-3">
                <PackageCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">{t('noSlowMoving')}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'hi'
                  ? 'आपकी दुकान का सारा स्टॉक नियमित रूप से बिक रहा है!'
                  : 'All stock has healthy movement!'}
              </p>
            </div>
          )}

          {/* Newly Added Products Section */}
          {newlyAddedItems.length > 0 && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 mt-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {language === 'hi'
                    ? `हाल ही में जोड़े गए उत्पाद (${newlyAddedItems.length}) — धीमे स्टॉक से बाहर रखे गए`
                    : `Newly Added Items (${newlyAddedItems.length}) — Protected from slow-moving alerts`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {newlyAddedItems.map((item) => (
                  <span
                    key={item.product.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-white border border-slate-200 text-slate-700 font-medium"
                  >
                    <span>
                      {language === 'hi'
                        ? item.product.nameHindi || item.product.name
                        : item.product.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({item.product.quantity ?? item.product.currentStock ?? 0} {item.product.unit})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Restock Dialog */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="kirana-card w-full max-w-sm p-5 sm:p-6 bg-white animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                {language === 'hi' ? 'स्टॉक जोड़ें (Restock)' : 'Add Stock (Restock)'}
              </h3>
              <button
                type="button"
                onClick={() => setRestockProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3">
              <p className="font-bold text-sm text-slate-800">
                {language === 'hi'
                  ? restockProduct.nameHindi || restockProduct.name
                  : restockProduct.name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'hi' ? 'वर्तमान स्टॉक:' : 'Current Stock:'}{' '}
                <strong className="text-amber-800">
                  {restockProduct.quantity ?? restockProduct.currentStock ?? 0}{' '}
                  {restockProduct.unit}
                </strong>
              </p>

              {restockSuccess ? (
                <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{restockSuccess}</span>
                </div>
              ) : (
                <form onSubmit={handleConfirmRestock} className="space-y-3 mt-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'hi'
                        ? `प्राप्त मात्रा (${restockProduct.unit})`
                        : `Received Quantity (${restockProduct.unit})`}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      value={restockQty}
                      onChange={(e) => setRestockQty(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-kirana-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRestockProduct(null)}
                    >
                      {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={isRestocking}
                      className="gap-1 font-bold"
                    >
                      {isRestocking ? (
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
