# KiranaSathi Testing Guide

This document details the automated testing setup for KiranaSathi across both frontend and backend packages.

---

## 1. Test Stack

| Package | Test Runner | Assertion / Utility | Target |
| :--- | :--- | :--- | :--- |
| **Frontend** (`apps/frontend`) | Vitest | React Testing Library + Jest DOM | Component rendering, navigation, offline state |
| **Backend** (`apps/backend`) | Vitest | Supertest | REST endpoints, health check status, 404 handler |

---

## 2. Running Tests

### Run All Monorepo Tests
From the root repository directory:
```bash
npm run test
```

### Run Frontend Tests
```bash
# Via workspace script
npm run test:frontend

# Or directly inside the frontend folder
cd apps/frontend
npm test
```

### Run Backend Tests
```bash
# Via workspace script
npm run test:backend

# Or directly inside the backend folder
cd apps/backend
npm test
```

---

## 3. Test Coverage Strategy

### Frontend Tests (`apps/frontend/src/App.test.tsx`)
- **Brand Shell Verification:** Validates that the KiranaSathi brand title, Hindi subtitle (*किराना साथी*), and Phase badge render correctly.
- **Bottom Navigation Check:** Ensures all five touch navigation tabs are accessible (*होम, स्टॉक, बिक्री, ऑर्डर, सहायक*).
- **Isolation:** Uses `vi.mock` to mock external network calls and IndexedDB initialization for fast, deterministic unit test results.

### Backend Tests (`apps/backend/tests/health.test.ts`)
- **Health Check Status:** Sends `GET /api/health` and verifies HTTP status `200` along with JSON payload keys: `status: "ok"`, `service`, `uptimeSeconds`, `timestamp`.
- **404 Routing Safety:** Tests unknown route requests and verifies structured JSON 404 responses.
