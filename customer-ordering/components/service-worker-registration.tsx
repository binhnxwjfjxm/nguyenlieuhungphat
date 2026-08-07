"use client";

import { useEffect } from "react";

const COMBINED_WORKER_PATH = "/OneSignalSDKWorker.js";
const FALLBACK_DELAY_MS = 1800;

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    let active = true;
    let timerId: number | null = null;

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

    const scheduleRegistration = () => {
      if (!active || timerId !== null) return;
      timerId = window.setTimeout(() => { void ensureFallbackRegistration(); }, FALLBACK_DELAY_MS);
    };

    if (document.readyState === "complete") scheduleRegistration();
    else window.addEventListener("load", scheduleRegistration, { once: true });

    return () => {
      active = false;
      window.removeEventListener("load", scheduleRegistration);
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, []);

  return null;
}
