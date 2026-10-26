// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createIsolatedDatabase, KiranaDatabase } from '../db';
import {
  addProduct,
  updateProduct,
  addStock,
  adjustStock,
  getAllProducts,
  getSlowMovingAnalysis,
  seedInitialSampleData,
} from '../services/inventoryService';
import { recordSale, getAllSales } from '../services/salesService';
import { t, DICTIONARY } from '../i18n';

describe('Phase 5: Offline-First Integrity & Regression Acceptance Tests', () => {
  let testDb: KiranaDatabase;
  const dbName = 'test_kirana_phase5_' + Math.random().toString(36).substring(7);

  beforeEach(async () => {
    testDb = createIsolatedDatabase(dbName);
    await testDb.open();
  });

  afterEach(async () => {
    if (testDb.isOpen()) {
      await testDb.delete();
    }
  });

  // 1. Read inventory offline
  it('1. Reads inventory directly from IndexedDB without network', async () => {
    await seedInitialSampleData(testDb);
    const products = await getAllProducts(testDb);
    expect(products.length).toBeGreaterThan(0);
    expect(products[0]).toHaveProperty('name');
    expect(products[0]).toHaveProperty('quantity');
    expect(products[0]).toHaveProperty('minimumStock');
  });

  // 2. Add product offline
  it('2. Adds a new product with fractional units offline', async () => {
    const created = await addProduct(
      {
        name: 'Moong Dal Premium',
        nameHindi: 'मूँग दाल',
        category: 'grains',
        quantity: 12.5,
        unit: 'kg',
        minimumStock: 4,
        costPrice: 95,
        sellingPrice: 120,
      },
      testDb
    );

    expect(created.id).toBeDefined();
    expect(created.quantity).toBe(12.5);

    const saved = await testDb.products.get(created.id!);
    expect(saved?.name).toBe('Moong Dal Premium');
    expect(saved?.quantity).toBe(12.5);
  });

  // 3. Edit product offline
  it('3. Edits existing product details offline', async () => {
    const created = await addProduct(
      {
        name: 'Mustard Oil Bottle',
        nameHindi: 'सरसों तेल',
        category: 'oil',
        quantity: 10,
        unit: 'litre',
        minimumStock: 5,
        sellingPrice: 160,
      },
      testDb
    );

    const updated = await updateProduct(
      created.id!,
      {
        sellingPrice: 175,
        minimumStock: 6,
      },
      testDb
    );

    expect(updated.sellingPrice).toBe(175);
    expect(updated.minimumStock).toBe(6);

    const saved = await testDb.products.get(created.id!);
    expect(saved?.sellingPrice).toBe(175);
  });

  // 4. Adjust stock (+ and -) offline
  it('4. Adjusts stock quantity and logs movement in ledger offline', async () => {
    const p = await addProduct(
      {
        name: 'Sugar M30',
        nameHindi: 'चीनी',
        category: 'grains',
        quantity: 20,
        unit: 'kg',
        minimumStock: 10,
      },
      testDb
    );

    // Add stock +15.5 kg
    const restocked = await addStock(p.id!, 15.5, 'Supplier delivery', testDb);
    expect(restocked.quantity).toBe(35.5);

    // Stock adjustment (e.g. inventory audit count: 34 kg)
    const audited = await adjustStock(p.id!, 34, 'Weekly physical audit', testDb);
    expect(audited.quantity).toBe(34);

    const movements = await testDb.stockMovements.where('productId').equals(p.id!).toArray();
    expect(movements.length).toBe(3); // 1 initial + 1 restock + 1 adjustment
  });

  // 5. Record valid sale atomically
  it('5. Records a valid sale, updates stock atomically, and logs receipt offline', async () => {
    const p = await addProduct(
      {
        name: 'Tata Tea Gold',
        nameHindi: 'टाटा चाय',
        category: 'household',
        quantity: 8,
        unit: 'packet',
        minimumStock: 3,
        sellingPrice: 140,
      },
      testDb
    );

    const sale = await recordSale(
      {
        items: [{ productId: p.id!, quantity: 2 }],
        paymentMethod: 'upi',
      },
      testDb
    );

    expect(sale.id).toBeDefined();
    expect(sale.totalAmount).toBe(280);
    expect(sale.paymentMethod).toBe('upi');

    // Verify stock decreased from 8 to 6
    const updated = await testDb.products.get(p.id!);
    expect(updated?.quantity).toBe(6);

    // Verify sale ledger
    const sales = await getAllSales(testDb);
    expect(sales.length).toBe(1);
    expect(sales[0].receiptNumber).toBe(sale.receiptNumber);
  });

  // 6. Reject sale exceeding stock (atomicity & rollback)
  it('6. Rejects sale exceeding available stock without corrupting inventory', async () => {
    const p = await addProduct(
      {
        name: 'Basmati Rice',
        nameHindi: 'बासमती चावल',
        category: 'grains',
        quantity: 5,
        unit: 'kg',
        minimumStock: 2,
        sellingPrice: 90,
      },
      testDb
    );

    // Attempt sale of 10 kg when only 5 kg is available
    await expect(
      recordSale(
        {
          items: [{ productId: p.id!, quantity: 10 }],
          paymentMethod: 'cash',
        },
        testDb
      )
    ).rejects.toThrow(/Insufficient stock/i);

    // Verify stock was NOT altered
    const saved = await testDb.products.get(p.id!);
    expect(saved?.quantity).toBe(5);

    // Verify no sale was recorded
    const sales = await getAllSales(testDb);
    expect(sales.length).toBe(0);
  });

  // 7. Low-stock calculations reflect updated inventory
  it('7. Low stock calculation detects items falling below threshold', async () => {
    const p = await addProduct(
      {
        name: 'Haldi Powder',
        nameHindi: 'हल्दी पाउडर',
        category: 'spices',
        quantity: 4,
        unit: 'packet',
        minimumStock: 3,
        sellingPrice: 35,
      },
      testDb
    );

    // Initial: 4 > 3 -> healthy
    let saved = (await testDb.products.get(p.id!))!;
    expect(saved.quantity > saved.minimumStock).toBe(true);

    // Sell 2 units -> stock becomes 2 <= 3 -> low stock!
    await recordSale(
      {
        items: [{ productId: p.id!, quantity: 2 }],
        paymentMethod: 'cash',
      },
      testDb
    );

    saved = (await testDb.products.get(p.id!))!;
    expect(saved.quantity).toBe(2);
    expect(saved.quantity <= saved.minimumStock).toBe(true);
  });

  // 8. Slow-moving stock analysis works offline
  it('8. Slow-moving stock analysis executes offline without network', async () => {
    await addProduct(
      {
        name: 'Detergent Bar',
        nameHindi: 'कपड़े धोने का साबुन',
        category: 'household',
        quantity: 15,
        unit: 'piece',
        minimumStock: 5,
      },
      testDb
    );

    const slowAnalysis = await getSlowMovingAnalysis(testDb);
    expect(Array.isArray(slowAnalysis)).toBe(true);
  });

  // 9. Hindi/English translations lookup works offline
  it('9. Bilingual dictionary lookup works offline without internet', () => {
    expect(t('btnQuickSale', 'hi')).toBe('त्वरित बिक्री करें');
    expect(t('btnQuickSale', 'en')).toBe('Quick Sale');
    expect(t('inventoryTitle', 'hi')).toBe('सामान एवं स्टॉक सूची');
    expect(t('inventoryTitle', 'en')).toBe('Inventory & Stock Catalog');
    expect(DICTIONARY.hi.appName).toBe('KiranaSathi');
    expect(DICTIONARY.en.appName).toBe('KiranaSathi');
  });

  // 10. Data persistence across database reopening
  it('10. Data persists when database is closed and reopened (simulating reload)', async () => {
    const p = await addProduct(
      {
        name: 'Besan Fine',
        nameHindi: 'बेसन',
        category: 'grains',
        quantity: 7.5,
        unit: 'kg',
        minimumStock: 3,
      },
      testDb
    );

    // Close database connection
    testDb.close();

    // Reopen database with same name
    const reopenedDb = createIsolatedDatabase(dbName);
    await reopenedDb.open();

    const recovered = await reopenedDb.products.get(p.id!);
    expect(recovered).toBeDefined();
    expect(recovered?.name).toBe('Besan Fine');
    expect(recovered?.quantity).toBe(7.5);

    await reopenedDb.delete();
  });
});
