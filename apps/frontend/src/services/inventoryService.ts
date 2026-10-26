import { db, KiranaDatabase } from '../db';
import { Product, ProductCategory, ProductUnit, StockMovement } from '../types';
import { INITIAL_MOCK_PRODUCTS } from '../data/mockProducts';

/**
 * Validation helper for product input fields
 */
export const validateProductInput = (data: {
  name: string;
  quantity: number;
  minimumStock: number;
  costPrice?: number;
  sellingPrice?: number;
}) => {
  if (!data.name || !data.name.trim()) {
    throw new Error('Product name cannot be blank.');
  }

  if (typeof data.quantity !== 'number' || !Number.isFinite(data.quantity) || data.quantity < 0) {
    throw new Error('Quantity must be a valid non-negative number.');
  }

  if (
    typeof data.minimumStock !== 'number' ||
    !Number.isFinite(data.minimumStock) ||
    data.minimumStock < 0
  ) {
    throw new Error('Minimum stock threshold must be a valid non-negative number.');
  }

  if (data.costPrice !== undefined && (!Number.isFinite(data.costPrice) || data.costPrice < 0)) {
    throw new Error('Cost price cannot be negative.');
  }

  if (
    data.sellingPrice !== undefined &&
    (!Number.isFinite(data.sellingPrice) || data.sellingPrice < 0)
  ) {
    throw new Error('Selling price cannot be negative.');
  }
};

/**
 * Normalize product to ensure backwards compatibility properties
 */
export const normalizeProduct = (p: Product): Product => {
  return {
    ...p,
    currentStock: p.quantity,
    minThreshold: p.minimumStock,
  };
};

/**
 * Fetch all products from IndexedDB
 */
export const getAllProducts = async (database: KiranaDatabase = db): Promise<Product[]> => {
  const items = await database.products.toArray();
  return items.map(normalizeProduct);
};

/**
 * Fetch product by ID
 */
export const getProductById = async (
  id: number,
  database: KiranaDatabase = db
): Promise<Product | undefined> => {
  const p = await database.products.get(id);
  return p ? normalizeProduct(p) : undefined;
};

/**
 * Search and filter products
 */
export const searchProducts = async (
  query: string,
  category?: string,
  database: KiranaDatabase = db
): Promise<Product[]> => {
  const all = await getAllProducts(database);
  const q = query.toLowerCase().trim();

  return all.filter((p) => {
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.nameHindi && p.nameHindi.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.includes(q));

    const matchesCategory = !category || category === 'all' || p.category === category;

    return matchesQuery && matchesCategory;
  });
};

/**
 * Add a new product into IndexedDB and log initial stock movement
 */
export const addProduct = async (
  input: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'currentStock' | 'minThreshold'>,
  database: KiranaDatabase = db
): Promise<Product> => {
  validateProductInput(input);

  const now = new Date().toISOString();
  const newProduct: Product = {
    name: input.name.trim(),
    nameHindi: input.nameHindi?.trim(),
    barcode: input.barcode?.trim(),
    category: input.category,
    quantity: Number(input.quantity.toFixed(2)),
    unit: input.unit,
    minimumStock: Number(input.minimumStock.toFixed(2)),
    costPrice: input.costPrice !== undefined ? Number(input.costPrice.toFixed(2)) : undefined,
    sellingPrice: input.sellingPrice !== undefined ? Number(input.sellingPrice.toFixed(2)) : undefined,
    supplierId: input.supplierId || undefined,
    createdAt: now,
    updatedAt: now,
  };

  return await database.transaction('rw', [database.products, database.stockMovements], async () => {
    const newId = await database.products.add(newProduct);
    const saved = { ...newProduct, id: Number(newId) };

    // Record initial stock entry movement
    if (saved.quantity > 0) {
      await database.stockMovements.add({
        productId: saved.id,
        productName: saved.name,
        type: 'restock',
        quantityDelta: saved.quantity,
        resultingQuantity: saved.quantity,
        note: 'Initial product stock creation',
        createdAt: now,
      });
    }

    return normalizeProduct(saved);
  });
};

/**
 * Edit existing product details in IndexedDB
 */
