import React from 'react';
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
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

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
  } = useShop();

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? t('greetingMorning')
      : currentHour < 17
      ? t('greetingAfternoon')
      : t('greetingEvening');

  return (
    <div className="space-y-5">
      {/* 1. Header Greeting & Shop Badge */}
      <section className="kirana-card p-4 sm:p-6 bg-gradient-to-r from-kirana-50/80 via-white to-emerald-50/40 border-kirana-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-kirana-100 text-kirana-800">
                <Store className="w-3.5 h-3.5" />
                {language === 'hi' ? preferences.shopNameHindi : preferences.shopName}
              </span>
              <Badge variant="neutral">{t('shopBadge')}</Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {greeting}, {preferences.ownerName}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {t('tagline')}
            </p>
          </div>

          {/* Primary Quick Actions */}
          <div className="flex items-center gap-2.5 pt-1 sm:pt-0">
            <Link to="/sales" className="flex-1 sm:flex-none">
              <Button
                variant="primary"
                size="md"
                className="w-full gap-2 font-bold shadow-md shadow-kirana-700/20"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{t('btnQuickSale')}</span>
              </Button>
            </Link>
            <Link to="/inventory" className="flex-1 sm:flex-none">
              <Button variant="secondary" size="md" className="w-full gap-2">
                <PlusCircle className="w-4 h-4 text-kirana-800" />
                <span>{t('btnAddProduct')}</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Key Inventory & Sales Summary Metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total Catalog */}
        <div className="kirana-card p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium truncate">{t('statTotalProducts')}</p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900">{totalProducts}</p>
            <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {inStockCount} {t('statInStock')}
            </p>
          </div>
        </div>

        {/* Metric 2: Low Stock Alert (Urgent Highlight) */}
        <Link
          to="/reorder"
          className={`kirana-card p-3.5 flex items-center gap-3 transition-colors ${
            lowStockCount > 0
              ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50'
              : 'hover:bg-slate-50'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-600 font-semibold truncate">{t('statLowStock')}</p>
            <p className="text-lg sm:text-xl font-extrabold text-amber-800">{lowStockCount}</p>
            <p className="text-[11px] text-amber-700 font-medium flex items-center gap-0.5">
              <span>{t('viewReorder')}</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
        </Link>

        {/* Metric 3: Today's Sales (Demo Data) */}
        <div className="kirana-card p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-xs text-slate-500 font-medium truncate">{t('statTodaySales')}</p>
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900">
              ₹{todaySalesTotal.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500">
              {todaySalesCount} {language === 'hi' ? 'बिक्री ट्रांजेक्शन' : 'transactions'}
            </p>
          </div>
        </div>

        {/* Metric 4: Slow-Moving Stock */}
        <Link
          to="/reorder"
          className="kirana-card p-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium truncate">{t('statSlowMoving')}</p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900">{slowMovingCount}</p>
            <p className="text-[11px] text-blue-700 font-medium">15+ {language === 'hi' ? 'दिनों से स्थिर' : 'days idle'}</p>
          </div>
        </Link>
      </section>

      {/* 3. Previews Grid: Low Stock Alert & Slow Moving */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Low Stock Preview Card */}
        <div className="kirana-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-sm sm:text-base text-slate-900">
                  {t('sectionLowStockTitle')}
                </h2>
              </div>
              <Link
                to="/reorder"
                className="text-xs font-semibold text-kirana-700 hover:text-kirana-900 flex items-center gap-1"
              >
                {t('viewAll')}
                <ArrowRight className="w-3 h-3" />
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
                        <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                          {language === 'hi' ? item.nameHindi : item.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {language === 'hi' ? 'न्यूनतम सीमा:' : 'Min threshold:'} {threshold} {item.unit}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-200 text-amber-900">
                          {stock} {item.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium text-center">
                {t('noLowStock')}
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <Link to="/reorder">
              <Button variant="outline" size="sm" fullWidth className="text-xs font-semibold">
                {t('viewReorder')} ({lowStockCount})
              </Button>
            </Link>
          </div>
        </div>

        {/* Slow Moving Preview Card */}
        <div className="kirana-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-sm sm:text-base text-slate-900">
                  {t('sectionSlowMovingTitle')}
                </h2>
              </div>
              <Link
                to="/reorder"
                className="text-xs font-semibold text-kirana-700 hover:text-kirana-900 flex items-center gap-1"
              >
                {t('viewAll')}
                <ArrowRight className="w-3 h-3" />
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
                        <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                          {language === 'hi' ? item.nameHindi : item.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {language === 'hi' ? 'स्टॉक:' : 'Stock:'} {stock} {item.unit}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {item.daysSinceLastSale ?? 30}+ {language === 'hi' ? 'दिन' : 'days'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 text-slate-600 text-xs text-center">
                {t('noSlowMoving')}
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <Link to="/inventory">
              <Button variant="outline" size="sm" fullWidth className="text-xs font-semibold">
                {t('inventoryTitle')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Recent Sales Stream */}
      <section className="kirana-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-kirana-700" />
            <h2 className="font-bold text-base text-slate-900">{t('sectionRecentSalesTitle')}</h2>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
            {language === 'hi' ? 'स्थानीय IndexedDB' : 'Local IndexedDB'}
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
                      <span className="text-xs font-bold text-slate-800">{displayId}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {txn.paymentMethod}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {txn.items
                        .map(
                          (i) =>
                            `${language === 'hi' ? (i.productNameHindi || i.productName) : i.productName} (${i.quantity} ${i.unit})`
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
    </div>
  );
};
