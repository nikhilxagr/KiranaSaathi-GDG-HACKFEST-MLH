import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  PackageCheck,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const ReorderPage: React.FC = () => {
  const { lowStockProducts, slowMovingProducts, preferences, t, language } = useShop();

  const [activeTab, setActiveTab] = useState<'lowStock' | 'slowMoving'>('lowStock');
  const [copied, setCopied] = useState(false);

  // Suggested demo replenishment formula: (threshold * 2) - currentStock
  const getSuggestedReorderQty = (current: number, threshold: number): number => {
    const raw = threshold * 2 - current;
    return Math.max(1, Math.round(raw));
  };

  // Prepares WhatsApp order message for the local wholesale distributor
  const generateOrderText = (): string => {
    const storeTitle = language === 'hi' ? preferences.shopNameHindi : preferences.shopName;
    const header = `📦 *${storeTitle}* - ${language === 'hi' ? 'सामान का नया ऑर्डर (Order List)' : 'Wholesale Reorder List'}\n`;
    const dateStr = `📅 ${new Date().toLocaleDateString('en-IN')}\n--------------------\n`;

    const items = lowStockProducts
      .map((p, idx) => {
        const name = language === 'hi' ? p.nameHindi : p.name;
        const suggested = getSuggestedReorderQty(p.currentStock, p.minThreshold);
        return `${idx + 1}. *${name}* : ${suggested} ${p.unit} (वर्तमान: ${p.currentStock})`;
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
          className={`touch-target px-4 py-2.5 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'lowStock'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>{t('tabLowStock')}</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">
            {lowStockProducts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('slowMoving')}
          className={`touch-target px-4 py-2.5 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'slowMoving'
              ? 'border-blue-600 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-blue-600" />
          <span>{t('tabSlowMoving')}</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
            {slowMovingProducts.length}
          </span>
        </button>
      </div>

      {/* 3. Tab Content: Urgent Low-Stock Items */}
      {activeTab === 'lowStock' && (
        <div className="space-y-3">
          {/* Note Banner */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <span className="font-medium">
              {language === 'hi'
                ? 'ये उत्पाद न्यूनतम सीमा से कम हैं। सुझावित मात्रा डेमो फ़ॉर्मूले पर आधारित है।'
                : 'These items are below safety threshold. Suggested quantities are calculated for demo purposes.'}
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded shrink-0 ml-2">
              {t('demoBadge')}
            </span>
          </div>

          {lowStockProducts.length > 0 ? (
            <div className="space-y-2.5">
              {lowStockProducts.map((product) => {
                const suggestedQty = getSuggestedReorderQty(
                  product.currentStock,
                  product.minThreshold
                );
                const isZeroStock = product.currentStock === 0;

                return (
                  <div
                    key={product.id}
                    className="kirana-card p-4 border-amber-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    {/* Item Information */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isZeroStock ? (
                          <Badge variant="warning" dot className="bg-rose-100 text-rose-800 border-rose-300">
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
                        {language === 'hi' ? product.nameHindi : product.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {language === 'hi' ? product.name : product.nameHindi}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
                        <span>
                          {language === 'hi' ? 'मौजूदा स्टॉक:' : 'Current:'}{' '}
                          <strong className={isZeroStock ? 'text-rose-700' : 'text-amber-800'}>
                            {product.currentStock} {product.unit}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          {language === 'hi' ? 'न्यूनतम सीमा:' : 'Min Threshold:'}{' '}
                          <strong>
                            {product.minThreshold} {product.unit}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Suggested Reorder Box (Demo Suggestion) */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 bg-amber-50/50 p-3 rounded-xl sm:bg-transparent sm:p-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] font-bold text-amber-900 block flex items-center sm:justify-end gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          {t('suggestedReorder')}
                        </span>
                        <span className="text-lg font-extrabold text-kirana-800">
                          +{suggestedQty} {product.unit}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Est: ₹{Math.round(suggestedQty * product.costPrice).toLocaleString('en-IN')}
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
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900">
            <span className="font-bold block mb-0.5">ℹ️ {t('slowMovingAdvice')}</span>
            <span>
              {language === 'hi'
                ? 'इन उत्पादों की बिक्री 15 या अधिक दिनों से नहीं हुई है। इन्हें डिस्काउंट देकर निकालें या नया ऑर्डर न करें।'
                : 'These items have had zero sales for 15+ days. Recommended action: promote or avoid reordering.'}
            </span>
          </div>

          {slowMovingProducts.length > 0 ? (
            <div className="space-y-2.5">
              {slowMovingProducts.map((product) => (
                <div
                  key={product.id}
                  className="kirana-card p-4 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-400 block mb-0.5">
                      {product.category}
                    </span>
                    <h3 className="font-bold text-base text-slate-900">
                      {language === 'hi' ? product.nameHindi : product.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {language === 'hi' ? product.name : product.nameHindi}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-400 block">{t('colStock')}</span>
                      <span className="text-sm font-bold text-slate-800">
                        {product.currentStock} {product.unit}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">
                        {language === 'hi' ? 'अंतिम बिक्री' : 'Last Sold'}
                      </span>
                      <span className="text-sm font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {product.daysSinceLastSale} {t('daysIdle')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="kirana-card p-12 text-center max-w-md mx-auto my-6">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl mx-auto flex items-center justify-center mb-3">
                <PackageCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">{t('noSlowMoving')}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'hi'
                  ? 'आपकी दुकान का सारा स्टॉक तेजी से बिक रहा है!'
                  : 'All stock has healthy movement!'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
