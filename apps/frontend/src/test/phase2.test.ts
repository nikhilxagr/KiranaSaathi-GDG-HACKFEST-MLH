import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createIsolatedDatabase,
  KiranaDatabase,
} from '../db';
import {
  addProduct,
  updateProduct,
  addStock,
  adjustStock,
  getAllProducts,
  calculateReorderSuggestion,
  getSlowMovingAnalysis,
} from '../services/inventoryService';
import {
  recordSale,
  getAllSales,
} from '../services/salesService';

describe('Phase 2: Real Inventory, Sales, and IndexedDB Operations', () => {
  let testDb: KiranaDatabase;
  const dbName = 'test_kirana_phase2_' + Math.random().toString(36).substring(7);

  beforeEach(async () => {
    testDb = createIsolatedDatabase(dbName);
    await testDb.open();
  });

  afterEach(async () => {
    if (testDb.isOpen()) {
      await testDb.delete();
    }
  });

  // Test 1: Add product with valid fields
  it('1. Adds a new product and persists it with generated id and timestamps', async () => {
    const product = await addProduct(
      {
        name: 'Aashirvaad Chakki Atta',
        nameHindi: 'आशीर्वाद चक्की आटा',
        category: 'grains',
        quantity: 10,
        unit: 'packet',
        minimumStock: 5,
        costPrice: 210,
        sellingPrice: 245,
      },
      testDb
    );

    expect(product.id).toBeDefined();
    expect(product.id).toBeGreaterThan(0);
    expect(product.name).toBe('Aashirvaad Chakki Atta');
    expect(product.quantity).toBe(10);
    expect(product.minimumStock).toBe(5);
    expect(product.createdAt).toBeDefined();
    expect(product.updatedAt).toBeDefined();

    // Verify it is in database
    const saved = await testDb.products.get(product.id!);
    expect(saved).toBeDefined();
    expect(saved?.name).toBe('Aashirvaad Chakki Atta');
  });

  // Test 2: Edit product details
  it('2. Edits existing product details and updates timestamp in database', async () => {
    const product = await addProduct(
      {
        name: 'Sugar M-30',
        nameHindi: 'चीनी',
        category: 'grains',
        quantity: 50,
        unit: 'kg',
        minimumStock: 15,
        costPrice: 38,
        sellingPrice: 44,
      },
      testDb
    );

    const updated = await updateProduct(
      product.id!,
      {
        name: 'Premium Sulphurless Sugar',
        sellingPrice: 48,
        minimumStock: 20,
      },
      testDb
    );

    expect(updated.name).toBe('Premium Sulphurless Sugar');
    expect(updated.sellingPrice).toBe(48);
    expect(updated.minimumStock).toBe(20);
    expect(updated.quantity).toBe(50); // Unchanged stock
  });

  // Test 3: Fractional quantities (2.5 kg, +0.75 kg)
  it('3. Handles fractional quantities accurately without floating point drift', async () => {
    const product = await addProduct(
      {
        name: 'India Gate Basmati Rice',
        nameHindi: 'बासमती चावल',
        category: 'grains',
        quantity: 2.5,
        unit: 'kg',
        minimumStock: 5.0,
      },
      testDb
    );

    expect(product.quantity).toBe(2.5);

    // Adjust by +0.75 kg
    const updated = await addStock(product.id!, 0.75, 'Wholesale batch', testDb);
    expect(updated.quantity).toBe(3.25);

    // Verify in database
    const inDb = await testDb.products.get(product.id!);
    expect(inDb?.quantity).toBe(3.25);
  });

  // Test 4: Add stock and verify stock movement audit record
  it('4. Adds stock to existing product and logs a restock movement record', async () => {
    const product = await addProduct(
      {
        name: 'Tata Salt',
        nameHindi: 'टाटा नमक',
        category: 'spices',
        quantity: 10,
        unit: 'packet',
        minimumStock: 15,
      },
      testDb
    );

    const updated = await addStock(product.id!, 20, 'Distributor delivery', testDb);
    expect(updated.quantity).toBe(30);

    // Check stockMovements table
    const movements = await testDb.stockMovements
      .where('productId')
      .equals(product.id!)
      .toArray();

    // 1 from initial creation + 1 from restock = 2 movements
    expect(movements.length).toBe(2);
    const restockMovement = movements.find((m) => m.type === 'restock' && m.quantityDelta === 20);
    expect(restockMovement).toBeDefined();
    expect(restockMovement?.resultingQuantity).toBe(30);
    expect(restockMovement?.note).toBe('Distributor delivery');
  });

  // Test 5: Record valid sale
  it('5. Records valid sale, decrements stock atomically, and creates sale record', async () => {
    const p1 = await addProduct(
      {
        name: 'Maggi Noodles 70g',
        nameHindi: 'मैगी नूडल्स',
        category: 'snacks',
        quantity: 24,
        unit: 'packet',
        minimumStock: 10,
        costPrice: 11,
        sellingPrice: 14,
      },
      testDb
    );

    const sale = await recordSale(
      {
        items: [{ productId: p1.id!, quantity: 4 }],
        paymentMethod: 'cash',
      },
      testDb
    );

    expect(sale.id).toBeDefined();
    expect(sale.receiptNumber).toMatch(/^REC-/);
    expect(sale.totalAmount).toBe(56); // 4 * 14
    expect(sale.items.length).toBe(1);
    expect(sale.items[0].quantity).toBe(4);

    // Verify product stock decremented
    const updatedProduct = await testDb.products.get(p1.id!);
    expect(updatedProduct?.quantity).toBe(20);

    // Verify stock movement logged with type 'sale'
    const movements = await testDb.stockMovements
      .where('productId')
      .equals(p1.id!)
      .toArray();
    const saleMovement = movements.find((m) => m.type === 'sale');
    expect(saleMovement).toBeDefined();
    expect(saleMovement?.quantityDelta).toBe(-4);
    expect(saleMovement?.resultingQuantity).toBe(20);
    expect(saleMovement?.saleId).toBe(sale.id);
  });

  // Test 6: Reject sale when stock is insufficient
  it('6. Rejects sale and throws descriptive error when stock is insufficient', async () => {
    const product = await addProduct(
      {
        name: 'Amul Butter 100g',
        nameHindi: 'अमूल मक्खन',
        category: 'dairy',
        quantity: 2,
        unit: 'packet',
        minimumStock: 5,
        sellingPrice: 58,
      },
      testDb
    );

    // Attempt to sell 5 when only 2 in stock
    await expect(
      recordSale(
        {
          items: [{ productId: product.id!, quantity: 5 }],
          paymentMethod: 'cash',
        },
        testDb
      )
    ).rejects.toThrow(/Insufficient stock|पर्याप्त स्टॉक नहीं/);

    // Verify stock was NOT decremented
    const unaffected = await testDb.products.get(product.id!);
    expect(unaffected?.quantity).toBe(2);

    // Verify no sales records created
    const sales = await getAllSales(testDb);
    expect(sales.length).toBe(0);
  });

  // Test 7: Rollback multi-product sale on single item failure
  it('7. Atomically rolls back multi-product sale if any line item has insufficient stock', async () => {
    const p1 = await addProduct(
      {
        name: 'Product A (In Stock)',
        category: 'snacks',
        quantity: 20,
        unit: 'packet',
        sellingPrice: 25,
        minimumStock: 5,
      },
      testDb
    );

    const p2 = await addProduct(
      {
        name: 'Product B (Low Stock)',
        category: 'snacks',
        quantity: 1,
        unit: 'packet',
        sellingPrice: 30,
        minimumStock: 5,
      },
      testDb
    );

    // Attempt multi-item sale where p2 fails (requesting 5 when only 1 available)
    await expect(
      recordSale(
        {
          items: [
            { productId: p1.id!, quantity: 5 },
            { productId: p2.id!, quantity: 5 },
          ],
          paymentMethod: 'upi',
        },
        testDb
      )
    ).rejects.toThrow();

    // Verify Product A stock was completely rolled back and NOT decremented!
    const productA = await testDb.products.get(p1.id!);
    expect(productA?.quantity).toBe(20);

    const productB = await testDb.products.get(p2.id!);
    expect(productB?.quantity).toBe(1);

    // No sale in database
    const allSales = await getAllSales(testDb);
    expect(allSales.length).toBe(0);
  });

  // Test 8: Prevent duplicate submissions / concurrency protection
  it('8. Handles sequential and rapid transactions cleanly without negative inventory', async () => {
    const product = await addProduct(
      {
        name: 'Fortune Mustard Oil 1L',
        category: 'oil',
        quantity: 3,
        unit: 'litre',
        sellingPrice: 145,
        minimumStock: 2,
      },
      testDb
    );

    // First sale succeeds
    const s1 = await recordSale(
      {
        items: [{ productId: product.id!, quantity: 2 }],
        paymentMethod: 'cash',
      },
      testDb
    );
    expect(s1).toBeDefined();

    // Second sale requesting 2 should fail because only 1 is left
    await expect(
      recordSale(
        {
          items: [{ productId: product.id!, quantity: 2 }],
          paymentMethod: 'cash',
        },
        testDb
      )
    ).rejects.toThrow();

    const finalProduct = await testDb.products.get(product.id!);
    expect(finalProduct?.quantity).toBe(1);
  });

  // Test 9: Low-stock calculation
  it('9. Correctly identifies low-stock products where quantity <= minimumStock', async () => {
    const p1 = await addProduct(
      {
        name: 'Low Stock Item',
        category: 'spices',
        quantity: 4,
        minimumStock: 10,
        unit: 'packet',
      },
      testDb
    );

    const p2 = await addProduct(
      {
        name: 'Healthy Stock Item',
        category: 'spices',
        quantity: 25,
        minimumStock: 10,
        unit: 'packet',
      },
      testDb
    );

    const p3 = await addProduct(
      {
        name: 'Zero Stock Item',
        category: 'spices',
        quantity: 0,
        minimumStock: 5,
        unit: 'packet',
      },
      testDb
    );

    const all = await getAllProducts(testDb);
    const lowStock = all.filter((p) => p.quantity <= p.minimumStock);

    expect(lowStock.length).toBe(2);
    expect(lowStock.some((p) => p.id === p1.id)).toBe(true);
    expect(lowStock.some((p) => p.id === p3.id)).toBe(true);
    expect(lowStock.some((p) => p.id === p2.id)).toBe(false);
  });

  // Test 10: Reorder calculation formula: max(0, minimumStock - quantity)
  it('10. Calculates reorder suggestions using exact formula: max(0, minimumStock - quantity)', async () => {
    const low = await addProduct(
      {
        name: 'Item A',
        category: 'grains',
        quantity: 3,
        minimumStock: 10,
        unit: 'packet',
      },
      testDb
    );

    const healthy = await addProduct(
      {
        name: 'Item B',
        category: 'grains',
        quantity: 15,
        minimumStock: 10,
        unit: 'packet',
      },
      testDb
    );

    const zero = await addProduct(
      {
        name: 'Item C',
        category: 'grains',
        quantity: 0,
        minimumStock: 8,
        unit: 'packet',
      },
      testDb
    );

    expect(calculateReorderSuggestion(low)).toBe(7); // 10 - 3
    expect(calculateReorderSuggestion(healthy)).toBe(0); // max(0, 10 - 15) = 0
    expect(calculateReorderSuggestion(zero)).toBe(8); // 8 - 0
  });

  // Test 11: Distinguish newly added products from actual slow-moving products
  it('11. Distinguishes newly added products (<30 days old) from actual slow-moving inventory', async () => {
    const now = new Date();
    const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Old product created 40 days ago with NO sales -> SHOULD be slow-moving
    await testDb.products.add({
      name: 'Old Unsold Item',
      category: 'spices',
      quantity: 10,
      minimumStock: 5,
      unit: 'packet',
      createdAt: fortyDaysAgo,
      updatedAt: fortyDaysAgo,
    });

    // 2. Newly added product created 2 days ago with NO sales -> SHOULD NOT be slow-moving (isNewlyAdded: true)
    await testDb.products.add({
      name: 'Freshly Added Item',
      category: 'snacks',
      quantity: 20,
      minimumStock: 5,
      unit: 'packet',
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo,
    });

    const analysis = await getSlowMovingAnalysis(testDb, 30);

    const oldItemAnalysis = analysis.find((a) => a.product.name === 'Old Unsold Item');
    const newItemAnalysis = analysis.find((a) => a.product.name === 'Freshly Added Item');

    expect(oldItemAnalysis?.isSlowMoving).toBe(true);
    expect(oldItemAnalysis?.isNewlyAdded).toBe(false);

    expect(newItemAnalysis?.isSlowMoving).toBe(false);
    expect(newItemAnalysis?.isNewlyAdded).toBe(true);
  });

  // Test 12: Persistence across simulated reload (fresh database instance with same name)
  it('12. Persists data across simulated browser reloads when reopened with same database name', async () => {
    // Add product to testDb
    const product = await addProduct(
      {
        name: 'Persistent Product',
        category: 'household',
        quantity: 15,
        minimumStock: 5,
        unit: 'piece',
      },
      testDb
    );

    // Record a sale
    const sale = await recordSale(
      {
        items: [{ productId: product.id!, quantity: 3 }],
        paymentMethod: 'cash',
      },
      testDb
    );

    // Close current connection
    testDb.close();

    // Open a fresh new KiranaDatabase instance pointing to the exact same dbName
    const reloadedDb = createIsolatedDatabase(dbName);
    await reloadedDb.open();

    // Verify product exists and has updated quantity (15 - 3 = 12)
    const fetchedProduct = await reloadedDb.products.get(product.id!);
    expect(fetchedProduct).toBeDefined();
    expect(fetchedProduct?.name).toBe('Persistent Product');
    expect(fetchedProduct?.quantity).toBe(12);

    // Verify sale exists
    const fetchedSale = await reloadedDb.sales.get(Number(sale.id));
    expect(fetchedSale).toBeDefined();
    expect(fetchedSale?.receiptNumber).toBe(sale.receiptNumber);

    // Verify stock movement exists
    const movements = await reloadedDb.stockMovements.toArray();
    expect(movements.length).toBeGreaterThanOrEqual(2);

    await reloadedDb.delete();
  });
});
