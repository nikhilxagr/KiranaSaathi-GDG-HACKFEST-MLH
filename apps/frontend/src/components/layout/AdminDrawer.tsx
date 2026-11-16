import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  X,
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
  ChevronRight,
  ShieldCheck,
  Languages,
  Database,
  QrCode,
  FileSpreadsheet,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { exportDatabaseBackup } from '../../services/backupService';

interface AdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DrawerMenuItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | null;
  badgeColor?: string;
}

interface DrawerSection {
  title: string;
  items: DrawerMenuItem[];
}

export const AdminDrawer: React.FC<AdminDrawerProps> = ({ isOpen, onClose }) => {
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
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

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
      const res = await exportDatabaseBackup();
      setBackupMessage(
        isHindi
          ? `बैकअप सुरक्षित: ${res.recordCount} रिकॉर्ड्स डाउनलोड हुए`
          : `Backup saved: ${res.recordCount} records downloaded`
      );
      setTimeout(() => setBackupMessage(null), 4000);
    } catch (err) {
      console.error('Backup failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetCatalog = async () => {
    try {
      await resetToSampleData();
      setShowResetConfirm(false);
      onClose();
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  const menuSections: DrawerSection[] = [
    {
      title: isHindi ? 'दुकान संचालन (Operations)' : 'Store Operations',
      items: [
        {
          to: '/',
          label: isHindi ? 'डैशबोर्ड एवं सारांश' : 'Dashboard & Overview',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          to: '/sales',
          label: isHindi ? 'काउंटर बिक्री (POS Billing)' : 'Counter POS Billing',
          icon: ShoppingCart,
          badge: isHindi ? 'QR पर्ची' : 'UPI QR',
        },
        {
          to: '/sales',
          label: isHindi ? 'आवाज़ से बिलिंग (Voice POS)' : 'Voice Billing Assistant',
          icon: Mic,
          badge: isHindi ? 'बोलकर' : 'Mic',
        },
      ],
    },
    {
      title: isHindi ? 'स्टॉक एवं सामान (Inventory)' : 'Inventory Management',
      items: [
        {
          to: '/inventory',
          label: isHindi ? 'सामान मास्टर सूची' : 'Master Stock Catalog',
          icon: Package,
          badge: `${totalProducts} SKUs`,
        },
        {
          to: '/inventory',
          label: isHindi ? 'नया सामान जोड़ें' : 'Add New Product',
          icon: PlusCircle,
          badge: null,
        },
        {
          to: '/reorder',
          label: isHindi ? 'स्टॉक प्राप्ति (Goods Inward)' : 'Receive Stock Delivery',
          icon: Truck,
          badge: null,
        },
      ],
    },
    {
      title: isHindi ? 'पुनः ऑर्डर एवं सप्लायर (Supply Chain)' : 'Supply Chain & Reorder',
      items: [
        {
          to: '/reorder',
          label: isHindi ? 'स्मार्ट रीऑर्डर सिफारिशें' : 'Predictive Reorder Engine',
          icon: RefreshCw,
          badge: lowStockCount > 0 ? `${lowStockCount} ${isHindi ? 'कम' : 'low'}` : null,
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        },
        {
          to: '/reorder',
          label: isHindi ? 'थोक सप्लायर डायरेक्टरी' : 'Wholesale Suppliers',
          icon: Truck,
          badge: null,
        },
      ],
    },
    {
      title: isHindi ? 'व्यवस्थापन एवं सेटिंग्स (Admin)' : 'Admin & System',
      items: [
        {
          to: '/settings',
          label: isHindi ? 'दुकान प्रोफाइल एवं UPI सेटिंग्स' : 'Shop Profile & UPI Settings',
          icon: Settings,
          badge: null,
        },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex"
      data-testid="admin-drawer-container"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <aside className="relative w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 border-r border-slate-200">
        {/* 1. Drawer Header: Shop & Manager Profile */}
        <div className="p-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-kirana-600 text-white flex items-center justify-center font-black shadow-sm">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                    KiranaSathi
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {isHindi ? 'व्यवस्थापक' : 'Admin'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  {isHindi ? preferences.shopNameHindi : preferences.shopName}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close menu"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Manager & UPI Banner */}
          <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60 flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {isHindi ? 'दुकानदार / संचालक' : 'Store Manager'}
              </p>
              <p className="font-bold text-white truncate text-xs sm:text-sm">
                {preferences.ownerName}
              </p>
            </div>
            {preferences.upiId && (
              <button
                type="button"
                onClick={handleCopyUpi}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-all text-[11px] font-mono"
                title="Copy UPI ID"
              >
                <QrCode className="w-3.5 h-3.5 text-kirana-400 shrink-0" />
                <span className="truncate max-w-[110px]">{preferences.upiId}</span>
                {copiedUpi ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* 2. Quick Store KPI Snapshot Strip */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-slate-50 border-b border-slate-200 text-center">
          <div className="p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
            <p className="text-[10px] font-bold text-slate-500 uppercase truncate">
              {isHindi ? 'आज बिक्री' : "Today's Sales"}
            </p>
            <p className="text-sm font-extrabold text-emerald-800 mt-0.5 truncate">
              ₹{todaySalesTotal.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
            <p className="text-[10px] font-bold text-slate-500 uppercase truncate">
              {isHindi ? 'कम स्टॉक' : 'Low Stock'}
            </p>
            <p className={`text-sm font-extrabold mt-0.5 truncate ${lowStockCount > 0 ? 'text-amber-800' : 'text-slate-700'}`}>
              {lowStockCount} {isHindi ? 'सामान' : 'items'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
            <p className="text-[10px] font-bold text-slate-500 uppercase truncate">
              {isHindi ? 'कुल SKUs' : 'Total SKUs'}
            </p>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5 truncate">
              {totalProducts}
            </p>
          </div>
        </div>

        {/* 3. Scrollable Navigation Menu Sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <h3 className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider px-2 mb-1">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={itemIdx}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                          isActive && item.to !== '/sales' && item.to !== '/reorder' && item.to !== '/inventory'
                            ? 'bg-kirana-100 text-kirana-900 font-bold border border-kirana-300 shadow-2xs'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-4 h-4 text-kirana-700 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
                              item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}

          {/* 4. Admin Utility Actions */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <h3 className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider px-2">
              {isHindi ? 'डेटा एवं बैकअप टूल्स' : 'Data & Offline Tools'}
            </h3>

            {/* Offline Database Backup Download */}
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-kirana-700 shrink-0" />
                <span>{isHindi ? 'ऑफ़लाइन डेटा बैकअप डाउनलोड करें' : 'Export Offline Database Backup'}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                JSON
              </span>
            </button>

            {backupMessage && (
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{backupMessage}</span>
              </div>
            )}

            {/* Reset Catalog Helper with Confirm */}
            {showResetConfirm ? (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                <p className="text-xs text-rose-900 font-bold">
                  {isHindi
                    ? 'क्या आप पूरा डेटा रीसेट करना चाहते हैं?'
                    : 'Reset all records to sample catalog?'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetCatalog}
                    className="flex-1 py-1 px-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
                  >
                    {isHindi ? 'हाँ, रीसेट करें' : 'Yes, Reset'}
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="py-1 px-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold"
                  >
                    {isHindi ? 'रद्द करें' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isHindi ? 'सैंपल डेटा रीसेट करें' : 'Reset Sample Data'}</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* 5. Drawer Footer: Language Toggle & Engine Status */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all shadow-2xs"
            >
              <Languages className="w-3.5 h-3.5 text-kirana-700" />
              <span>{language === 'hi' ? 'Switch to English' : 'हिन्दी में बदलें'}</span>
            </button>

            <span className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-600" />
              <span>IndexedDB v3</span>
            </span>
          </div>

          <p className="text-[10px] text-slate-400 text-center font-medium">
            KiranaSathi Enterprise Admin • Mobile POS & Reorder Engine
          </p>
        </div>
      </aside>
    </div>
  );
};
