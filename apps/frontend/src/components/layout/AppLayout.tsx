import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-slate-50/70 text-slate-800">
      {/* 1. Left Navigation Sidebar (Desktop Widescreen) */}
      <Sidebar />

      {/* 2. Main Fluid Area (Edge-to-Edge Full Screen Layout) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Navbar />

        {/* Full-width Responsive Main Workspace Container */}
        <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-12 max-w-[1700px] mx-auto">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
};
