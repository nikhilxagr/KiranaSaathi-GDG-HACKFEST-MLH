// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { checkBackendHealth, checkBackendReadiness } from '../services/api';
import { useBackendHealth } from '../hooks/useBackendHealth';
import { createIsolatedDatabase, KiranaDatabase } from '../db';
import { addProduct, getAllProducts } from '../services/inventoryService';
import { recordSale, getAllSales } from '../services/salesService';

describe('Phase 3: Frontend API Client and Integration', () => {
  let testDb: KiranaDatabase;
  const dbName = 'test_kirana_phase3_' + Math.random().toString(36).substring(7);

  beforeEach(async () => {
    testDb = createIsolatedDatabase(dbName);
    await testDb.open();
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    if (testDb.isOpen()) {
      await testDb.delete();
    }
  });

  // Test 1: checkBackendHealth succeeds when API responds 200
  it('1. checkBackendHealth returns typed response on 200 OK', async () => {
    const mockHealth = {
      success: true,
      status: 'ok',
      service: 'kiranasathi-backend',
      appName: 'KiranaSathi',
      version: '0.1.0',
      environment: 'development',
      timestamp: new Date().toISOString(),
      uptimeSeconds: 120,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockHealth,
    } as Response);

    const result = await checkBackendHealth();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('kiranasathi-backend');
    expect(result.appName).toBe('KiranaSathi');
    expect(result.uptimeSeconds).toBe(120);
  });

  // Test 2: checkBackendReadiness succeeds on 200 OK
  it('2. checkBackendReadiness returns readiness confirmation', async () => {
    const mockReady = {
      success: true,
      ready: true,
      service: 'kiranasathi-backend',
      timestamp: new Date().toISOString(),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockReady,
    } as Response);

    const result = await checkBackendReadiness();
    expect(result.ready).toBe(true);
    expect(result.service).toBe('kiranasathi-backend');
  });

  // Test 3: checkBackendHealth handles HTTP error statuses
  it('3. checkBackendHealth throws descriptive error on non-200 HTTP response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    } as Response);

    await expect(checkBackendHealth()).rejects.toThrow(/status: 503/i);
  });

  // Test 4: checkBackendHealth handles network failures
  it('4. checkBackendHealth throws error on network failure without crashing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    await expect(checkBackendHealth()).rejects.toThrow('Failed to fetch');
  });

  // Test 5: checkBackendHealth times out on hanging server
  it('5. checkBackendHealth aborts on timeout', async () => {
    global.fetch = vi.fn().mockImplementation((_url, options) => {
      return new Promise((_, reject) => {
        options?.signal?.addEventListener('abort', () => {
          const err = new Error('The operation was aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });

    await expect(checkBackendHealth(50)).rejects.toThrow(/timed out/i);
  });

  // Test 6: useBackendHealth hook reports 'connected' on success
  it('6. useBackendHealth hook reports connected state upon successful health check', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        status: 'ok',
        service: 'kiranasathi-backend',
      }),
    } as Response);

    const { result } = renderHook(() => useBackendHealth(60000));

    await waitFor(() => {
      expect(result.current.status).toBe('connected');
      expect(result.current.error).toBeNull();
      expect(result.current.lastChecked).toBeInstanceOf(Date);
    });
  });

  // Test 7: useBackendHealth hook reports 'unavailable' when backend is down
  it('7. useBackendHealth hook reports unavailable state when backend is unreachable', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    const { result } = renderHook(() => useBackendHealth(60000));

    await waitFor(() => {
      expect(result.current.status).toBe('unavailable');
      expect(result.current.error).toContain('Connection refused');
      expect(result.current.lastChecked).toBeInstanceOf(Date);
    });
  });

  // Test 8: Inventory operations continue to work 100% locally when backend is unavailable
  it('8. Critical Rule: Local inventory and sales succeed completely in IndexedDB even if backend is offline', async () => {
    // Simulate completely dead backend
    global.fetch = vi.fn().mockRejectedValue(new Error('Backend offline'));

    // 1. Add product locally in IndexedDB
    const product = await addProduct(
      {
        name: 'Offline Chana Dal',
        nameHindi: 'चना दाल',
        category: 'grains',
        quantity: 15,
        unit: 'kg',
        minimumStock: 5,
        sellingPrice: 85,
      },
      testDb
    );

    expect(product.id).toBeDefined();
    expect(product.name).toBe('Offline Chana Dal');

    // 2. Verify stored in IndexedDB
    const saved = await testDb.products.get(product.id!);
    expect(saved?.quantity).toBe(15);

    // 3. Record sale locally in IndexedDB
    const sale = await recordSale(
      {
        items: [{ productId: product.id!, quantity: 5 }],
        paymentMethod: 'cash',
      },
      testDb
    );

    expect(sale.id).toBeDefined();
    expect(sale.totalAmount).toBe(425); // 5 * 85

    // 4. Verify local inventory decremented to 10 kg
    const updatedProduct = await testDb.products.get(product.id!);
    expect(updatedProduct?.quantity).toBe(10);

    // 5. Verify local sale recorded
    const sales = await getAllSales(testDb);
    expect(sales.length).toBe(1);

    // 6. Verify products can be queried
    const all = await getAllProducts(testDb);
    expect(all.length).toBe(1);
    expect(all[0].name).toBe('Offline Chana Dal');
  });
});
