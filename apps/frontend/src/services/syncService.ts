import { Product, Sale } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface SyncResult {
  success: boolean;
  synced: boolean;
  online: boolean;
  message?: string;
  serverProducts?: any[];
  serverSales?: any[];
}

/**
 * Check if the backend server is reachable and whether MongoDB is connected
 */
export const checkServerStatus = async (): Promise<{ online: boolean; mongoConnected: boolean }> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { online: true, mongoConnected: Boolean(data?.mongodb) };
    }
    return { online: false, mongoConnected: false };
  } catch {
    return { online: false, mongoConnected: false };
  }
};

/**
 * Bidirectional sync between local IndexedDB and backend MongoDB
 */
export const syncWithMongoDB = async (
  localProducts: Product[],
  localSales: Sale[]
): Promise<SyncResult> => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: true, synced: false, online: false, message: 'Device is offline' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${API_BASE_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        products: localProducts,
        sales: localSales,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, synced: false, online: true, message: `Server error: ${response.status}` };
    }

    const result = await response.json();
    return {
      success: true,
      synced: Boolean(result.synced),
      online: true,
      serverProducts: result.products,
      serverSales: result.sales,
      message: result.message,
    };
  } catch {
    return { success: true, synced: false, online: false, message: 'Server unreachable. Running offline.' };
  }
};

/**
 * Dual-write helper: notify backend when product is created
 */
export const dualWriteProduct = async (product: Partial<Product>): Promise<void> => {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch {
    // Silently continue in offline mode
  }
};

/**
 * Dual-write helper: notify backend when sale is recorded
 */
export const dualWriteSale = async (sale: Partial<Sale>): Promise<void> => {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    await fetch(`${API_BASE_URL}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sales: [sale] }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch {
    // Silently continue in offline mode
  }
};
