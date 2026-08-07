"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      return;
    }

    let active = true;
    const register = () => {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((registration) => {
          if (!active) return;
          return registration.update();
        })
        .catch(() => {
          // PWA remains usable online even when service-worker registration or update fails.
        });
    };

    if (document.readyState === "complete") {
      register();
      return () => {
        active = false;
      };
    }

    window.addEventListener("load", register, { once: true });
    return () => {
      active = false;
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
