import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ─── MANDATORY APP AND CATALOG VERSION REPRESENTATION ───
const BUNDLE_APP_VERSION = "2.3.0";
const BUNDLE_BUILD_TIME = "2026-06-20T19:00:00Z";
const BUNDLE_CACHE_VERSION = "c_2.3.0";
const BUNDLE_CATALOG_VERSION = "cat_v2.3.0";

/**
 * Creates and appends a elegant, discrete update overlay to the document body.
 */
function appendUpdateOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "modivah-update-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(255, 255, 255, 0.98)";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "999999";
  overlay.style.fontFamily = "'Inter', system-ui, sans-serif";
  overlay.style.color = "#111111";
  overlay.style.padding = "20px";
  overlay.style.textAlign = "center";

  overlay.innerHTML = `
    <div style="
      width: 44px;
      height: 44px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #111111;
      border-radius: 50%;
      animation: modivah-spin 1s linear infinite;
      margin-bottom: 24px;
    "></div>
    <h2 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.02em; color: #111;">
      Modivah Brechó
    </h2>
    <p style="font-size: 0.875rem; color: #666; margin: 0; font-weight: 500;">
      Atualizando a loja para mostrar as novidades...
    </p>
    <style>
      @keyframes modivah-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  document.body.appendChild(overlay);
}

/**
 * Validates, purges cache selectively, and updates device storage to match latest server build.
 */
async function syncAndCheckUpdates(): Promise<boolean> {
  try {
    // Force cache-busting fetching of the dynamic server version truth
    const response = await fetch(`/api/public/version?t=${Date.now()}`);
    if (!response.ok) {
      console.warn("[Sync] Server version response not OK. Carrying on.");
      return false;
    }

    const serverData = await response.json();
    const serverApp = serverData.APP_VERSION;
    const serverBuild = serverData.BUILD_TIME;
    const serverCache = serverData.CACHE_VERSION;
    const serverCatalog = serverData.CATALOG_VERSION;

    const storedApp = localStorage.getItem("modivah_app_version");
    const storedBuild = localStorage.getItem("modivah_build_time");
    const storedCache = localStorage.getItem("modivah_cache_version");
    const storedCatalog = localStorage.getItem("modivah_catalog_version");

    // Identify if there is a mismatch at any level of the compiled assets or local storage
    const hasMismatch = 
      serverApp !== BUNDLE_APP_VERSION || 
      serverApp !== storedApp ||
      serverBuild !== storedBuild ||
      serverCache !== storedCache ||
      serverCatalog !== storedCatalog;

    if (hasMismatch) {
      console.log(`[Sync] Version mismatch detected. Server: ${serverApp}, Local: ${BUNDLE_APP_VERSION}, Stored: ${storedApp}. Purging outdated caches...`);
      
      // 1. Render modern discrete updater message
      appendUpdateOverlay();

      // 2. Selectively delete layout/catalog local caches without altering admin credentials
      const keysToCleanDirectly = [
        "modivah_products_cache",
        "modivah_categories_cache",
        "modivah_perf_access_count",
        "modivah_perf_mount_time",
        "modivah_lead_dismissed",
        "modivah_lead_registered"
      ];
      keysToCleanDirectly.forEach(k => localStorage.removeItem(k));

      // Clean storage keys matches
      const localKeysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes("products") || 
          key.includes("catalog") || 
          key.includes("categories") || 
          key.includes("vitrine") ||
          key.includes("cache")
        )) {
          localKeysToRemove.push(key);
        }
      }
      localKeysToRemove.forEach(k => {
        if (k !== "modivah_admin_token") {
          localStorage.removeItem(k);
        }
      });

      // Session storage cleanup
      try {
        const sessionKeysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (
            key.includes("products") || 
            key.includes("catalog") || 
            key.includes("categories") || 
            key.includes("vitrine") ||
            key.includes("cache")
          )) {
            sessionKeysToRemove.push(key);
          }
        }
        sessionKeysToRemove.forEach(k => {
          if (k !== "modivah_admin_token") {
            sessionStorage.removeItem(k);
          }
        });
      } catch (sessErr) {
        console.warn("[Sync] Session storage purge errored:", sessErr);
      }

      // 3. Purge all storage instances in global standard caches
      if ('caches' in window) {
        try {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map(k => caches.delete(k)));
          console.log("[Sync] Successfully cleared Web CacheStorage instances.");
        } catch (cErr) {
          console.warn("[Sync] Failed to clear Web CacheStorage:", cErr);
        }
      }

      // 4. Unregister oldest service workers to lock correct downloads
      if ('serviceWorker' in navigator) {
        try {
          const swRegistrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(swRegistrations.map(reg => reg.unregister()));
          console.log("[Sync] Service Worker registrations unregistered successfully.");
        } catch (swErr) {
          console.warn("[Sync] Unregistering Service Workers failed:", swErr);
        }
      }

      // 5. Store current correct versions
      localStorage.setItem("modivah_app_version", serverApp || BUNDLE_APP_VERSION);
      localStorage.setItem("modivah_build_time", serverBuild || BUNDLE_BUILD_TIME);
      localStorage.setItem("modivah_cache_version", serverCache || BUNDLE_CACHE_VERSION);
      localStorage.setItem("modivah_catalog_version", serverCatalog || BUNDLE_CATALOG_VERSION);

      // Delay briefly (1.5s) to guarantee updates visual pacing and proper deletion sequences before reload
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Reload with version string to prevent proxy middle caches
      window.location.href = window.location.origin + window.location.pathname + `?v=${Date.now()}`;
      return true;
    }
  } catch (err) {
    console.error("[Sync] Error during version validation check:", err);
  }
  return false;
}

// ─── BOOTSTRAP RESILIENT INITIALIZER ───
(async () => {
  // Use a timeout safety fallback race (1.2 seconds max) to support offline and ultra slow mobile networks seamlessly
  const timeoutPromise = new Promise<string>(resolve => setTimeout(() => resolve("timeout"), 1200));
  const updateCheckPromise = syncAndCheckUpdates();

  try {
    const checkResult = await Promise.race([updateCheckPromise, timeoutPromise]);
    if (checkResult === true) {
      // Reload is underway, do not proceed with rendering
      return;
    }
  } catch (e) {
    console.warn("[Bootstrap] Race verification timed out or erred, proceeding normal loading.", e);
  }

  // Register modern Service Worker gracefully for offline vitrine rendering support
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Always register sw.js with a cache buster query parameter to force check fresh files
      navigator.serviceWorker.register(`/sw.js?v=${BUNDLE_APP_VERSION}`)
        .then((registration) => {
          console.log('[PWA] Service Worker active scope:', registration.scope);
          // If update is available, check it out
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[PWA] New content is available; please refresh.');
                  } else {
                    console.log('[PWA] Content is cached for offline use.');
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    });
  }

  // Start Rendering
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
})();
