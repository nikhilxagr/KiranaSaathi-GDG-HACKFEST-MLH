import React, { useEffect, useState } from 'react';
import { Database, Server, Smartphone, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { checkBackendHealth } from '../services/api';
import { HealthCheckResponse } from '../types';
import { db } from '../db';
import { i18n } from '../i18n';

export const WelcomePage: React.FC = () => {
  const [backendHealth, setBackendHealth] = useState<HealthCheckResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [dbReady, setDbReady] = useState<boolean>(false);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const data = await checkBackendHealth();
      setBackendHealth(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Backend unreachable';
      setHealthError(message);
      setBackendHealth(null);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    // Check Dexie database connection
    db.open()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('Dexie open error:', err);
        setDbReady(false);
      });

    // Check backend health
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Welcome Card */}
      <section className="kirana-card p-6 bg-gradient-to-br from-kirana-50 via-white to-emerald-50/40 border-kirana-200 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <Badge variant="success" dot>
            Phase 0 Foundation Active
          </Badge>
          <span className="text-xs text-slate-500 font-medium">v0.1.0</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
          नमस्ते! <span className="text-kirana-700">KiranaSathi</span> में स्वागत है
        </h1>
        <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
          {i18n.taglineHindi}. Built specifically for Indian kirana shopkeepers with an offline-first architecture.
        </p>

        {/* Quick Highlights Grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 border border-kirana-100">
            <div className="w-10 h-10 rounded-lg bg-kirana-100 text-kirana-700 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Offline Database</p>
              <p className="text-sm font-bold text-slate-800">
                {dbReady ? 'IndexedDB Ready' : 'Initializing...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 border border-kirana-100">
            <div className="w-10 h-10 rounded-lg bg-kirana-100 text-kirana-700 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Layout</p>
              <p className="text-sm font-bold text-slate-800">Mobile-First PWA</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 border border-kirana-100">
            <div className="w-10 h-10 rounded-lg bg-kirana-100 text-kirana-700 flex items-center justify-center shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Express API</p>
              <p className="text-sm font-bold text-slate-800">
                {backendHealth ? 'Connected' : loadingHealth ? 'Checking...' : 'Offline / Standalone'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Backend API Health Verification Card */}
      <section className="kirana-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Backend Health Check</h2>
            <p className="text-xs text-slate-500">Live verification of GET /api/health</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchHealth}
            disabled={loadingHealth}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loadingHealth ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {backendHealth ? (
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Backend server is running healthy on port 5000</span>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded bg-white/80">
                <span className="text-slate-500 block">Service</span>
                <span className="font-semibold text-slate-800">{backendHealth.service}</span>
              </div>
              <div className="p-2 rounded bg-white/80">
                <span className="text-slate-500 block">Environment</span>
                <span className="font-semibold text-slate-800">{backendHealth.environment}</span>
              </div>
              <div className="p-2 rounded bg-white/80">
                <span className="text-slate-500 block">Uptime</span>
                <span className="font-semibold text-slate-800">{backendHealth.uptimeSeconds}s</span>
              </div>
              <div className="p-2 rounded bg-white/80">
                <span className="text-slate-500 block">Timestamp</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {new Date(backendHealth.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ) : healthError ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2 text-amber-800 text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Backend not detected on :5000 yet</p>
                <p className="text-xs text-amber-700 mt-1">
                  Start the backend server with <code className="bg-amber-100 px-1 py-0.5 rounded">npm run dev:backend</code>.
                  Offline client mode remains operational!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-slate-400 text-sm">Checking backend status...</div>
        )}
      </section>

      {/* Project Architecture & Phase Roadmap */}
      <section className="kirana-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-kirana-700" />
          <h2 className="text-lg font-bold text-slate-900">Project Roadmap & Architecture</h2>
        </div>

        <div className="space-y-3">
          <div className="p-3 rounded-xl border border-kirana-300 bg-kirana-50/50 flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-kirana-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              0
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">Phase 0 — Project Foundation (Current)</p>
              <p className="text-xs text-slate-600">
                Monorepo workspaces, Vite + React + TypeScript + Tailwind setup, Dexie IndexedDB offline schema, Express health API, Vitest tests.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3 opacity-80">
            <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
              1
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">Phase 1 — Offline Inventory & Fast Sale</p>
              <p className="text-xs text-slate-500">
                Product catalog, barcode scanner, low stock indicators, offline sales register with Dexie.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3 opacity-80">
            <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
              2
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">Phase 2 — Smart Reordering & Supplier Connect</p>
              <p className="text-xs text-slate-500">
                Predictive reorder recommendations, supplier contact book, one-tap WhatsApp order sharing.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3 opacity-80">
            <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
              3
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">Phase 3 — Conversational Kirana Saathi Assistant</p>
              <p className="text-xs text-slate-500">
                Bilingual voice/text assistant to answer shopkeeper queries about top sellers, reorders, and stock valuation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
