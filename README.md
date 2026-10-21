# KiranaSathi (किराना साथी)

> **Offline-first, mobile-first inventory and reorder assistant for small Indian kirana shops.**

KiranaSathi is designed to simplify daily stock management, billing, and reordering for neighborhood Indian grocery stores (*kirana stores*). It works seamlessly even when the internet drops, storing all critical data locally in the browser and syncing when connected.

---

## 📌 Project Features (Phase 0 Foundation)

- **Mobile-First & PWA-Ready:** Optimized for smartphone screens with large touch targets (minimum 48px) and responsive layout.
- **Offline-First Storage:** Dexie.js (IndexedDB) database initialized locally on the client.
- **Bilingual Interface:** English with Hindi Devanagari labels for intuitive counter use.
- **Full-Stack Monorepo:** Structured npm workspaces separating `apps/frontend` and `apps/backend`.
- **Health Check API:** Express + TypeScript backend endpoint with JSON error handling and Zod validation.
- **Automated Testing:** Vitest test suites for both frontend components and backend REST endpoints.

---

## 📋 Prerequisites

Before running the project, make sure you have the following installed on your machine:

1. **Node.js**: Version `18.0.0` or higher (Tested on `v22.23.2`)
   - Check version: `node -v`
2. **npm**: Version `9.0.0` or higher (Tested on `11.7.0`)
   - Check version: `npm -v`

---

## 🚀 Quick Start & Installation

### 1. Clone & Install Dependencies
Open your terminal in the project root directory and run:

```bash
npm install
```
*This installs dependencies for both frontend and backend automatically using npm workspaces.*

---

### 2. Environment Variables Setup
Copy the `.env.example` files to create active `.env` files:

#### Backend:
```bash
# On Windows PowerShell:
Copy-Item apps/backend/.env.example apps/backend/.env

# On macOS/Linux:
cp apps/backend/.env.example apps/backend/.env
```

#### Frontend (Optional for local dev, defaults to `/api`):
```bash
# On Windows PowerShell:
Copy-Item apps/frontend/.env.example apps/frontend/.env

# On macOS/Linux:
cp apps/frontend/.env.example apps/frontend/.env
```

---

### 3. Running the Development Servers

You can start both applications together or independently:

#### Option A: Run Both Together (Recommended)
```bash
npm run dev
```
*This uses `concurrently` to launch the backend on port 5000 and the frontend on port 5173.*

#### Option B: Run Individually
- **Run Backend only:**
  ```bash
  npm run dev:backend
  ```
- **Run Frontend only:**
  ```bash
  npm run dev:frontend
  ```

---

## 🌐 Local Application URLs

| Application | URL | Description |
| :--- | :--- | :--- |
| **Frontend PWA** | [http://localhost:5173](http://localhost:5173) | Main KiranaSathi mobile-friendly interface |
| **Backend API** | [http://localhost:5000](http://localhost:5000) | Root API service information |
| **Backend Health** | [http://localhost:5000/api/health](http://localhost:5000/api/health) | Health check endpoint |

---

## 🧪 Testing & Verification

Run all test suites across the monorepo:
```bash
npm run test
```

Or run tests individually:
```bash
npm run test:frontend   # Runs Vitest on React components
npm run test:backend    # Runs Vitest + Supertest on Express endpoints
```

Typecheck code across workspaces:
```bash
npm run typecheck
```

Build production bundles:
```bash
npm run build
```

---

## 📂 Folder Structure

```text
kiranaSathi/
├── apps/
│   ├── frontend/                 # React 18 + Vite + TypeScript + Tailwind
│   │   ├── public/
│   │   │   └── icons/            # App icons and PWA assets
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/           # Buttons, Badges, Modals
│   │   │   │   ├── layout/       # Navbar, BottomNav, AppLayout
│   │   │   │   └── products/     # Product-specific components
│   │   │   ├── pages/            # WelcomePage, NotFoundPage
│   │   │   ├── features/
│   │   │   │   ├── inventory/    # Stock management module
│   │   │   │   ├── sales/        # Quick sale & billing module
│   │   │   │   ├── reorder/      # Supplier reordering module
│   │   │   │   └── assistant/    # AI assistant module
│   │   │   ├── db/               # Dexie.js IndexedDB schema
│   │   │   ├── hooks/            # useNetworkStatus & helper hooks
│   │   │   ├── i18n/             # Bilingual English/Hindi dictionary
│   │   │   ├── services/         # API fetch clients
│   │   │   ├── types/            # TypeScript interfaces
│   │   │   ├── App.tsx           # React router routes
│   │   │   └── main.tsx          # Client entrypoint
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.ts
│   └── backend/                  # Node.js + Express + TypeScript
│       ├── src/
│       │   ├── routes/           # API routes (health check, etc.)
│       │   ├── controllers/      # Route controllers
│       │   ├── services/         # Business logic services
│       │   ├── middleware/       # Error handling & 404 middlewares
│       │   ├── utils/            # Zod environment validation
│       │   ├── app.ts            # Express application setup
│       │   └── server.ts         # Server listen entrypoint
│       ├── tests/                # Supertest endpoint tests
│       ├── package.json
│       └── .env.example
├── docs/
│   ├── architecture.md           # System architecture & data flow
│   ├── testing.md                # Testing setup and execution guide
│   └── demo-script.md            # Step-by-step presentation script
├── package.json                  # Root monorepo workspace configuration
├── tsconfig.base.json            # Base TypeScript configuration
├── .gitignore                    # Git exclusions
├── .env.example                  # Root environment template
└── README.md                     # Project documentation
```

---

## 🗺️ Project Roadmap

- **Phase 0:** Project Foundation, Monorepo, Offline DB Shell, Express Health API (Current)
- **Phase 1:** Offline Inventory Catalog, Barcode Scanner, Fast Billing Counter
- **Phase 2:** Low Stock Alerts, Predictive Reorder List, WhatsApp Supplier Export
- **Phase 3:** Conversational AI Kirana Assistant for stock queries and insights
