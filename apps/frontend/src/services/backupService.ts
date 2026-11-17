import { db } from '../db';

export interface DatabaseBackupPayload {
  appName: string;
  version: string;
  exportedAt: string;
  recordCounts: {
    products: number;
    sales: number;
    stockMovements: number;
    suppliers: number;
  };
  data: {
    products: any[];
    sales: any[];
    stockMovements: any[];
    suppliers: any[];
    preferences: any | null;
  };
}

/**
 * Exports all local IndexedDB tables and shop preferences to a timestamped JSON file.
 * Completely offline, client-side, zero cloud dependency.
 */
export const exportDatabaseBackup = async (): Promise<{
  fileName: string;
  recordCount: number;
}> => {
  const [products, sales, stockMovements, suppliers] = await Promise.all([
    db.products.toArray(),
    db.sales.toArray(),
    db.stockMovements.toArray(),
    db.suppliers.toArray(),
  ]);

  let preferences: any = null;
  try {
    const raw = localStorage.getItem('kiranasathi_preferences_v2');
    if (raw) preferences = JSON.parse(raw);
  } catch {
    // ignore
  }

  const payload: DatabaseBackupPayload = {
    appName: 'KiranaSathi',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    recordCounts: {
      products: products.length,
      sales: sales.length,
      stockMovements: stockMovements.length,
      suppliers: suppliers.length,
    },
    data: {
      products,
      sales,
      stockMovements,
      suppliers,
      preferences,
    },
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `kiranasathi-backup-${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  const totalRecords = products.length + sales.length + stockMovements.length + suppliers.length;
  return { fileName, recordCount: totalRecords };
};

/**
 * Returns current counts across all IndexedDB tables.
 */
export const getDatabaseStats = async (): Promise<{
  productCount: number;
  salesCount: number;
  movementCount: number;
  supplierCount: number;
}> => {
  const [products, sales, movements, suppliers] = await Promise.all([
    db.products.count(),
    db.sales.count(),
    db.stockMovements.count(),
    db.suppliers.count(),
  ]);

  return {
    productCount: products,
    salesCount: sales,
    movementCount: movements,
    supplierCount: suppliers,
  };
};
