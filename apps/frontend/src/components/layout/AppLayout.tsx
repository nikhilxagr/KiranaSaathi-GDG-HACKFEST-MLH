import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useShop } from '../../context/ShopContext';
import { Info } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { t } = useShop();

  return (
    <div className="min-h-screen flex bg-slate-50/70 text-slate-800">
      {/* 1. Left Navigation Sidebar (Desktop Widescreen) */}
      <Sidebar />

      {/* 2. Main Fluid Area (Edge-to-Edge Full Screen Layout) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Navbar />

        {/* Demonstration Notice Ribbon */}
        <aside
          aria-label="Demonstration notice"
          className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-center gap-1.5 text-center shrink-0"
        >
          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>{t('demoNotice')}</span>
        </aside>

        {/* Full-width Responsive Main Workspace Container */}
        <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-12 max-w-[1700px] mx-auto">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
};
