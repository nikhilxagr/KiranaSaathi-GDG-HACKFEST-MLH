# KiranaSathi — 3-Minute Hackathon Demonstration Script

Use this high-impact script to demonstrate **KiranaSathi (किराना साथी)** to hackathon judges, pitch panels, and evaluators.

---

## ⏱️ Pitch Overview (30 Seconds)

> *"India has over 13 million neighborhood kirana stores. They handle 90% of grocery retail, yet traditional enterprise software fails them completely—it requires continuous broadband, bulky desktops, and English-only menus.*
>
> *KiranaSathi is an **offline-first, mobile-first inventory, counter billing, and predictive reorder assistant** designed specifically for the Indian shopkeeper. It runs 100% in the browser using IndexedDB, works without internet, generates dynamic UPI payment QR codes on the spot, sends WhatsApp digital receipts to customers, and predicts wholesale reorders using real sales demand."*

---

## 🛠️ Setup Prerequisites

1. Start both development servers:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:5173](http://localhost:5173) in Google Chrome.
3. Open **Chrome DevTools** (`F12`), toggle the Device Toolbar to **Mobile View (e.g. Pixel 7 / iPhone 14)**.

---

## 🎭 Step-by-Step Live Demo Flow (2.5 Minutes)

### Step 1: Prove Offline-First Resilience (Airplane Mode)
1. In DevTools, open the **Network** tab.
2. Change throttling to **Offline** (or turn on Airplane Mode).
3. Point out:
   - The app does not crash or display a dinosaur error.
   - The status badge shows `IndexedDB Active`.
   - The shopkeeper can navigate all tabs (*होम, स्टॉक, बिक्री, ऑर्डर, सेटिंग्स*) with zero network lag.

---

### Step 2: Rapid Counter Billing & Dynamic UPI QR Code
1. Tap on the **बिक्री (Sales)** tab.
2. Type `atta` or tap on **आशीर्वाद चक्की आटा (5 किग्रा)** and **बासमती चावल (खुला)** to add them to the counter basket.
3. Notice:
   - Real-time stock availability check.
   - Increments of fractional units (`+0.5 kg` or `+1 pkt`).
   - Sticky bottom tray showing total bill (e.g. `₹520.00`).
4. Select the **UPI** payment mode button:
   - **✨ WOW FACTOR**: A live **Dynamic UPI QR Code** appears instantly on screen!
   - It encodes the exact bill amount (`₹520.00`), the shop's name (*Radhe Kirana Store*), and the shopkeeper's UPI VPA.
   - Tell the judges: *"Any customer can scan this with PhonePe, Google Pay, or Paytm directly from the counter phone."*
5. Tap **बिक्री पक्की करें (Confirm Sale)**:
   - Commits atomically to IndexedDB with integer-safe paise math.
   - Decrements stock in real-time.

---

### Step 3: Customer WhatsApp Digital Receipt ("डिजिटल पर्ची")
1. The **Official Receipt Modal** pops up with receipt number `#REC-...`.
2. Enter a 10-digit mobile number in the WhatsApp field (e.g. `98201 12345`).
3. Tap **व्हाट्सएप पर बिल भेजें (Send Bill on WhatsApp)**:
   - Formats a clean itemized receipt with store branding, date, items, rates, and total bill.
   - Opens WhatsApp directly with prefilled message—zero SMS gateway costs for the shopkeeper!
4. Tap **बिल कॉपी करें (Copy Bill)** to show instant offline clipboard copying.
5. Tap **अगली बिक्री शुरू करें (Start Next Sale)**.

---

### Step 4: Smart Reorder Intelligence (Threshold vs Sales-Aware)
1. Tap on the **ऑर्डर (Reorder)** tab.
2. Show the judges the reorder recommendations:
   - **Mode A (Threshold Mode)**: For items with low history, calculates shortfall based on minimum safety stock.
   - **Mode B (Sales-Aware Demand Mode)**: For items with sales history, calculates average daily velocity $\times$ supplier lead time + safety buffer.
   - Notice the transparent reasoning: *"मांग पर आधारित: पिछले 14 दिनों में ~2.14 packet/दिन बिक्री..."*
3. Adjust recommended order quantities using the `+` and `-` steppers.

---

### Step 5: Wholesale Supplier Management & WhatsApp Dispatch
1. Tap on the **सप्लायर (Suppliers)** tab:
   - Show local wholesale distributors (*Kalyan Grocery Wholesale*, *Shree Ganesh Spices*).
2. Filter reorder items by distributor:
   - Select **Kalyan Grocery & Grain Wholesale** from the dropdown.
   - Only items linked to this vendor appear!
3. Tap **ऑर्डर भेजें / साझा करें (Share Order)**:
   - Previews the consolidated wholesale order text.
   - 1-tap **Send on WhatsApp** dispatches the order straight to the distributor's phone.

---

### Step 6: 1-Tap Stock Receipt (Goods Inward)
1. When delivery arrives, tap **स्टॉक प्राप्त करें (Receive Stock)** on any item.
2. Enter the received quantity (e.g. `+15`).
3. Notice the live preview: `Current: 4 + Received: 15 = 19 packet`.
4. Tap **स्टॉक दर्ज करें (Confirm & Save Stock)**:
   - Atomically updates product inventory in IndexedDB.
   - Appends an audit movement log to the ledger.

---

### Step 7: Proof of Local Persistence
1. With Network still set to **Offline**, hit **Refresh (F5)** in the browser.
2. Show that:
   - The app loads instantly via Vite PWA Workbox cache.
   - All newly recorded sales, updated stock quantities, and supplier records remain 100% intact.
3. Switch language between **हिन्दी** and **English** with 1 tap.

---

## 🏆 Key Talking Points for Judges

| Feature | What Makes It Stand Out |
| :--- | :--- |
| **Offline-First** | Complete functionality without backend or cloud. Zero single-point-of-failure. |
| **Paise Math Precision** | Uses `Math.round(rupees * 100)` to eliminate floating-point drift across sales. |
| **Dynamic UPI QR** | 100% offline client-side QR generation formatted to NPCI UPI deep-linking specifications. |
| **Zero-Cost WhatsApp Bills** | Free customer receipts and distributor orders via deep-links (`wa.me`). |
| **Real Bilingual Design** | Native Hindi Devanagari labels designed for real Indian dukandars. |
| **Battle-Tested Reliability** | 72 automated test suites (64 frontend, 8 backend) passing with 100% green status. |
