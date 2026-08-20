"use client";

import { useEffect } from "react";

const COMBINED_WORKER_PATH = "/OneSignalSDKWorker.js";
const ROOT_SCOPE_PATH = "/";
const STALE_WORKER_PATHS = new Set([
  "/sw.js",
  "/push/onesignal/OneSignalSDKWorker.js",
]);
const FALLBACK_DELAY_MS = 3200;
const IDLE_TIMEOUT_MS = 6000;
const WORKER_UPDATE_INTERVAL_MS = 24 * 60 * 60 * 1000;
const WORKER_UPDATE_STORAGE_KEY = "hp-customer-ordering-worker-update-at-v1";

type IdleCapableWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

function registrationScriptPath(registration: ServiceWorkerRegistration): string | null {
  const scriptUrl = registration.active?.scriptURL
    ?? registration.waiting?.scriptURL
    ?? registration.installing?.scriptURL;
  if (!scriptUrl) return null;
  try {
    return new URL(scriptUrl).pathname;
  } catch {
    return null;
  }
}

function registrationScopePath(registration: ServiceWorkerRegistration): string | null {
  try {
    return new URL(registration.scope).pathname;
  } catch {
    return null;
  }
}

function workerUpdateCheckDue(): boolean {
  try {
    const lastCheck = Number(window.localStorage.getItem(WORKER_UPDATE_STORAGE_KEY) ?? "0");
    return !Number.isFinite(lastCheck) || Date.now() - lastCheck >= WORKER_UPDATE_INTERVAL_MS;
  } catch {
    return false;
  }
}

function markWorkerUpdateCheck(): void {
  try {
    window.localStorage.setItem(WORKER_UPDATE_STORAGE_KEY, String(Date.now()));
  } catch {
    // Local storage can be unavailable in restricted browser modes.
  }
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    let active = true;
    let timerId: number | null = null;
    let idleId: number | null = null;
    const idleWindow = window as IdleCapableWindow;

    const ensureCanonicalRegistration = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (!active) return;

        await Promise.all(
          registrations
            .filter((registration) => STALE_WORKER_PATHS.has(registrationScriptPath(registration) ?? ""))
            .map((registration) => registration.unregister()),
        );
        if (!active) return;

        const canonical = registrations.find(
          (registration) =>
            registrationScriptPath(registration) === COMBINED_WORKER_PATH
            && registrationScopePath(registration) === ROOT_SCOPE_PATH,
        );

        if (!canonical) {
          await navigator.serviceWorker.register(COMBINED_WORKER_PATH, { scope: "/", updateViaCache: "none" });
          return;
        }

        if (workerUpdateCheckDue()) {
          markWorkerUpdateCheck();
          await canonical.update();
        }
      } catch {
        // Ordering remains usable if service-worker maintenance is unavailable.
      }
    };

    const runMaintenance = () => {
      if (!active) return;
      void ensureCanonicalRegistration();
    };

    const scheduleMaintenance = () => {
      if (!active || timerId !== null || idleId !== null) return;
      if (idleWindow.requestIdleCallback) {
        idleId = idleWindow.requestIdleCallback(runMaintenance, { timeout: IDLE_TIMEOUT_MS });
        return;
      }
      timerId = window.setTimeout(runMaintenance, FALLBACK_DELAY_MS);
    };

    if (document.readyState === "complete") scheduleMaintenance();
    else window.addEventListener("load", scheduleMaintenance, { once: true });

    return () => {
      active = false;
      window.removeEventListener("load", scheduleMaintenance);
      if (timerId !== null) window.clearTimeout(timerId);
      if (idleId !== null) idleWindow.cancelIdleCallback?.(idleId);
    };
  }, []);

  return null;
}
