"use client";

import { useEffect } from "react";

const COMBINED_WORKER_PATH = "/OneSignalSDKWorker.js";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    let active = true;
    const ensureFallbackRegistration = async () => {
      try {
        const existing = await navigator.serviceWorker.getRegistration("/");
        if (!active) return;
        if (existing) {
          await existing.update();
          return;
        }
        await navigator.serviceWorker.register(COMBINED_WORKER_PATH, { scope: "/", updateViaCache: "none" });
      } catch {
        // Online ordering remains usable if service-worker registration is unavailable.
      }
    };

    const timerId = window.setTimeout(() => { void ensureFallbackRegistration(); }, 1800);
    return () => {
      active = false;
      window.clearTimeout(timerId);
    };
  }, []);

  return null;
}
