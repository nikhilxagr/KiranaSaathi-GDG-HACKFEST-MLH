import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { useShop } from '../../context/ShopContext';
import { Info } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { t } = useShop();

  return (
    <div className="min-h-screen flex flex-col bg-surface text-slate-800">
      <Navbar />

      {/* Demonstration Notice Ribbon */}
      <aside
        aria-label="Demonstration notice"
        className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-center gap-1.5 text-center"
      >
        <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
        <span>{t('demoNotice')}</span>
      </aside>

      {/* Responsive Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 pt-4 pb-24 md:pb-12">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
};
