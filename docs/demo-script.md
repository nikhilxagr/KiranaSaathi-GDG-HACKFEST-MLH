# KiranaSathi Phase 0 Demonstration Script

Use this script to demonstrate the Phase 0 foundation of KiranaSathi.

---

## Prerequisites
Ensure dependencies are installed and both servers are running:
```bash
npm run dev
```

- **Frontend URL:** [http://localhost:5173](http://localhost:5173)
- **Backend API URL:** [http://localhost:5000](http://localhost:5000)

---

## Demonstration Flow

### Step 1: Open the Frontend App
1. Open [http://localhost:5173](http://localhost:5173) in your browser.
2. Observe the **mobile-friendly responsive shell**:
   - Centered app frame mimicking an Android mobile screen on desktop, full-width on mobile devices.
   - Header shows **KiranaSathi | किराना साथी** with a live green **Online** status indicator.
   - Bottom navigation provides quick touch access to *होम (Home)*, *स्टॉक (Stock)*, *बिक्री (Sale)*, *ऑर्डर (Reorder)*, and *सहायक (AI)*.

### Step 2: Verify Backend Connectivity
1. On the welcome screen, locate the **Backend Health Check** card.
2. Confirm the green status box indicates:
   - `Service: kiranasathi-backend`
   - `Environment: development`
   - `Uptime: X seconds`
3. Click the **Refresh** button with the refresh icon and observe the timestamp updating without page reload.

### Step 3: Verify Direct Backend API Response
1. Open [http://localhost:5000/api/health](http://localhost:5000/api/health) in a browser tab or curl:
   ```bash
   curl http://localhost:5000/api/health
   ```
2. Confirm the clean JSON response:
   ```json
   {
     "status": "ok",
     "service": "kiranasathi-backend",
     "version": "0.1.0",
     "environment": "development",
     "timestamp": "...",
     "uptimeSeconds": 15
   }
   ```

### Step 4: Verify Navigation & Roadmap Previews
1. Click on the **स्टॉक (Stock)** tab in the bottom navigation.
2. Observe the clean Phase 1 roadmap card informing the user that inventory is scheduled for Phase 1.
3. Click **वापस जाएं (Back to Home)** to return safely to the welcome dashboard.

### Step 5: Test Offline Resilience
1. In Chrome DevTools, open the **Network** tab and toggle throttling to **Offline**.
2. Notice the top right badge automatically flips to **ऑफ़लाइन (Offline)** without crashing the app.
3. Dexie IndexedDB remains open and ready to buffer data.
