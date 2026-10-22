// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createIsolatedDatabase, KiranaDatabase } from '../db';
import {
  addProduct,
  updateProduct,
  getAllProducts,
  calculateReorderSuggestion,
} from '../services/inventoryService';
import { recordSale, getAllSales } from '../services/salesService';

describe('Phase 2 Verification Checklist (7 of 7 Checked)', () => {
  let testDb: KiranaDatabase;
  const dbName = 'test_kirana_verify_' + Math.random().toString(36).substring(7);

  beforeEach(async () => {
    testDb = createIsolatedDatabase(dbName);
    await testDb.open();
  });

  afterEach(async () => {
    if (testDb.isOpen()) {
      await testDb.delete();
    }
  });

  // Step 1: Add a product: Create Rice with 10 kg in stock and a minimum stock level of 5 kg.
  it('Step 1: Add a product - Create Rice with 10 kg in stock and a minimum stock level of 5 kg', async () => {
    const product = await addProduct(
      {
        name: 'Rice',
        nameHindi: 'चावल',
        category: 'grains',
        quantity: 10,
        unit: 'kg',
        minimumStock: 5,
        costPrice: 40,
        sellingPrice: 50,
      },
      testDb
    );

    expect(product.id).toBeDefined();
    expect(product.name).toBe('Rice');
    expect(product.quantity).toBe(10);
    expect(product.unit).toBe('kg');
    expect(product.minimumStock).toBe(5);

    // Verify stored in IndexedDB
    const saved = await testDb.products.get(product.id!);
    expect(saved).toBeDefined();
    expect(saved?.name).toBe('Rice');
    expect(saved?.quantity).toBe(10);
    expect(saved?.minimumStock).toBe(5);
  });

  // Step 2: Test fractional stock: Confirm that 2.5 kg can be entered and saved.
  it('Step 2: Test fractional stock - Confirm that 2.5 kg can be entered and saved', async () => {
    // Add product with 2.5 kg
    const product = await addProduct(
      {
        name: 'Basmati Rice',
        nameHindi: 'बासमती चावल',
        category: 'grains',
        quantity: 2.5,
        unit: 'kg',
        minimumStock: 1.0,
        sellingPrice: 90,
      },
      testDb
    );

    expect(product.quantity).toBe(2.5);

    // Also confirm updating existing product to 2.5 kg works cleanly
    const updated = await updateProduct(product.id!, { quantity: 2.5 }, testDb);
    expect(updated.quantity).toBe(2.5);

    const fromDb = await testDb.products.get(product.id!);
    expect(fromDb?.quantity).toBe(2.5);
  });

  // Step 3: Record a sale: Sell 2.5 kg of Rice. The remaining stock should be 7.5 kg.
  it('Step 3: Record a sale - Sell 2.5 kg of Rice. The remaining stock should be 7.5 kg', async () => {
    const product = await addProduct(
      {
        name: 'Rice',
        category: 'grains',
        quantity: 10,
        unit: 'kg',
        minimumStock: 5,
        sellingPrice: 60,
      },
      testDb
    );

    const sale = await recordSale(
      {
        items: [{ productId: product.id!, quantity: 2.5 }],
        paymentMethod: 'cash',
      },
      testDb
    );

    expect(sale.id).toBeDefined();
    expect(sale.items[0].quantity).toBe(2.5);
    expect(sale.totalAmount).toBe(150); // 2.5 * 60

    // Remaining stock must be exactly 7.5 kg
    const updated = await testDb.products.get(product.id!);
    expect(updated?.quantity).toBe(7.5);
  });

  // Step 4: Test insufficient stock: Attempt to sell more than the remaining stock.
  // The sale must fail without changing inventory.
  it('Step 4: Test insufficient stock - Attempt to sell more than remaining stock; sale must fail without changing inventory', async () => {
    const product = await addProduct(
      {
        name: 'Rice',
        category: 'grains',
        quantity: 7.5,
        unit: 'kg',
        minimumStock: 5,
        sellingPrice: 60,
      },
      testDb
    );

    // Attempt to sell 10 kg (more than remaining 7.5 kg)
    await expect(
      recordSale(
        {
          items: [{ productId: product.id!, quantity: 10 }],
          paymentMethod: 'cash',
        },
        testDb
      )
    ).rejects.toThrow(/Insufficient stock|पर्याप्त स्टॉक नहीं/);

    // Inventory must remain exactly 7.5 kg without change
    const checkStock = await testDb.products.get(product.id!);
    expect(checkStock?.quantity).toBe(7.5);

    // No sale record should be saved
    const sales = await getAllSales(testDb);
    expect(sales.length).toBe(0);
  });

  // Step 5: Refresh the page: Reload the app and confirm that Rice still has 7.5 kg.
  it('Step 5: Refresh the page - Reload the app and confirm that Rice still has 7.5 kg', async () => {
    // 1. Create Rice with 10 kg
    const product = await addProduct(
      {
        name: 'Rice',
        category: 'grains',
        quantity: 10,
        unit: 'kg',
        minimumStock: 5,
        sellingPrice: 50,
      },
      testDb
    );

    // 2. Sell 2.5 kg -> 7.5 kg
    await recordSale(
      {
        items: [{ productId: product.id!, quantity: 2.5 }],
        paymentMethod: 'cash',
      },
      testDb
    );

    // 3. Simulate browser reload by closing existing connection
    testDb.close();

    // 4. Open fresh connection to same IndexedDB database (simulating reload/refresh)
    const reloadedDb = createIsolatedDatabase(dbName);
    await reloadedDb.open();

    const allProducts = await getAllProducts(reloadedDb);
    const reloadedRice = allProducts.find((p) => p.name === 'Rice');

    expect(reloadedRice).toBeDefined();
    expect(reloadedRice?.quantity).toBe(7.5);

    await reloadedDb.delete();
  });

  // Step 6: Check reorder logic: Reduce Rice below its minimum level and confirm that it appears on the low-stock list.
  it('Step 6: Check reorder logic - Reduce Rice below its minimum level and confirm that it appears on the low-stock list', async () => {
    // Minimum stock = 5 kg
    const product = await addProduct(
      {
        name: 'Rice',
        category: 'grains',
        quantity: 7.5,
        unit: 'kg',
        minimumStock: 5,
        sellingPrice: 50,
      },
      testDb
    );

    // At 7.5 kg (above 5 kg), it should NOT be low stock
    let all = await getAllProducts(testDb);
    let lowStock = all.filter((p) => p.quantity <= p.minimumStock);
    expect(lowStock.some((p) => p.name === 'Rice')).toBe(false);

    // Sell 3.5 kg -> remaining is 4.0 kg (which is below minimum stock 5 kg)
    await recordSale(
      {
        items: [{ productId: product.id!, quantity: 3.5 }],
        paymentMethod: 'cash',
      },
      testDb
    );

    all = await getAllProducts(testDb);
    const updatedRice = all.find((p) => p.name === 'Rice')!;
    expect(updatedRice.quantity).toBe(4.0);

    // Confirm that it appears on the low-stock list
    lowStock = all.filter((p) => p.quantity <= p.minimumStock);
    expect(lowStock.some((p) => p.name === 'Rice')).toBe(true);

    // Confirm suggested reorder calculation: max(0, minimumStock - quantity) = 5 - 4 = 1 kg
    expect(calculateReorderSuggestion(updatedRice)).toBe(1.0);
  });

  // Step 7: Test offline operation: After the app is cached, switch to airplane mode and repeat a sale.
  it('Step 7: Test offline operation - Repeats sale when offline without network access', async () => {
    const product = await addProduct(
      {
        name: 'Offline Rice',
        category: 'grains',
        quantity: 10,
        unit: 'kg',
        minimumStock: 5,
        sellingPrice: 50,
      },
      testDb
    );

    // Simulate airplane mode by overriding navigator.onLine
    const originalOnline = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
      writable: true,
    });

    try {
      expect(navigator.onLine).toBe(false);

      // Perform sale completely offline using Dexie IndexedDB
      const offlineSale = await recordSale(
        {
          items: [{ productId: product.id!, quantity: 2.5 }],
          paymentMethod: 'cash',
        },
        testDb
      );

      expect(offlineSale.id).toBeDefined();
      expect(offlineSale.receiptNumber).toBeDefined();

      // Verify stock was successfully decremented in offline storage
      const updated = await testDb.products.get(product.id!);
      expect(updated?.quantity).toBe(7.5);

      // Verify sale persisted offline in IndexedDB
      const allSales = await getAllSales(testDb);
      expect(allSales.length).toBe(1);
      expect(allSales[0].id).toBe(offlineSale.id);
    } finally {
      Object.defineProperty(navigator, 'onLine', {
        value: originalOnline,
        configurable: true,
        writable: true,
      });
    }
  });
});
