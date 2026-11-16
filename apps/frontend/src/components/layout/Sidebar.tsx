import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Store,
  LayoutDashboard,
  Package,
  ShoppingCart,
  RefreshCw,
  Truck,
  Settings,
  Mic,
  PlusCircle,
  Download,
  RotateCcw,
  Check,
  Copy,
  QrCode,
  ShieldCheck,
  Languages,
  Database,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { exportDatabaseBackup } from '../../services/backupService';

export const Sidebar: React.FC = () => {
  const {
    preferences,
    language,
    setLanguage,
    t,
    totalProducts,
    lowStockCount,
    todaySalesTotal,
    resetToSampleData,
  } = useShop();

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  const isHindi = language === 'hi';

  const handleCopyUpi = () => {
    if (!preferences.upiId) return;
    navigator.clipboard.writeText(preferences.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportDatabaseBackup();
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 3000);
    } catch (err) {
      console.error('Backup failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Extract initials for the profile avatar (e.g. "Nikhil Agrahari" -> "NA")
  const getInitials = (name: string): string => {
    if (!name) return 'KS';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const navItems = [
    {
      to: '/',
      label: t('navHome'),
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/inventory',
      label: t('navInventory'),
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount}` : null,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      to: '/sales',
      label: t('navSales'),
      icon: ShoppingCart,
      badge: 'POS',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      to: '/reorder',
      label: t('navReorder'),
      icon: RefreshCw,
      badge: lowStockCount > 0 ? (isHindi ? 'रीऑर्डर' : 'Urgent') : null,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      to: '/settings',
      label: t('navSettings'),
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside
      className="hidden lg:flex flex-col w-64 xl:w-72 bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0 select-none z-20"
      aria-label="Desktop Sidebar Navigation"
    >
      {/* 1. App Brand Header & Version Badge */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
        <NavLink to="/" className="flex items-center gap-2.5 group min-w-0">
          <div className="w-9 h-9 rounded-xl bg-kirana-700 flex items-center justify-center text-white shadow-xs group-hover:bg-kirana-800 transition-colors shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base text-slate-900 tracking-tight leading-none">
                KiranaSathi
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
              {isHindi ? preferences.shopNameHindi : preferences.shopName}
            </p>
          </div>
        </NavLink>

        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
          v2.0
        </span>
      </div>

      {/* 2. Store Live Status Ribbon */}
      <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-[11px] font-bold text-slate-600 truncate">
            {isHindi ? 'ऑफ़लाइन लेजर' : 'Local IndexedDB'}
          </span>
        </div>
        <span className="text-[11px] font-mono font-extrabold text-emerald-800">
          ₹{todaySalesTotal.toLocaleString('en-IN')}
        </span>
      </div>

      {/* 3. Navigation Links List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-2 mb-1.5">
            {isHindi ? 'मेन्यू नेविगेशन' : 'NAVIGATION'}
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all group ${
                      isActive
                        ? 'bg-kirana-100/90 text-kirana-950 font-bold border border-kirana-300 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 text-slate-500 group-hover:text-kirana-700 transition-colors shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold border ${
                        item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Fast Action Shortcuts */}
        <div>
          <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-2 mb-1.5">
            {isHindi ? 'त्वरित टूल्स' : 'QUICK ACTIONS'}
          </p>
          <div className="space-y-1">
            <NavLink
              to="/sales"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Mic className="w-4 h-4 text-kirana-700 shrink-0" />
              <span className="truncate">{isHindi ? 'बोलकर काउंटर बिलिंग' : 'Voice Billing POS'}</span>
            </NavLink>

            <NavLink
              to="/inventory"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{isHindi ? 'स्टॉक प्रविष्टि' : 'Create Item Entry'}</span>
            </NavLink>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">{isHindi ? 'बैकअप डाउनलोड' : 'Export Backup'}</span>
              </div>
              {backupSuccess && <Check className="w-3.5 h-3.5 text-emerald-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom User Profile Card (Matches Reference Image) */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/60">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          {/* Avatar with Initials */}
          <div className="w-9 h-9 rounded-xl bg-kirana-700 text-white font-extrabold flex items-center justify-center text-xs shadow-xs shrink-0">
            {getInitials(preferences.ownerName)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold text-slate-900 truncate">
              {preferences.ownerName}
            </p>
            <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>{isHindi ? 'व्यवस्थापक • सक्रिय' : 'Store Admin • Verified'}</span>
            </p>
          </div>

          {preferences.upiId && (
            <button
              type="button"
              onClick={handleCopyUpi}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Copy UPI ID"
            >
              {copiedUpi ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
