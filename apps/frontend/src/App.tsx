import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ShopProvider } from './context/ShopContext';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { Loader2 } from 'lucide-react';

// Route-level code splitting for non-initial pages to minimize initial bundle size
const InventoryPage = lazy(() =>
  import('./pages/InventoryPage').then((m) => ({ default: m.InventoryPage }))
);
const SalesPage = lazy(() =>
  import('./pages/SalesPage').then((m) => ({ default: m.SalesPage }))
);
const ReorderPage = lazy(() =>
  import('./pages/ReorderPage').then((m) => ({ default: m.ReorderPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

export const RouteLoadingFallback: React.FC = () => (
  <div
    className="kirana-card p-12 text-center max-w-sm mx-auto my-10 space-y-3"
    role="status"
    aria-live="polite"
  >
    <Loader2 className="w-8 h-8 text-kirana-700 animate-spin mx-auto" />
    <p className="text-xs font-bold text-slate-600">लोड हो रहा है... / Loading...</p>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="reorder" element={<ReorderPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export const App: React.FC = () => {
  return (
    <ShopProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppRoutes />
      </BrowserRouter>
    </ShopProvider>
  );
};

export default App;
