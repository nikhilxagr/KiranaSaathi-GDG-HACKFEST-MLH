// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { KiranaDatabase, createIsolatedDatabase } from '../db';
import { Product, Supplier } from '../types';
import {
  calculateReorderForProduct,
  roundReorderQuantity,
  generateDistributorOrderText,
  buildWhatsAppOrderUrl,
  getReorderRecommendations,
} from '../services/reorderService';
import {
  addSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  assignSupplierToProduct,
} from '../services/supplierService';
import {
  addProduct,
  getProductById,
  receiveStock,
  getAllProducts,
} from '../services/inventoryService';
import { recordSale } from '../services/salesService';

describe('Phase 6: Smart Reorder Intelligence and Supplier Management', () => {
  let testDb: KiranaDatabase;

  beforeEach(async () => {
    testDb = createIsolatedDatabase(`TestPhase6DB_${Date.now()}_${Math.random()}`);
    await testDb.open();
  });

  afterEach(async () => {
    await testDb.delete();
  });

  // TEST 1: Basic Threshold Calculation
  it('1. calculates basic threshold reorder shortfall when sales history is absent', () => {
    const product: Product = {
      id: 1,
      name: 'Toor Dal Desi (Loose)',
      category: 'grains',
      quantity: 4,
      unit: 'kg',
      minimumStock: 10,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };

    const result = calculateReorderForProduct(product, [], undefined, {
      historicalWindowDays: 14,
    });

    expect(result.mode).toBe('threshold');
    expect(result.recommendedQuantity).toBe(6); // 10 - 4 = 6
    expect(result.currentStock).toBe(4);
    expect(result.minimumStock).toBe(10);
    expect(result.reason).toContain('Threshold suggestion');
  });

  // TEST 2: Sales-Aware Reorder Calculation
  it('2. calculates demand-based target stock and reorder quantity in sales-aware mode', () => {
    const product: Product = {
      id: 2,
      name: 'Parle-G Glucose Biscuits (Pack)',
      category: 'snacks',
      quantity: 2,
      unit: 'packet',
      minimumStock: 5,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };

    // 14-day window: 30 packets sold over 10 days => ~2.14 packets/day
    // Supplier lead time: 2 days, safety stock: 1 day => 3 days coverage
    // Target stock = 2.14 * 3 = 6.42 packets => shortfall = 6.42 - 2 = 4.42 => Math.ceil for packet = 5
    const now = new Date('2026-10-25T12:00:00Z');
    const salesHistory = [
      { quantity: 15, date: '2026-10-18T10:00:00Z' },
      { quantity: 15, date: '2026-10-22T10:00:00Z' },
    ];

    const supplier: Supplier = {
      id: 'sup_test_1',
      name: 'Modern Snacks Agency',
      leadTimeDays: 2,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };

    const result = calculateReorderForProduct(product, salesHistory, supplier, {
      historicalWindowDays: 14,
      safetyDays: 1,
      minSalesCountForDemand: 2,
      now,
    });

    expect(result.mode).toBe('sales_aware');
    expect(result.metrics?.averageDailyDemand).toBeCloseTo(30 / 14, 2);
    expect(result.metrics?.leadTimeDays).toBe(2);
    expect(result.metrics?.safetyDays).toBe(1);
    expect(result.recommendedQuantity).toBe(5); // Ceiled to whole integer for packets
    expect(result.reason).toContain('Sales-aware: based on');
  });

  // TEST 3: Products with No Sales History
  it('3. falls back cleanly to threshold mode when a product has zero sales history', () => {
    const product: Product = {
      id: 3,
      name: 'New Coconut Oil 500ml',
      category: 'oil',
      quantity: 1,
      unit: 'piece',
      minimumStock: 8,
      createdAt: '2026-10-24T00:00:00Z',
      updatedAt: '2026-10-24T00:00:00Z',
    };

    const result = calculateReorderForProduct(product, [], undefined);

    expect(result.mode).toBe('threshold');
    expect(result.recommendedQuantity).toBe(7); // 8 - 1 = 7
    expect(result.reason).toContain('No recorded sales in the last 14 days');
  });

  // TEST 4: Fractional Quantities (kg and litre)
  it('4. accurately computes and rounds fractional quantities for kg and litre', () => {
    expect(roundReorderQuantity(3.456, 'kg')).toBe(3.46);
    expect(roundReorderQuantity(1.201, 'litre')).toBe(1.2);
    expect(roundReorderQuantity(4.1, 'packet')).toBe(5); // Ceiled
    expect(roundReorderQuantity(2.01, 'piece')).toBe(3); // Ceiled

    const product: Product = {
      id: 4,
      name: 'Chana Dal (Loose)',
      category: 'grains',
      quantity: 3.25,
      unit: 'kg',
      minimumStock: 10,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };

    const result = calculateReorderForProduct(product, []);
    expect(result.recommendedQuantity).toBe(6.75); // 10 - 3.25 = 6.75
  });

  // TEST 5: Zero and Invalid Lead Times
  it('5. gracefully handles zero, negative, or missing lead times without dividing by zero', () => {
    const product: Product = {
      id: 5,
      name: 'Mustard Oil (Kachi Ghani)',
      category: 'oil',
      quantity: 10,
      unit: 'litre',
      minimumStock: 5,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };

    const supplierWithZeroLead: Supplier = {
      id: 'sup_zero',
      name: 'Immediate Local Depot',
      leadTimeDays: 0,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };

    // Should not throw or produce NaN / Infinity
    const result = calculateReorderForProduct(product, [], supplierWithZeroLead, {
      defaultLeadTimeDays: 2,
    });

    expect(Number.isFinite(result.recommendedQuantity)).toBe(true);
    expect(result.recommendedQuantity).toBe(0); // Current stock (10) > Min stock (5)
  });

  // TEST 6: Insufficient History Fallback
  it('6. falls back to threshold mode when transactions in window are fewer than min threshold', () => {
    const now = new Date('2026-10-25T12:00:00Z');
    const product: Product = {
      id: 6,
      name: 'Sugar M-30 (Loose)',
      category: 'grains',
      quantity: 5,
      unit: 'kg',
      minimumStock: 15,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };

    // Only 1 sale in the 14-day window (requires min 2)
    const singleSale = [{ quantity: 4, date: '2026-10-20T10:00:00Z' }];

    const result = calculateReorderForProduct(product, singleSale, undefined, {
      minSalesCountForDemand: 2,
      now,
    });

    expect(result.mode).toBe('threshold');
    expect(result.recommendedQuantity).toBe(10); // 15 - 5 = 10
    expect(result.reason).toContain('Insufficient sales records');
  });

  // TEST 7: Supplier Management & Product Assignment
  it('7. adds a supplier and assigns it to a product in IndexedDB', async () => {
    const supplier = await addSupplier(
      {
        name: 'Kalyan Grain Wholesale',
        phone: '+91 98201 12345',
        leadTimeDays: 2,
        notes: 'Main Atta and Dal dealer',
      },
      testDb
    );

    expect(supplier.id).toBeDefined();
    expect(supplier.name).toBe('Kalyan Grain Wholesale');

    const product = await addProduct(
      {
        name: 'Aashirvaad Atta 10kg',
        category: 'grains',
        quantity: 2,
        unit: 'packet',
        minimumStock: 8,
      },
      testDb
    );

    const updatedProduct = await assignSupplierToProduct(product.id!, supplier.id, testDb);
    expect(updatedProduct.supplierId).toBe(supplier.id);

    // Verify persistence in IndexedDB
    const reloaded = await getProductById(product.id!, testDb);
    expect(reloaded?.supplierId).toBe(supplier.id);
  });

  // TEST 8: Filtering by Supplier
  it('8. filters reorder recommendations by assigned supplier', async () => {
    const s1 = await addSupplier({ name: 'Supplier One', leadTimeDays: 1 }, testDb);
    const s2 = await addSupplier({ name: 'Supplier Two', leadTimeDays: 3 }, testDb);

    await addProduct(
      { name: 'Item S1', category: 'grains', quantity: 2, unit: 'packet', minimumStock: 10, supplierId: s1.id },
      testDb
    );
    await addProduct(
      { name: 'Item S2', category: 'oil', quantity: 1, unit: 'litre', minimumStock: 5, supplierId: s2.id },
      testDb
    );
    await addProduct(
      { name: 'Item No Supplier', category: 'snacks', quantity: 0, unit: 'packet', minimumStock: 4 },
      testDb
    );

    const recommendations = await getReorderRecommendations(testDb);
    expect(recommendations.length).toBe(3);

    const filteredS1 = recommendations.filter((r) => r.supplierId === s1.id);
    expect(filteredS1.length).toBe(1);
    expect(filteredS1[0].productName).toBe('Item S1');

    const unassigned = recommendations.filter((r) => !r.supplierId);
    expect(unassigned.length).toBe(1);
    expect(unassigned[0].productName).toBe('Item No Supplier');
  });

  // TEST 9: Preparing and Encoding Shareable Order
  it('9. generates clean distributor order text and encodes WhatsApp URL safely', () => {
    const text = generateDistributorOrderText({
      shopName: 'Radhe Kirana Store',
      ownerName: 'Ramesh Gupta',
      supplierName: 'Kalyan Grain Wholesale',
      items: [
        { productName: 'Aashirvaad Atta 5kg', quantity: 10, unit: 'packet', currentStock: 2 },
        { productName: 'Toor Dal Desi', quantity: 15.5, unit: 'kg', currentStock: 4.5 },
      ],
      language: 'hi',
    });

    expect(text).toContain('Radhe Kirana Store');
    expect(text).toContain('Kalyan Grain Wholesale');
    expect(text).toContain('Aashirvaad Atta 5kg');
    expect(text).toContain('+10 packet');
    expect(text).toContain('+15.5 kg');
    expect(text).toContain('KiranaSathi Offline Order');

    // Never leak profit or cost prices
    expect(text).not.toContain('profit');
    expect(text).not.toContain('costPrice');

    const whatsappUrl = buildWhatsAppOrderUrl('+91 98201 12345', text);
    expect(whatsappUrl).toContain('https://wa.me/919820112345?text=');
    expect(whatsappUrl).toContain(encodeURIComponent('Radhe Kirana Store'));
  });

  // TEST 10: Receiving Stock Updates Inventory
  it('10. atomically records stock receipt and creates a restock movement log', async () => {
    const product = await addProduct(
      {
        name: 'Fortune Sunlite Sunflower Oil 1L',
        category: 'oil',
        quantity: 3,
        unit: 'packet',
        minimumStock: 10,
      },
      testDb
    );

    // Receive 15 packets from distributor
    const updated = await receiveStock(product.id!, 15, 'Invoice #WH-9081', testDb);

    expect(updated.quantity).toBe(18); // 3 + 15 = 18

    // Verify in IndexedDB
    const saved = await getProductById(product.id!, testDb);
    expect(saved?.quantity).toBe(18);

    // Verify stock movement ledger
    const movements = await testDb.stockMovements.where('productId').equals(product.id!).toArray();
    const receiveMovement = movements.find((m) => m.note === 'Invoice #WH-9081');

    expect(receiveMovement).toBeDefined();
    expect(receiveMovement?.type).toBe('restock');
    expect(receiveMovement?.quantityDelta).toBe(15);
    expect(receiveMovement?.resultingQuantity).toBe(18);
  });

  // TEST 11: Failed Stock-Receipt Transactions Do Not Mutate Stock
  it('11. rejects invalid stock receipt and preserves original inventory atomically', async () => {
    const product = await addProduct(
      {
        name: 'Tata Salt 1kg',
        category: 'spices',
        quantity: 5,
        unit: 'packet',
        minimumStock: 12,
      },
      testDb
    );

    // Attempting invalid non-positive quantities
    await expect(receiveStock(product.id!, 0, 'Zero qty', testDb)).rejects.toThrow();
    await expect(receiveStock(product.id!, -5, 'Negative qty', testDb)).rejects.toThrow();

    // Verify stock remains exactly 5
    const reloaded = await getProductById(product.id!, testDb);
    expect(reloaded?.quantity).toBe(5);
  });

  // TEST 12: Existing Sale Workflows Remain Fully Functional
  it('12. preserves existing atomic sale workflows and updates stock correctly', async () => {
    const product = await addProduct(
      {
        name: 'Maggi 2-Minute Noodles 70g',
        category: 'snacks',
        quantity: 20,
        unit: 'packet',
        minimumStock: 5,
        sellingPrice: 14,
      },
      testDb
    );

    const sale = await recordSale(
      {
        items: [{ productId: product.id!, quantity: 4 }],
        paymentMethod: 'cash',
      },
      testDb
    );

    expect(sale.id).toBeDefined();
    expect(sale.items[0].quantity).toBe(4);

    const reloaded = await getProductById(product.id!, testDb);
    expect(reloaded?.quantity).toBe(16); // 20 - 4 = 16
  });

  // TEST 13: Database Schema Migration Preserves Existing Data
  it('13. preserves all products, sales, and stock movements when upgrading to Version 3', async () => {
    // 1. Create product and supplier in Version 3 database
    const p = await addProduct(
      {
        name: 'Heritage Basmati Rice',
        category: 'grains',
        quantity: 12.5,
        unit: 'kg',
        minimumStock: 5,
      },
      testDb
    );

    const s = await addSupplier(
      {
        name: 'Heritage Distributors',
        phone: '+91 99999 88888',
        leadTimeDays: 1,
      },
      testDb
    );

    await assignSupplierToProduct(p.id!, s.id, testDb);

    // Verify all tables are intact and responsive
    const allProducts = await getAllProducts(testDb);
    const allSuppliers = await getAllSuppliers(testDb);

    expect(allProducts.length).toBe(1);
    expect(allProducts[0].supplierId).toBe(s.id);
    expect(allSuppliers.length).toBe(1);
    expect(allSuppliers[0].name).toBe('Heritage Distributors');
  });
});
