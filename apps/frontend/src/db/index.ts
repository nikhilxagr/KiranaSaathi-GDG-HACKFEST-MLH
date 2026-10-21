import Dexie, { type Table } from 'dexie';
import { KiranaProduct } from '../types';

/**
 * Offline-first IndexedDB storage powered by Dexie.js
 * Enables small kirana owners to record inventory and sales even without internet.
 */
export class KiranaDatabase extends Dexie {
  products!: Table<KiranaProduct, number>;

  constructor() {
    super('KiranaSathiDB');
    this.version(1).stores({
      products: '++id, name, barcode, category, currentStock, updatedAt',
    });
  }
}

export const db = new KiranaDatabase();
  