# KiranaSathi — Phase 6: Smart Reorder Intelligence & Supplier Management

## 1. Executive Summary

In **Phase 6**, KiranaSathi introduces a deterministic, offline-first **Smart Reorder Intelligence Engine** paired with a lightweight **Wholesale Supplier Management** system. Small Indian kirana shopkeepers can now:
1. Identify exactly which products need restocking using real sales demand and safety thresholds.
2. Understand the exact reason behind every reorder quantity (distinguishing simple minimum-stock shortfalls from sales-demand estimates).
3. Associate products with local wholesale distributors and track delivery lead times.
4. Prepare clean, professional wholesale order lists grouped by supplier.
5. Share orders via WhatsApp or offline clipboard with one tap.
6. Record received wholesale stock with atomic IndexedDB transactions and restock ledger entries.

All calculations and operations run 100% locally on the device via Dexie IndexedDB. No internet connection, cloud server, or AI model is required.

---

## 2. Reorder Calculation Engine

The reorder service (`apps/frontend/src/services/reorderService.ts`) operates deterministically without division-by-zero risks or guesswork:

### Mode 1: Basic Threshold Mode (Fallback)
Used when a product has insufficient sales history (< 2 sale events in the window) or zero recorded sales.
$$\text{Reorder Quantity} = \max(0, \text{Minimum Stock Level} - \text{Current Stock})$$
- **Label / Tag**: `Threshold Mode (न्यूनतम सीमा नियम)`
- **Explanation**: "Threshold suggestion: current stock (X unit) is below minimum (Y unit). No recorded sales in the last 14 days. Using minimum safety threshold."

### Mode 2: Sales-Aware Demand Mode
Used when a product has $\ge 2$ recorded sales transactions within the documented historical window (default: 14 days):
$$\text{Average Daily Demand} = \frac{\text{Total Quantity Sold in Historical Window}}{\text{Window Days (14)}}$$
$$\text{Target Stock} = \text{Average Daily Demand} \times (\text{Lead Time Days} + \text{Safety Days})$$
$$\text{Shortfall} = \max(0, \max(\text{Target Stock} - \text{Current Stock}, \text{Minimum Stock} - \text{Current Stock}))$$
$$\text{Recommended Quantity} = \text{RoundByUnit}(\text{Shortfall})$$

- **Lead Time Days**: Taken from the assigned supplier (default: 2 days if unassigned).
- **Safety Days**: 1-day safety buffer.
- **Physical Unit Rounding**:
  - Discrete units (`packet`, `piece`): Rounded up to the nearest whole integer via `Math.ceil()` so shopkeepers never order fractional packets.
  - Continuous units (`kg`, `litre`): Rounded to 2 decimal places (e.g. `6.75 kg`).
  - Grams (`gm`): Rounded to nearest whole integer.
- **Label / Tag**: `Sales-Aware (मांग-आधारित गणना)`
- **Explanation**: "Sales-aware: based on ~X unit/day demand across 14d with Yd lead + Zd safety stock."

---

## 3. Wholesale Supplier Management

### Data Model
```typescript
export interface Supplier {
  id: string;             // Stable ID (e.g. 'sup_1730000000_abc12')
  name: string;           // Distributor or supplier name
  phone?: string;         // Contact / WhatsApp phone number
  notes?: string;         // Delivery notes, terms, categories
  leadTimeDays?: number;  // Expected delivery lead time in days
  createdAt: string;      // ISO 8601 string
  updatedAt: string;      // ISO 8601 string
}
```

### IndexedDB Schema Version 3 Migration
In `apps/frontend/src/db/index.ts`, Dexie was safely upgraded to **Version 3**:
```typescript
this.version(3)
  .stores({
    products: '++id, name, category, quantity, minimumStock, supplierId, createdAt, updatedAt',
    sales: '++id, receiptNumber, createdAt, totalAmount, paymentMethod',
    stockMovements: '++id, productId, type, createdAt, saleId',
    suppliers: 'id, name, createdAt',
  })
  .upgrade((_tx) => {
    // Non-destructive upgrade: preserves all existing products, sales, and movements.
    // The suppliers table and product supplierId index are initialized.
  });
```

### Starter Suppliers
On initial launch, if the supplier directory is empty, three realistic distributors are seeded:
1. **Kalyan Grocery & Grain Wholesale** (+91 98201 12345, Lead time: 2 days)
2. **Shree Ganesh Oil & Spices Depot** (+91 98112 34567, Lead time: 3 days)
3. **Amul & Dairy Products Agency** (+91 98330 54321, Lead time: 1 day)

---

## 4. Distributor Order List & Sharing Workflow

