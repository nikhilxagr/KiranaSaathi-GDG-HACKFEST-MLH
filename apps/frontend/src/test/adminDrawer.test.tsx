// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import 'fake-indexeddb/auto';
import { ShopProvider } from '../context/ShopContext';
import { Navbar } from '../components/layout/Navbar';
import { AdminDrawer } from '../components/layout/AdminDrawer';

describe('Admin Look & Three-Line Hamburger Drawer UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    cleanup();
  });

  it('1. renders the clean navbar with brand and direct navigation links', async () => {
    render(
      <ShopProvider>
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      </ShopProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('admin-menu-button')).toBeNull();
      expect(screen.getAllByText(/KiranaSathi/i).length).toBeGreaterThan(0);
    });
  });

  it('2. renders the AdminDrawer when isOpen is true', async () => {
    const handleClose = vi.fn();
    render(
      <ShopProvider>
        <MemoryRouter>
          <AdminDrawer isOpen={true} onClose={handleClose} />
        </MemoryRouter>
      </ShopProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-drawer-container')).toBeInTheDocument();
      expect(screen.getAllByText(/व्यवस्थापक|Admin/i).length).toBeGreaterThan(0);
    });
  });

  it('3. displays store manager profile and quick KPI stats in the drawer', async () => {
    const handleClose = vi.fn();
    render(
      <ShopProvider>
        <MemoryRouter>
          <AdminDrawer isOpen={true} onClose={handleClose} />
        </MemoryRouter>
      </ShopProvider>
    );

    await waitFor(() => {
      // Profile & Identity
      expect(screen.getAllByText(/KiranaSathi/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Ramesh Gupta|Nikhil Agrahari/i).length).toBeGreaterThan(0);

      // KPI stats strip
      expect(screen.getByText(/आज बिक्री|Today's Sales/i)).toBeInTheDocument();
      expect(screen.getByText(/कम स्टॉक|Low Stock/i)).toBeInTheDocument();
      expect(screen.getByText(/कुल SKUs|Total SKUs/i)).toBeInTheDocument();
    });
  });

  it('4. displays modular navigation sections for Operations, Inventory, Supply Chain, and Admin', async () => {
    const handleClose = vi.fn();
    render(
      <ShopProvider>
        <MemoryRouter>
          <AdminDrawer isOpen={true} onClose={handleClose} />
        </MemoryRouter>
      </ShopProvider>
    );

    await waitFor(() => {
      // Section headers
      expect(screen.getByText(/दुकान संचालन|Store Operations/i)).toBeInTheDocument();
      expect(screen.getByText(/स्टॉक एवं सामान|Inventory Management/i)).toBeInTheDocument();
      expect(screen.getByText(/पुनः ऑर्डर एवं सप्लायर|Supply Chain/i)).toBeInTheDocument();
      expect(screen.getByText(/व्यवस्थापन एवं सेटिंग्स|Admin & System/i)).toBeInTheDocument();

      // Offline data backup tool
      expect(screen.getByText(/ऑफ़लाइन डेटा बैकअप|Export Offline Database Backup/i)).toBeInTheDocument();
    });
  });

  it('5. triggers onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    render(
      <ShopProvider>
        <MemoryRouter>
          <AdminDrawer isOpen={true} onClose={handleClose} />
        </MemoryRouter>
      </ShopProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Close menu/i)).toBeInTheDocument();
    });

    const closeBtn = screen.getByLabelText(/Close menu/i);
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