export const updateProduct = async (
  id: number,
  updates: Partial<Omit<Product, 'id' | 'createdAt'>>,
  database: KiranaDatabase = db
): Promise<Product> => {
  const existing = await database.products.get(id);
  if (!existing) {
    throw new Error(`Product with ID ${id} not found.`);
  }

  const merged = {
    name: updates.name !== undefined ? updates.name : existing.name,
    quantity: updates.quantity !== undefined ? updates.quantity : existing.quantity,
    minimumStock: updates.minimumStock !== undefined ? updates.minimumStock : existing.minimumStock,
    costPrice: updates.costPrice !== undefined ? updates.costPrice : existing.costPrice,
    sellingPrice: updates.sellingPrice !== undefined ? updates.sellingPrice : existing.sellingPrice,
  };

  validateProductInput(merged);

  const now = new Date().toISOString();
  const updatedRecord: Product = {
    ...existing,
    ...updates,
    id,
    supplierId: updates.supplierId !== undefined ? updates.supplierId : existing.supplierId,
    updatedAt: now,
  };

  await database.products.put(updatedRecord);
  return normalizeProduct(updatedRecord);
};

/**
 * Atomically receive purchased stock from a supplier.
 * Validates positive quantity, updates product stock, and records a 'restock' movement.
 */
export const receiveStock = async (
  productId: number,
  quantityReceived: number,
  note = 'Wholesale purchase receipt',
  database: KiranaDatabase = db
): Promise<Product> => {
  if (
    typeof quantityReceived !== 'number' ||
    !Number.isFinite(quantityReceived) ||
    quantityReceived <= 0
  ) {
    throw new Error('Received quantity must be a positive number greater than zero.');
  }

  return await addStock(productId, quantityReceived, note, database);
};

/**
 * Add stock quantity safely to existing product and record movement
 */
export const addStock = async (
  productId: number,
  quantityToAdd: number,
  note = 'Stock addition',
  database: KiranaDatabase = db
): Promise<Product> => {
  if (typeof quantityToAdd !== 'number' || !Number.isFinite(quantityToAdd) || quantityToAdd <= 0) {
    throw new Error('Stock addition quantity must be greater than zero.');
  }

  return await database.transaction('rw', [database.products, database.stockMovements], async () => {
    const product = await database.products.get(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found.`);
    }

    const resultingQuantity = Number((product.quantity + quantityToAdd).toFixed(2));
    const now = new Date().toISOString();

    await database.products.update(productId, {
      quantity: resultingQuantity,
      updatedAt: now,
    });

    await database.stockMovements.add({
      productId,
      productName: product.name,
      type: 'restock',
      quantityDelta: Number(quantityToAdd.toFixed(2)),
      resultingQuantity,
      note,
      createdAt: now,
    });

    return normalizeProduct({
      ...product,
      quantity: resultingQuantity,
      updatedAt: now,
    });
  });
};

/**
 * Adjust stock quantity directly and record adjustment movement
 */
export const adjustStock = async (
  productId: number,
  newQuantity: number,
  reason = 'Stock adjustment',
  database: KiranaDatabase = db
): Promise<Product> => {
  if (typeof newQuantity !== 'number' || !Number.isFinite(newQuantity) || newQuantity < 0) {
    throw new Error('Quantity cannot be negative.');
  }

  return await database.transaction('rw', [database.products, database.stockMovements], async () => {
    const product = await database.products.get(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found.`);
    }

    const roundedNewQty = Number(newQuantity.toFixed(2));
    const delta = Number((roundedNewQty - product.quantity).toFixed(2));
    const now = new Date().toISOString();

    await database.products.update(productId, {
      quantity: roundedNewQty,
      updatedAt: now,
    });

    await database.stockMovements.add({
      productId,
      productName: product.name,
      type: 'adjustment',
      quantityDelta: delta,
      resultingQuantity: roundedNewQty,
      note: reason,
      createdAt: now,
    });

    return normalizeProduct({
      ...product,
      quantity: roundedNewQty,
      updatedAt: now,
    });
  });
};

/**
 * Delete a product if explicitly invoked
 */
export const deleteProduct = async (
  productId: number,
  database: KiranaDatabase = db
): Promise<void> => {
  await database.products.delete(productId);
};