Shopkeepers can select products using multi-select checkboxes and tap **"Share / Send Order"**:
- **Confidentiality**: Omits cost prices, profits, and internal notes.
- **Formatting**:
  ```text
  📦 Radhe Kirana Store — सामान का नया ऑर्डर (Wholesale Order)
  Supplier: Kalyan Grocery & Grain Wholesale
  📅 26 Oct 2026
  --------------------
  1. *Aashirvaad Shudh Chakki Atta (5kg)* : *+6 packet* [Current: 4 packet]
  2. *Toor Dal Desi (Loose)* : *+6 kg* [Current: 6 kg]
  --------------------
  🙏 Ramesh Gupta (Radhe Kirana Store)
  📱 KiranaSathi Offline Order
  ```
- **Sharing Methods**:
  - **WhatsApp Share**: Direct link `https://wa.me/<phone>?text=<encodedText>` opening WhatsApp Web or App with prefilled message.
  - **Copy Order**: Copies directly to clipboard with visual confirmation (works 100% offline).
  - **Web Share**: Uses native OS share sheet if supported (`navigator.share`).

---

## 5. Stock Receipt (Purchase) Workflow

When wholesale goods arrive at the shop:
1. Shopkeeper clicks **"Receive Stock"** (`स्टॉक प्राप्त करें`) on any item.
2. Modal displays product name, current stock, and unit.
3. User enters actual received quantity (e.g. `+15 packet`) and an optional invoice note (`#INV-2041`).
4. Real-time preview displays resulting stock: `Current: 4 + Received: 15 = 19 packet`.
5. Atomic Transaction:
   - Validates quantity $> 0$.
   - Executes `database.transaction('rw', [database.products, database.stockMovements])`.
   - Increments product quantity.
   - Creates a `restock` entry in `stockMovements` with quantity delta and timestamp.
   - Refreshes UI reactively.

---

## 6. Verification and Test Results

### Automated Test Suite (`apps/frontend/src/test/phase6-reorder.test.ts`)
13 dedicated tests verify all phase requirements:
1. `calculates basic threshold reorder shortfall when sales history is absent` — PASSED
2. `calculates demand-based target stock and reorder quantity in sales-aware mode` — PASSED
3. `falls back cleanly to threshold mode when a product has zero sales history` — PASSED
4. `accurately computes and rounds fractional quantities for kg and litre` — PASSED
5. `gracefully handles zero, negative, or missing lead times without dividing by zero` — PASSED
6. `falls back to threshold mode when transactions in window are fewer than min threshold` — PASSED
7. `adds a supplier and assigns it to a product in IndexedDB` — PASSED
8. `filters reorder recommendations by assigned supplier` — PASSED
9. `generates clean distributor order text and encodes WhatsApp URL safely` — PASSED
10. `atomically records stock receipt and creates a restock movement log` — PASSED
11. `rejects invalid stock receipt and preserves original inventory atomically` — PASSED
12. `preserves existing atomic sale workflows and updates stock correctly` — PASSED
13. `preserves all products, sales, and stock movements when upgrading to Version 3` — PASSED

### Full Test Suite Summary
- **Backend**: `1 passed (1)`, 8 tests passed.
- **Frontend**: `6 passed (6)`, 57 tests passed across all suites:
  - `verification.test.ts` (7 tests)
  - `phase2.test.ts` (12 tests)
  - `phase5-offline.test.ts` (10 tests)
  - `phase6-reorder.test.ts` (13 tests)
  - `phase3.test.ts` (8 tests)
  - `App.test.tsx` (7 tests)
- **Total Monorepo Tests**: 65 passed, 0 failed.

### Production Build & PWA Precache
- Frontend production bundle built with Vite code splitting:
  - `dist/assets/ReorderPage-*.js`: 33.38 kB (gzip: 8.24 kB)
  - `dist/assets/InventoryPage-*.js`: 26.68 kB (gzip: 7.15 kB)
  - `dist/assets/SalesPage-*.js`: 18.94 kB (gzip: 5.23 kB)
  - `dist/assets/SettingsPage-*.js`: 9.59 kB (gzip: 3.14 kB)
  - `dist/assets/index-*.js`: 340.83 kB (gzip: 108.59 kB)
- PWA Workbox precaches all 15 assets (459.16 KiB) enabling complete offline operation.

---

## 7. Verification Commands

Run the following commands from the project root:
```bash
# 1. Typecheck
npm run typecheck:frontend
npm run typecheck:backend

# 2. Run Test Suites
npx vitest run src/test/phase6-reorder.test.ts --dir apps/frontend
npm run test:backend ; npm run test:frontend

# 3. Production Build
npm run build
```
