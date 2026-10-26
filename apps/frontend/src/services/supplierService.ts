import { db, KiranaDatabase } from '../db';
import { Supplier, Product } from '../types';
import { normalizeProduct } from './inventoryService';

/**
 * Validation helper for wholesale supplier input fields
 */
export const validateSupplierInput = (data: {
  name: string;
  leadTimeDays?: number;
  phone?: string;
}) => {
  if (!data.name || !data.name.trim()) {
    throw new Error('Supplier or distributor name cannot be blank.');
  }

  if (
    data.leadTimeDays !== undefined &&
    (!Number.isFinite(data.leadTimeDays) || data.leadTimeDays < 0)
  ) {
    throw new Error('Delivery lead time must be a non-negative number of days.');
  }
};

/**
 * Default starter suppliers for quick evaluation and demonstration
 */
export const INITIAL_SUPPLIERS: Omit<Supplier, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'sup_kalyan_wholesale',
    name: 'Kalyan Grocery & Grain Wholesale',
    phone: '+91 98201 12345',
    leadTimeDays: 2,
    notes: 'Main distributor for Atta, Dal, Basmati Rice, and sugar bags.',
  },
  {
    id: 'sup_ganesh_spices',
    name: 'Shree Ganesh Oil & Spices Depot',
    phone: '+91 98112 34567',
    leadTimeDays: 3,
    notes: 'Mustard oil, refined sunflower oil, and whole/ground spices.',
  },
  {
    id: 'sup_amul_dairy',
    name: 'Amul & Dairy Products Agency',
    phone: '+91 98330 54321',
    leadTimeDays: 1,
    notes: 'Daily morning deliveries for milk pouches, curd, and butter.',
  },
];

/**
 * Fetch all suppliers from IndexedDB
 */
export const getAllSuppliers = async (
  database: KiranaDatabase = db
): Promise<Supplier[]> => {
  return await database.suppliers.toArray();
};

/**
 * Fetch a single supplier by ID
 */
export const getSupplierById = async (
  id: string,
  database: KiranaDatabase = db
): Promise<Supplier | undefined> => {
  return await database.suppliers.get(id);
};

/**
 * Add a new supplier to IndexedDB
 */
export const addSupplier = async (
  input: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>,
  database: KiranaDatabase = db
): Promise<Supplier> => {
  validateSupplierInput(input);

  const now = new Date().toISOString();
  const id = `sup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newSupplier: Supplier = {
    id,
    name: input.name.trim(),
    phone: input.phone?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    leadTimeDays:
      input.leadTimeDays !== undefined ? Math.max(0, Math.round(input.leadTimeDays)) : undefined,
    createdAt: now,
    updatedAt: now,
  };

  await database.suppliers.add(newSupplier);
  return newSupplier;
};

/**
 * Update an existing supplier's details
 */
export const updateSupplier = async (
  id: string,
  updates: Partial<Omit<Supplier, 'id' | 'createdAt'>>,
  database: KiranaDatabase = db
): Promise<Supplier> => {
  const existing = await database.suppliers.get(id);
  if (!existing) {
    throw new Error(`Supplier with ID "${id}" not found.`);
  }

  if (updates.name !== undefined || updates.leadTimeDays !== undefined || updates.phone !== undefined) {
    validateSupplierInput({
      name: updates.name !== undefined ? updates.name : existing.name,
      leadTimeDays: updates.leadTimeDays !== undefined ? updates.leadTimeDays : existing.leadTimeDays,
      phone: updates.phone !== undefined ? updates.phone : existing.phone,
    });
  }

  const now = new Date().toISOString();
  const updatedRecord: Supplier = {
    ...existing,
    ...updates,
    id,
    name: updates.name !== undefined ? updates.name.trim() : existing.name,
    phone: updates.phone !== undefined ? (updates.phone.trim() || undefined) : existing.phone,
    notes: updates.notes !== undefined ? (updates.notes.trim() || undefined) : existing.notes,
    leadTimeDays:
      updates.leadTimeDays !== undefined
        ? Math.max(0, Math.round(updates.leadTimeDays))
        : existing.leadTimeDays,
    updatedAt: now,
  };

  await database.suppliers.put(updatedRecord);
  return updatedRecord;
};

/**
 * Delete a supplier and safely unassign it from all associated products
 */
export const deleteSupplier = async (
  id: string,
  database: KiranaDatabase = db
): Promise<void> => {
  await database.transaction('rw', [database.suppliers, database.products], async () => {
    // 1. Unassign from any products
    const associatedProducts = await database.products
      .where('supplierId')
      .equals(id)
      .toArray();

    const now = new Date().toISOString();
    for (const p of associatedProducts) {
      if (p.id) {
        await database.products.update(p.id, {
          supplierId: undefined,
          updatedAt: now,
        });
      }
    }

    // 2. Remove supplier record
    await database.suppliers.delete(id);
  });
};

/**
 * Assign or unassign a supplier to a product
 */
export const assignSupplierToProduct = async (
  productId: number,
  supplierId: string | undefined,
  database: KiranaDatabase = db
): Promise<Product> => {
  return await database.transaction('rw', [database.products, database.suppliers], async () => {
    const product = await database.products.get(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found.`);
    }

    if (supplierId) {
      const supplierExists = await database.suppliers.get(supplierId);
      if (!supplierExists) {
        throw new Error(`Supplier with ID "${supplierId}" does not exist.`);
      }
    }

    const now = new Date().toISOString();
    await database.products.update(productId, {
      supplierId: supplierId || undefined,
      updatedAt: now,
    });

    return normalizeProduct({
      ...product,
      supplierId: supplierId || undefined,
      updatedAt: now,
    });
  });
};

/**
 * Seed initial sample suppliers on first run if table is empty
 */
export const seedInitialSuppliers = async (
  database: KiranaDatabase = db
): Promise<number> => {
  const currentCount = await database.suppliers.count();
  if (currentCount > 0) {
    return 0; // Already has suppliers, preserve user records
  }

  const now = new Date().toISOString();
  let count = 0;

  await database.transaction('rw', database.suppliers, async () => {
    for (const s of INITIAL_SUPPLIERS) {
      await database.suppliers.put({
        ...s,
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }
  });

  return count;
};
