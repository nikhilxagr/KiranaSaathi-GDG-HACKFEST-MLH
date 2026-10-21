import React from 'react';
import { NavLink } from 'react-router-dom';
import { Store, Wifi, WifiOff, Languages } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useShop } from '../../context/ShopContext';

export const Navbar: React.FC = () => {
  const networkStatus = useNetworkStatus();
  const isOnline = networkStatus === 'online';
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

          {/* Network Indicator Badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${
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
