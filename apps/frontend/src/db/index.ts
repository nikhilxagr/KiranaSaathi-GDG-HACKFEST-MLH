import Dexie, { type Table } from 'dexie';
import { Product, Sale, StockMovement } from '../types';

/**
 * Offline-First IndexedDB Database for KiranaSathi using Dexie.js
 * Version 2: Introduces full tables for Products, Sales, and StockMovement ledgers.
 */
export class KiranaDatabase extends Dexie {
  products!: Table<Product, number>;
  sales!: Table<Sale, number>;
  stockMovements!: Table<StockMovement, number>;

  constructor(dbName = 'KiranaSathiDB') {
    super(dbName);

    // Schema Version 1 (Phase 0 legacy)
    this.version(1).stores({
      products: '++id, name, barcode, category, currentStock, updatedAt',
    });

    // Schema Version 2 (Phase 2: Real persistent inventory, sales & movements)
    this.version(2)
      .stores({
        products: '++id, name, category, quantity, minimumStock, createdAt, updatedAt',
        sales: '++id, receiptNumber, createdAt, totalAmount, paymentMethod',
        stockMovements: '++id, productId, type, createdAt, saleId',
      })
      .upgrade((tx) => {
        // Safe migration of existing Version 1 records
        return tx
          .table('products')
          .toCollection()
          .modify((product: Record<string, unknown>) => {
            if (product.quantity === undefined && product.currentStock !== undefined) {
              product.quantity = product.currentStock;
            }
            if (product.minimumStock === undefined && product.minThreshold !== undefined) {
              product.minimumStock = product.minThreshold;
            }
            if (!product.createdAt) {
              product.createdAt = product.updatedAt || new Date().toISOString();
            }
          });
      });
  }
}

// Single persistent singleton instance for browser runtime
export const db = new KiranaDatabase();

// Factory for isolated unit testing
export const createIsolatedDatabase = (name = `KiranaTestDB_${Date.now()}_${Math.random()}`) => {
  return new KiranaDatabase(name);
};