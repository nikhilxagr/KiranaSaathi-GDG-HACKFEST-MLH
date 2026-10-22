import React from 'react';
import { NavLink } from 'react-router-dom';
import { Store, Wifi, WifiOff, Languages, Server } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useBackendHealth } from '../../hooks/useBackendHealth';
import { useShop } from '../../context/ShopContext';

export const Navbar: React.FC = () => {
  const networkStatus = useNetworkStatus();
  const isOnline = networkStatus === 'online';
  const { status: backendStatus } = useBackendHealth();
  const { preferences, language, setLanguage, t, lowStockCount } = useShop();

  const toggleLanguage = () => {
    setLanguage(language === 'hi' ? 'en' : 'hi');
  };

  const desktopNavItems = [
    { to: '/', label: t('navHome') },
    { to: '/inventory', label: t('navInventory'), badge: lowStockCount > 0 ? lowStockCount : undefined },
    { to: '/sales', label: t('navSales') },
    { to: '/reorder', label: t('navReorder') },
    { to: '/settings', label: t('navSettings') },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Brand & Store Identity */}
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-kirana-700 flex items-center justify-center text-white shadow-sm shadow-kirana-700/20 group-hover:bg-kirana-800 transition-colors shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-none">
                KiranaSathi
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-kirana-100 text-kirana-800 font-semibold font-['Noto_Sans_Devanagari']">
                {language === 'hi' ? 'किराना साथी' : 'Assistant'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              {language === 'hi' ? preferences.shopNameHindi : preferences.shopName}
            </p>
          </div>
        </NavLink>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {desktopNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors relative flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-kirana-100 text-kirana-800 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
              {item.badge && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Action Controls: Language Toggle & Network Status */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick 1-tap Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="touch-target flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-all active:scale-95 shadow-sm"
            title="Switch Language / भाषा बदलें"
            aria-label="Switch Language"
          >
            <Languages className="w-4 h-4 text-kirana-700" />
            <span className="font-bold text-kirana-800">
              {language === 'hi' ? 'English' : 'हिन्दी'}
            </span>
          </button>

          {/* Backend Connection Status Indicator */}
          <div
            data-testid="backend-status-indicator"
            title={
              backendStatus === 'connected'
                ? 'Backend API (/api/health): Connected. Local IndexedDB remains primary source of truth.'
                : backendStatus === 'unavailable'
                ? 'Backend API: Offline / Unreachable. App operates 100% locally via IndexedDB.'
                : 'Checking backend API connection...'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              backendStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : backendStatus === 'unavailable'
                ? 'bg-slate-100 text-slate-600 border-slate-300'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            <Server className={`w-3.5 h-3.5 ${backendStatus === 'connected' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                backendStatus === 'connected'
                  ? 'bg-emerald-500'
                  : backendStatus === 'unavailable'
                  ? 'bg-slate-400'
                  : 'bg-blue-500 animate-ping'
              }`}
            />
            <span className="hidden sm:inline text-[11px] font-bold">
              {backendStatus === 'connected'
                ? t('backendConnected')
                : backendStatus === 'unavailable'
                ? t('backendUnavailable')
                : t('backendChecking')}
            </span>
          </div>

          {/* Network Indicator Badge */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span className="hidden lg:inline">{language === 'hi' ? 'ऑनलाइन' : 'Online'}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                <span>{language === 'hi' ? 'ऑफ़लाइन' : 'Offline'}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
