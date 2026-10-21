import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Package, ShoppingCart, RefreshCw, Settings } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

export const BottomNav: React.FC = () => {
  const { t, lowStockCount } = useShop();

  const tabs = [
    { to: '/', label: t('navHome'), icon: Home },
    {
      to: '/inventory',
      label: t('navInventory'),
      icon: Package,
      badge: lowStockCount > 0 ? String(lowStockCount) : undefined,
    },
    { to: '/sales', label: t('navSales'), icon: ShoppingCart },
    {
      to: '/reorder',
      label: t('navReorder'),
      icon: RefreshCw,
      badge: lowStockCount > 0 ? '!' : undefined,
    },
    { to: '/settings', label: t('navSettings'), icon: Settings },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-surface-border py-1 px-1 safe-area-pb shadow-lg"
      aria-label="Mobile Navigation"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `touch-target flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all relative select-none ${
                  isActive
                    ? 'text-kirana-800 font-bold bg-kirana-100/70'
                    : 'text-slate-500 hover:text-slate-800 active:bg-slate-50'
                }`
              }
            >
              {tab.badge && (
                <span className="absolute top-1 right-2 px-1.5 py-0.2 min-w-[16px] text-center text-[10px] font-extrabold rounded-full bg-amber-500 text-white shadow-xs">
                  {tab.badge}
                </span>
              )}
              <Icon className="w-5 h-5 mb-0.5 shrink-0" />
              <span className="text-[11px] leading-tight text-center truncate max-w-full">
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
