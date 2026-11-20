import React, { useState, useMemo } from 'react';
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
  Mic,
  Download,
  Search,
  Check,
  Copy,
  QrCode,
  ShieldCheck,
  Layers,
  Database,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Product } from '../types';
import { exportDatabaseBackup } from '../services/backupService';

export const HomePage: React.FC = () => {
  const {
    products,
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

  // Quick Catalog Search & Filter Hub (Admin Feature: Handle all items easily)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? t('greetingMorning')
      : currentHour < 17
      ? t('greetingAfternoon')
      : t('greetingEvening');

  const isHindi = language === 'hi';

  const categories: { key: string; label: string }[] = [
    { key: 'all', label: isHindi ? 'सभी सामान' : 'All Items' },
    { key: 'grains', label: t('catGrains') },
    { key: 'oil', label: t('catOil') },
    { key: 'spices', label: t('catSpices') },
    { key: 'snacks', label: t('catSnacks') },
    { key: 'dairy', label: t('catDairy') },
    { key: 'household', label: t('catHousehold') },
  ];

  // Filtered items for instant dashboard management
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim() && selectedCategory === 'all') return [];

    const query = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const name = p.name.toLowerCase();
      const hindi = (p.nameHindi || '').toLowerCase();
      const matchesSearch = !query || name.includes(query) || hindi.includes(query);
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

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
        isHindi
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

  const handleQuickExport = async () => {
    setIsExporting(true);
    try {
      const res = await exportDatabaseBackup();
      setExportNotice(
        isHindi
          ? `डेटा बैकअप सुरक्षित: ${res.recordCount} रिकॉर्ड्स डाउनलोड हुए`
          : `Database backup exported: ${res.recordCount} records downloaded`
      );
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      console.error('Backup error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyUpi = () => {
    if (!preferences.upiId) return;
    navigator.clipboard.writeText(preferences.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Stock health ratio
  const inStockRatio = totalProducts > 0 ? Math.round((inStockCount / totalProducts) * 100) : 100;

  return (
    <div className="space-y-4 sm:space-y-5" data-testid="home-page">
      {/* 1. Admin Header & Command Hub: Store Identity, Manager Greeting & Rapid Actions */}
      <section className="kirana-card p-4 sm:p-5 bg-white border-surface-border shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            {/* Store & Profile Metadata Badge Row */}
            <div className="flex items-center gap-2 mb-2 flex-wrap text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg font-bold bg-kirana-50 text-kirana-800 border border-kirana-200">
                <Store className="w-3.5 h-3.5 text-kirana-700" />
                {isHindi ? preferences.shopNameHindi : preferences.shopName}
              </span>

              <Badge variant="neutral">{t('shopBadge')}</Badge>

              {preferences.upiId && (
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-mono text-[11px] transition-colors"
                  title="Copy Store UPI ID"
                >
                  <QrCode className="w-3 h-3 text-kirana-700 shrink-0" />
                  <span>{preferences.upiId}</span>
                  {copiedUpi ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400" />
                  )}
                </button>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {greeting}, {preferences.ownerName}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {t('tagline')}
            </p>
          </div>

          {/* Admin Command Hub (Quick Sale, Add Stock, Voice POS, Backup) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link to="/sales" className="flex-1 sm:flex-initial">
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto gap-2 font-extrabold tracking-wide text-xs sm:text-sm shadow-xs"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>{t('btnQuickSale')}</span>
              </Button>
            </Link>

            <Link to="/inventory" className="flex-1 sm:flex-initial">
              <Button
                variant="secondary"
                size="md"
                className="w-full sm:w-auto gap-2 font-bold text-xs sm:text-sm"
              >
                <PlusCircle className="w-4 h-4 shrink-0 text-kirana-800" />
                <span>{t('btnAddProduct')}</span>
              </Button>
            </Link>

            <Link to="/sales" title="Voice POS Billing">
              <Button
                variant="outline"
                size="md"
                className="gap-1.5 font-bold text-xs sm:text-sm bg-kirana-50/50 hover:bg-kirana-100 text-kirana-900 border-kirana-300"
              >
                <Mic className="w-4 h-4 text-kirana-700" />
                <span className="hidden sm:inline">{isHindi ? 'बोलकर बिल' : 'Voice POS'}</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="md"
              onClick={handleQuickExport}
              disabled={isExporting}
              title="Export Offline Database Backup"
              className="gap-1.5 font-bold text-xs text-slate-700 border-slate-300 hover:bg-slate-50"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">{isHindi ? 'बैकअप' : 'Backup'}</span>
            </Button>
          </div>
        </div>

        {/* Instant Export Feedback Notification */}
        {exportNotice && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportNotice}</span>
            </div>
            <button onClick={() => setExportNotice(null)} className="p-1">
              <X className="w-3.5 h-3.5 text-emerald-700" />
            </button>
          </div>
        )}
      </section>

      {/* 2. Key Metrics Grid (4 Elevated Admin Metric Cards) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Metric 1: Total Catalog & Stock Health */}
        <Link
          to="/inventory"
          className="kirana-card p-3 sm:p-4 flex flex-col justify-between hover:border-slate-300 transition-colors group relative overflow-hidden"
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
            <div className="flex items-baseline justify-between gap-1">
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                {totalProducts}
              </p>
              <span className="text-[10px] font-bold text-slate-400">
                {inStockRatio}% {isHindi ? 'उपलब्ध' : 'avail'}
              </span>
            </div>

            {/* Visual Stock Availability Bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${inStockRatio}%` }}
              />
            </div>

            <p className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 mt-1 truncate">
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
              {todaySalesCount} {isHindi ? 'बिक्री पर्चियां दर्ज' : 'sales recorded today'}
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
              15+ {isHindi ? 'दिनों से स्थिर' : 'days without sale'}
            </p>
          </div>
        </Link>
      </section>

      {/* 3. Modular Quick Inventory Search & Filter Hub (Handle All Items Easily) */}
      <section className="kirana-card p-4 sm:p-5 bg-white border-surface-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-kirana-100 text-kirana-800 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
                {isHindi ? 'त्वरित स्टॉक खोज एवं प्रबंधन' : 'Quick Item Lookup & Fast Actions'}
              </h2>
              <p className="text-xs text-slate-500">
                {isHindi
                  ? 'दुकान का कोई भी सामान खोजें, तुरंत स्टॉक भरें या बिक्री में जोड़ें'
                  : 'Search any store item, restock immediately or add to active sale'}
              </p>
            </div>
          </div>

          <Link
            to="/inventory"
            className="text-xs font-bold text-kirana-800 hover:text-kirana-900 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>{isHindi ? 'पूरी स्टॉक सूची देखें' : 'View Full Catalog'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isHindi
                  ? 'सामान का नाम या श्रेणी खोजें (उदा: आटा, चावल, तेल)...'
                  : 'Search items by name or category (e.g. Atta, Rice, Oil)...'
              }
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-kirana-600 bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="scroll-pills-row text-xs py-0.5">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`shrink-0 touch-target px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors border shadow-2xs ${
                  selectedCategory === cat.key
                    ? 'bg-kirana-700 text-white border-kirana-700 shadow-kirana-700/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Filtered Results or Quick Suggestions */}
        {(searchQuery || selectedCategory !== 'all') && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600">
                {isHindi
                  ? `${filteredProducts.length} सामान मिले`
                  : `Found ${filteredProducts.length} matching items`}
              </span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline"
              >
                {isHindi ? 'फ़िल्टर हटाएं' : 'Reset filters'}
              </button>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                {filteredProducts.slice(0, 9).map((p) => {
                  const stock = p.quantity ?? p.currentStock ?? 0;
                  const threshold = p.minimumStock ?? p.minThreshold ?? 0;
                  const isLow = stock <= threshold;
                  const isOut = stock <= 0;

                  return (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {isHindi ? p.nameHindi || p.name : p.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                              isOut
                                ? 'bg-rose-100 text-rose-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {stock} {p.unit}
                          </span>
                          <span className="text-[11px] font-bold text-slate-700">
                            ₹{p.sellingPrice ?? 0}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenRestock(p)}
                          className="px-2 py-1 rounded-lg bg-kirana-50 text-kirana-900 hover:bg-kirana-100 border border-kirana-200 text-xs font-bold transition-colors"
                          title="Restock Item"
                        >
                          + {isHindi ? 'भरें' : 'Stock'}
                        </button>
                        <Link to="/sales">
                          <button
                            type="button"
                            className="px-2 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-colors"
                            title="Sell in POS"
                          >
                            {isHindi ? 'बिक्री' : 'Sell'}
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">
                {isHindi ? 'कोई सामान नहीं मिला' : 'No items match your search'}
              </p>
            )}
          </div>
        )}
      </section>

      {/* 4. Actionable Lists Grid: Low Stock Alert & Slow-Moving Stock */}
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
                          {isHindi ? item.nameHindi || item.name : item.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {isHindi ? 'न्यूनतम सीमा:' : 'Min threshold:'} {threshold} {item.unit}
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
                          + {isHindi ? 'भरें' : 'Restock'}
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
                          {isHindi ? item.nameHindi || item.name : item.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {isHindi ? 'स्टॉक:' : 'Stock:'} {stock} {item.unit}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {item.daysSinceLastSale ?? 15}+ {isHindi ? 'दिन' : 'days'}
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

      {/* 5. Recent Sales Ledger Stream */}
      <section className="kirana-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-kirana-700" />
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
              {t('sectionRecentSalesTitle')}
            </h2>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold">
            {isHindi ? 'स्थानीय IndexedDB लेजर' : 'Local IndexedDB Ledger'}
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
                            `${isHindi ? i.productNameHindi || i.productName : i.productName} (${i.quantity} ${i.unit})`
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

      {/* 6. Admin System & Offline Persistence Status Ribbon */}
      <section className="p-3 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <span>{isHindi ? 'ऑफ़लाइन-फर्स्ट डेटा इंजन सक्रिय' : 'Offline-First Engine Active'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </p>
            <p className="text-[11px] text-slate-300">
              {isHindi
                ? 'सभी 32 सामान, बिक्री पर्चियां एवं सप्लायर रिकॉर्ड्स आपके डिवाइस पर IndexedDB में सुरक्षित हैं।'
                : 'All products, bills, and wholesale orders are stored directly in your local browser database.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleQuickExport}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-kirana-400" />
          <span>{isHindi ? 'डेटा बैकअप लें (JSON)' : 'Export JSON Backup'}</span>
        </button>
      </section>

      {/* Actionable Restock Modal (1-Tap Stock replenishment directly from dashboard) */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="kirana-card p-5 max-w-sm w-full bg-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-kirana-700" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {isHindi ? 'स्टॉक जोड़ें' : 'Add Stock'}
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
                {isHindi ? restockProduct.nameHindi || restockProduct.name : restockProduct.name}
              </p>
              <p className="text-xs text-slate-500">
                {isHindi ? 'वर्तमान स्टॉक:' : 'Current Stock:'}{' '}
                <span className="font-bold text-amber-800">
                  {restockProduct.quantity ?? 0} {restockProduct.unit}
                </span>{' '}
                • {isHindi ? 'न्यूनतम:' : 'Min:'} {restockProduct.minimumStock ?? 0} {restockProduct.unit}
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
                  {isHindi ? 'जोड़ने की मात्रा' : 'Quantity to Add'} ({restockProduct.unit})
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
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isRestocking}
                  className="gap-1.5"
                >
                  {isRestocking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isHindi ? 'स्टॉक जोड़ें' : 'Save Stock'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