/**
 * Seed initial demonstration products into IndexedDB on first run.
 * Never duplicates records if products already exist.
 */
export const seedInitialSampleData = async (
  database: KiranaDatabase = db
): Promise<number> => {
  const currentCount = await database.products.count();
  if (currentCount > 0) {
    return 0; // Already has products, do not overwrite or duplicate
  }

  const now = new Date().toISOString();
  let count = 0;

  await database.transaction('rw', [database.products, database.stockMovements], async () => {
    for (const item of INITIAL_MOCK_PRODUCTS) {
      const newProduct: Product = {
        name: item.name,
        nameHindi: item.nameHindi,
        barcode: item.barcode,
        category: item.category as ProductCategory,
        quantity: item.quantity ?? item.currentStock ?? 0,
        unit: item.unit as ProductUnit,
        minimumStock: item.minimumStock ?? item.minThreshold ?? 0,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        createdAt: item.createdAt || item.updatedAt || now,
        updatedAt: item.updatedAt || now,
      };

      const newId = await database.products.add(newProduct);
      count++;

      if (newProduct.quantity > 0) {
        await database.stockMovements.add({
          productId: Number(newId),
          productName: newProduct.name,
          type: 'restock',
          quantityDelta: newProduct.quantity,
          resultingQuantity: newProduct.quantity,
          note: 'Sample catalog seed',
          createdAt: newProduct.createdAt,
        });
      }
    }
  });

  return count;
};

/**
 * Reset the database by clearing products, sales, and stock movements,
 * then seeding initial sample data.
 */
export const resetDatabaseToSampleData = async (
  database: KiranaDatabase = db
): Promise<number> => {
  await database.transaction(
    'rw',
    [database.products, database.sales, database.stockMovements],
    async () => {
      await database.sales.clear();
      await database.stockMovements.clear();
      await database.products.clear();
    }
  );

  return await seedInitialSampleData(database);
};

/**
 * Compute threshold-based reorder suggestion: max(0, minimumStock - currentQuantity)
 */
export const calculateReorderSuggestion = (product: Product): number => {
  const shortfall = product.minimumStock - product.quantity;
  return Math.max(0, Number(shortfall.toFixed(2)));
};

/**
 * Identify slow-moving products using actual sales history from IndexedDB.
 * A product is slow-moving if it has been inactive for >= inactivityDays.
 * Distinguishes newly added products (created within inactivityDays with no sales yet)
 * so they are NOT falsely labelled as slow-moving.
 */
export const getSlowMovingAnalysis = async (
  database: KiranaDatabase = db,
  inactivityDays = 30
): Promise<
  {
    product: Product;
    lastSoldDate: string | null;
    daysSinceLastSale: number | null;
    isNewlyAdded: boolean;
    isSlowMoving: boolean;
  }[]
> => {
  const products = await getAllProducts(database);
  const now = Date.now();
  const msPerDay = 1000 * 60 * 60 * 24;

  const results = await Promise.all(
    products.map(async (p) => {
      // Find the most recent 'sale' movement for this product
      const lastSaleMovement = await database.stockMovements
        .where('productId')
        .equals(p.id!)
        .filter((m) => m.type === 'sale')
        .reverse()
        .sortBy('createdAt');

      const mostRecent = lastSaleMovement[0];
      const productAgeDays = (now - new Date(p.createdAt).getTime()) / msPerDay;

      if (!mostRecent) {
        // Never sold
        const isNewlyAdded = productAgeDays < inactivityDays;
        return {
          product: p,
          lastSoldDate: null,
          daysSinceLastSale: null,
          isNewlyAdded,
          isSlowMoving: !isNewlyAdded, // Only slow-moving if in store for >= 30 days without sale
        };
      }

      const daysSinceLastSale = Math.floor(
        (now - new Date(mostRecent.createdAt).getTime()) / msPerDay
      );
      const isSlowMoving = daysSinceLastSale >= inactivityDays;

      return {
        product: p,
        lastSoldDate: mostRecent.createdAt,
        daysSinceLastSale,
        isNewlyAdded: false,
        isSlowMoving,
      };
    })
  );

  return results;
};
