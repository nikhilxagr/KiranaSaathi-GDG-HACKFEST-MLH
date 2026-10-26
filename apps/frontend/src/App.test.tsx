// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ShopProvider } from './context/ShopContext';
import { AppRoutes, App } from './App';

import 'fake-indexeddb/auto';

// Mock API for fast, isolated frontend testing
vi.mock('./services/api', () => ({
  checkBackendHealth: vi.fn().mockResolvedValue({
    status: 'ok',
    service: 'kiranasathi-backend',
    version: '0.1.0',
    environment: 'test',
    timestamp: new Date().toISOString(),
    uptimeSeconds: 42,
  }),
}));

const renderTestApp = (initialRoute = '/') => {
  return render(
    <ShopProvider>
      <MemoryRouter
        initialEntries={[initialRoute]}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppRoutes />
      </MemoryRouter>
    </ShopProvider>
  );
};

describe('KiranaSathi Phase 1 Production Frontend UI', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders default App without crashing', async () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('backend-status-indicator')).toBeInTheDocument();
    });
  });

  it('renders header brand, shop identity, and navigation tabs', async () => {
    renderTestApp('/');

    await waitFor(() => {
      // Header brand
      expect(screen.getAllByText(/KiranaSathi/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/किराना साथी/i)).toBeInTheDocument();

      // Navigation tabs (BottomNav in Hindi by default)
      expect(screen.getAllByText('होम').length).toBeGreaterThan(0);
      expect(screen.getAllByText('स्टॉक').length).toBeGreaterThan(0);
      expect(screen.getAllByText('बिक्री').length).toBeGreaterThan(0);
      expect(screen.getAllByText('ऑर्डर').length).toBeGreaterThan(0);
      expect(screen.getAllByText('सेटिंग्स').length).toBeGreaterThan(0);
    });
  });

  it('renders dashboard greeting and primary quick actions', async () => {
    renderTestApp('/');

    await waitFor(() => {
      // Owner greeting
      expect(screen.getAllByText(/नमस्ते|शुभ प्रभात|शुभ संध्या|Good morning|Good afternoon|Good evening/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Ramesh|रमेश/i).length).toBeGreaterThan(0);

      // Primary Quick Action button
      expect(screen.getByText(/त्वरित बिक्री करें/i)).toBeInTheDocument();
      expect(screen.getByText(/नया सामान जोड़ें/i)).toBeInTheDocument();
    });
  });

  it('switches interface language from Hindi to English on toggle', async () => {
    renderTestApp('/');

    // By default in Hindi, the language toggle button shows "English"
    const langBtn = screen.getByLabelText(/Switch Language/i);
    expect(langBtn).toBeInTheDocument();

    // Click language button to toggle to English
    fireEvent.click(langBtn);

    await waitFor(() => {
      // Navigation should now display English labels across desktop & mobile
      expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Stock').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Sales').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Reorder').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Settings').length).toBeGreaterThan(0);

      // Quick actions in English
      expect(screen.getByText(/Quick Sale/i)).toBeInTheDocument();
      expect(screen.getByText(/Add New Stock/i)).toBeInTheDocument();
    });
  });

  it('navigates to inventory screen and renders search & add action', async () => {
    renderTestApp('/inventory');

    await waitFor(() => {
      expect(screen.getAllByText(/सामान एवं स्टॉक सूची|Inventory & Stock Catalog/i).length).toBeGreaterThan(0);
      expect(screen.getByPlaceholderText(/सामान का नाम या बारकोड खोजें...|Search by item name or barcode.../i)).toBeInTheDocument();
      expect(screen.getAllByText(/नया सामान जोड़ें|Add New Stock/i).length).toBeGreaterThan(0);
    });
  });

  it('navigates to quick sale screen and renders fast billing counter', async () => {
    renderTestApp('/sales');

    await waitFor(() => {
      expect(screen.getAllByText(/त्वरित काउंटर बिक्री|Fast Counter Sale/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/काउंटर बिल|Counter Tray/i).length).toBeGreaterThan(0);
    });
  });

  it('navigates to reorder screen and renders low stock and slow moving tabs', async () => {
    renderTestApp('/reorder');

    await waitFor(() => {
      expect(screen.getAllByText(/पुनः ऑर्डर|Reorder/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/कम स्टॉक|Urgent Low Stock/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/धीमी बिक्री|Slow Moving/i).length).toBeGreaterThan(0);
    });
  });
});
