import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  Clock,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Store,
  Plus,
  Loader2,
  X,
  Receipt,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Product } from '../types';

export const HomePage: React.FC = () => {
  const {
    preferences,
    language,
    t,
    totalProducts,
    inStockCount,
    lowStockCount,
    slowMovingCount,
    todaySalesTotal,
    todaySalesCount,
    lowStockProducts,
    slowMovingProducts,
    transactions,
    addStock,
  } = useShop();

  // Quick Restock Dialog state for actionable low stock items
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<string>('5');
  const [isRestocking, setIsRestocking] = useState<boolean>(false);
  const [restockSuccess, setRestockSuccess] = useState<string | null>(null);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? t('greetingMorning')
      : currentHour < 17
      ? t('greetingAfternoon')
      : t('greetingEvening');

  const handleOpenRestock = (p: Product) => {
    setRestockProduct(p);
    const needed = Math.max(1, (p.minimumStock ?? 0) - (p.quantity ?? 0));
    setRestockQty(String(needed > 0 ? needed : 5));
    setRestockSuccess(null);
  };

  const handleConfirmRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct?.id) return;
    const qty = parseFloat(restockQty);
    if (isNaN(qty) || qty <= 0) return;

    setIsRestocking(true);
    try {
      await addStock(restockProduct.id, qty, 'Quick restock from home dashboard');
      setRestockSuccess(
        language === 'hi'
          ? `+${qty} ${restockProduct.unit} स्टॉक जुड़ गया!`
          : `Added +${qty} ${restockProduct.unit} successfully!`
      );
      setTimeout(() => {
        setRestockProduct(null);
        setRestockSuccess(null);
      }, 700);
    } catch (err) {
      console.error('Failed to restock item:', err);
    } finally {
      setIsRestocking(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5" data-testid="home-page">
      {/* 1. Header Hero Card: Store Identity & Primary Actions */}
      <section className="kirana-card p-4 sm:p-5 bg-white border-surface-border shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-kirana-50 text-kirana-800 border border-kirana-200">
                <Store className="w-3.5 h-3.5 text-kirana-700" />
                {language === 'hi' ? preferences.shopNameHindi : preferences.shopName}
              </span>
              <Badge variant="neutral">{t('shopBadge')}</Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {greeting}, {preferences.ownerName}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {t('tagline')}
            </p>
          </div>

          {/* Prominent Primary Actions (Quick Sale & Add Stock) */}
          <div className="grid grid-cols-2 gap-2.5 shrink-0 w-full sm:w-auto">
            <Link to="/sales" className="w-full">
              <Button
                variant="primary"
                size="md"
                fullWidth
                className="gap-2 font-extrabold tracking-wide text-xs sm:text-sm shadow-xs"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>{t('btnQuickSale')}</span>
              </Button>
            </Link>
            <Link to="/inventory" className="w-full">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                className="gap-2 font-bold text-xs sm:text-sm"
              >
                <PlusCircle className="w-4 h-4 shrink-0 text-kirana-800" />
                <span>{t('btnAddProduct')}</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Key Metrics Grid (2x2 on Mobile, 4-Cols on Desktop) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Metric 1: Total Catalog */}
        <Link
          to="/inventory"
          className="kirana-card p-3 sm:p-4 flex flex-col justify-between hover:border-slate-300 transition-colors group"
        >
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[11px] sm:text-xs text-slate-600 font-semibold truncate">
              {t('statTotalProducts')}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
              {totalProducts}
            </p>
            <p className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 mt-0.5 truncate">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>{inStockCount} {t('statInStock')}</span>
            </p>
          </div>
        </Link>

        {/* Metric 2: Low Stock Alert (Actionable Highlight) */}
        <Link
          to="/reorder"
          className={`kirana-card p-3 sm:p-4 flex flex-col justify-between transition-colors group ${
            lowStockCount > 0
              ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50/70'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[11px] sm:text-xs text-amber-900 font-bold truncate">
              {t('statLowStock')}
            </span>
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                lowStockCount > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-extrabold text-amber-900 leading-tight">
              {lowStockCount}
            </p>
            <p className="text-[11px] text-amber-800 font-semibold flex items-center gap-0.5 mt-0.5 truncate">
              <span>{t('viewReorder')}</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
        </Link>

        {/* Metric 3: Today's Real Sales Ledger */}
        <Link
          to="/sales"
          className="kirana-card p-3 sm:p-4 flex flex-col justify-between hover:border-slate-300 transition-colors group"
        >
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[11px] sm:text-xs text-slate-600 font-semibold truncate">
              {t('statTodaySales')}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
              ₹{todaySalesTotal.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
              {todaySalesCount} {language === 'hi' ? 'बिक्री पर्चियां दर्ज' : 'sales recorded today'}
            </p>
          </div>
        </Link>

        {/* Metric 4: Slow-Moving Inventory */}
        <Link
          to="/reorder"
          className="kirana-card p-3 sm:p-4 flex flex-col justify-between hover:border-slate-300 transition-colors group"
        >
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[11px] sm:text-xs text-slate-600 font-semibold truncate">
              {t('statSlowMoving')}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
              {slowMovingCount}
            </p>
            <p className="text-[11px] text-blue-800 font-medium mt-0.5 truncate">
              15+ {language === 'hi' ? 'दिनों से स्थिर' : 'days without sale'}
            </p>
          </div>
        </Link>
      </section>

      {/* 3. Actionable Lists Grid: Low Stock Alert & Slow-Moving Stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Low Stock Preview Card */}
        <div className="kirana-card p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
                  {t('sectionLowStockTitle')}
                </h2>
              </div>
              <Link
                to="/reorder"
                className="text-xs font-bold text-kirana-800 hover:text-kirana-900 flex items-center gap-1"
              >
                <span>{t('viewAll')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-xs text-slate-500 mb-3">{t('sectionLowStockSubtitle')}</p>

            {lowStockProducts.length > 0 ? (
              <div className="space-y-2">
                {lowStockProducts.slice(0, 3).map((item) => {
                  const stock = item.quantity ?? item.currentStock ?? 0;
                  const threshold = item.minimumStock ?? item.minThreshold ?? 0;
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {language === 'hi' ? item.nameHindi || item.name : item.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {language === 'hi' ? 'न्यूनतम सीमा:' : 'Min threshold:'} {threshold} {item.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-amber-200 text-amber-900">
                          {stock} {item.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenRestock(item)}
                          className="px-2 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold transition-colors"
                          title="Quick Restock"
                        >
                          + {language === 'hi' ? 'भरें' : 'Restock'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium text-center border border-emerald-100">
                {t('noLowStock')}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link to="/reorder">
              <Button variant="outline" size="sm" fullWidth className="text-xs font-bold">
                {t('viewReorder')} ({lowStockCount})
              </Button>
            </Link>
          </div>
        </div>

        {/* Slow Moving Stock Preview Card */}
        <div className="kirana-card p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
                  {t('sectionSlowMovingTitle')}
                </h2>
              </div>
              <Link
                to="/reorder"
                className="text-xs font-bold text-kirana-800 hover:text-kirana-900 flex items-center gap-1"
              >
                <span>{t('viewAll')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-xs text-slate-500 mb-3">{t('sectionSlowMovingSubtitle')}</p>

            {slowMovingProducts.length > 0 ? (
              <div className="space-y-2">
                {slowMovingProducts.slice(0, 3).map((item) => {
                  const stock = item.quantity ?? item.currentStock ?? 0;
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {language === 'hi' ? item.nameHindi || item.name : item.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {language === 'hi' ? 'स्टॉक:' : 'Stock:'} {stock} {item.unit}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {item.daysSinceLastSale ?? 15}+ {language === 'hi' ? 'दिन' : 'days'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 text-slate-600 text-xs text-center border border-slate-100">
                {t('noSlowMoving')}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link to="/inventory">
              <Button variant="outline" size="sm" fullWidth className="text-xs font-bold">
                {t('inventoryTitle')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Recent Sales Ledger Stream */}
      <section className="kirana-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-kirana-700" />
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
              {t('sectionRecentSalesTitle')}
            </h2>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold">
            {language === 'hi' ? 'स्थानीय IndexedDB लेजर' : 'Local IndexedDB Ledger'}
          </span>
        </div>

        {transactions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {transactions.slice(0, 4).map((txn) => {
              const displayId = txn.receiptNumber || `KS-${txn.id}`;
              const amount = txn.totalAmount ?? 0;
              const dateStr = txn.createdAt || txn.timestamp || new Date().toISOString();
              return (
                <div key={txn.id || displayId} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900">{displayId}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {txn.paymentMethod === 'credit_udhaar' ? 'Udhaar' : txn.paymentMethod}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 truncate mt-0.5">
                      {txn.items
                        .map(
                          (i) =>
                            `${language === 'hi' ? i.productNameHindi || i.productName : i.productName} (${i.quantity} ${i.unit})`
                        )
                        .join(', ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-slate-900">
                      ₹{amount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(dateStr).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">{t('noRecentSales')}</p>
        )}
      </section>

      {/* Actionable Restock Modal (1-Tap Stock replenishment directly from dashboard) */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="kirana-card p-5 max-w-sm w-full bg-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-kirana-700" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {language === 'hi' ? 'स्टॉक जोड़ें' : 'Add Stock'}
                </h3>
              </div>
              <button
                onClick={() => setRestockProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                {language === 'hi' ? restockProduct.nameHindi || restockProduct.name : restockProduct.name}
              </p>
              <p className="text-xs text-slate-500">
                {language === 'hi' ? 'वर्तमान स्टॉक:' : 'Current Stock:'}{' '}
                <span className="font-bold text-amber-800">
                  {restockProduct.quantity ?? 0} {restockProduct.unit}
                </span>{' '}
                • {language === 'hi' ? 'न्यूनतम:' : 'Min:'} {restockProduct.minimumStock ?? 0} {restockProduct.unit}
              </p>
            </div>

            {restockSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{restockSuccess}</span>
              </div>
            )}

            <form onSubmit={handleConfirmRestock} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'hi' ? 'जोड़ने की मात्रा' : 'Quantity to Add'} ({restockProduct.unit})
                </label>
                <div className="flex items-center gap-2">
                  {[1, 5, 10, 25].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRestockQty(String(preset))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        restockQty === String(preset)
                          ? 'bg-kirana-700 text-white border-kirana-700'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-kirana-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRestockProduct(null)}
                  disabled={isRestocking}
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isRestocking}
                  className="gap-1.5"
                >
                  {isRestocking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{language === 'hi' ? 'स्टॉक जोड़ें' : 'Save Stock'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
