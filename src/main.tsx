import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ─── MANDATORY APP AND CATALOG CACHE VERSION COMPARISON ───
const APP_VERSION = "2.2.0";
const BUILD_TIME = "2026-06-20T17:54:00Z";
const CATALOG_VERSION = "cat_v2.2.0";
const CACHE_VERSION = "c_2.2.0";
const CATALOG_CACHE_VERSION = "cc_2.2.0";

try {
  const savedVersion = localStorage.getItem("modivah_app_version");
  if (savedVersion !== APP_VERSION) {
    console.log(`[Version Sync] Mismatch: Current=${APP_VERSION}, Saved=${savedVersion || 'none'}. Purging old cache...`);

    // 1. Clear only catalog/layout caches and temporary metrics
    const keysToRemove = [
      "modivah_products_cache",
      "modivah_categories_cache",
      "modivah_perf_access_count",
      "modivah_perf_mount_time",
      "modivah_lead_dismissed",
      "modivah_lead_registered"
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Clear any transient keys with "products", "category" or "catalog" in them
    const keysToClean: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes("products") || key.includes("catalog") || key.includes("categories"))) {
        keysToClean.push(key);
      }
    }
    keysToClean.forEach(key => localStorage.removeItem(key));

    // 2. Clear all sw Cache Storage instances to guarantee direct reload
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      }).catch(err => console.warn("[Version Sync] Error clearing caches:", err));
    }

    // 3. Unregister existing Service Workers to force fresh registrations
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => {
          reg.unregister();
        });
      }).catch(err => console.warn("[Version Sync] Error unregistering service workers:", err));
    }

    // 4. Save new versions to localStorage
    localStorage.setItem("modivah_app_version", APP_VERSION);
    localStorage.setItem("modivah_cache_version", CACHE_VERSION);
    localStorage.setItem("modivah_catalog_cache_version", CATALOG_CACHE_VERSION);

    // 5. Instantly reload page once
    window.location.reload();
  }
} catch (e) {
  console.error("[Version Sync] Failed running cache sync:", e);
}

// Register Service Worker for PWA Support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
