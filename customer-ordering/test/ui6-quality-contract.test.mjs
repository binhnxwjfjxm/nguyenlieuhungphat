import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("UI-6 applies real translucent glass chrome without changing the single-scroll shell", async () => {
  const [layout, css, shell] = await Promise.all([
    read("app/layout.tsx"),
    read("app/ui6.css"),
    read("components/app-shell.tsx"),
  ]);

  assert.match(layout, /import "\.\/ui6\.css"/);
  assert.match(css, /--glass-header:\s*rgba\(255, 255, 255, \.76\)/);
  assert.match(css, /--glass-navigation:\s*rgba\(255, 255, 255, \.74\)/);
  assert.match(css, /backdrop-filter:\s*saturate\(1\.45\) blur\(18px\)/);
  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(shell, /<main className="app-content">/);
  assert.doesNotMatch(css, /\.app-header\s*\{[^}]*position:\s*fixed/s);
  assert.doesNotMatch(css, /\.bottom-navigation\s*\{[^}]*position:\s*fixed/s);
});

test("UI-6 hardens safe mobile interaction, focus and reduced-motion behavior", async () => {
  const css = await read("app/ui6.css");

  assert.match(css, /select:focus-visible/);
  assert.match(css, /textarea:focus-visible/);
  assert.match(css, /touch-action:\s*manipulation/);
  assert.match(css, /min-height:\s*48px/);
  assert.match(css, /100dvh/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /overflow-x:\s*hidden/);
});

test("home hero uses the public R2 image through Next Image", async () => {
  const [home, config, css] = await Promise.all([
    read("components/home-screen.tsx"),
    read("next.config.ts"),
    read("app/ui6.css"),
  ]);

  assert.match(home, /import Image from "next\/image"/);
  assert.match(home, /hero-app-customer\.jpg/);
  assert.match(home, /pub-7d2987fab97d4e3ebb2021a823973862\.r2\.dev/);
  assert.match(home, /className="hero-r2-image"/);
  assert.match(home, /\bfill\b/);
  assert.match(config, /hostname:\s*"pub-7d2987fab97d4e3ebb2021a823973862\.r2\.dev"/);
  assert.match(config, /pathname:\s*"\/app-customer\/image-system\/\*\*"/);
  assert.match(css, /\.hero-card-r2/);
  assert.match(css, /object-fit:\s*cover/);
});

test("PWA install is user-triggered and the combined root worker registers before or after window load", async () => {
  const [installCard, accountPage, registration, worker, manifest] = await Promise.all([
    read("components/pwa-install-card.tsx"),
    read("app/account/page.tsx"),
    read("components/service-worker-registration.tsx"),
    read("public/OneSignalSDKWorker.js"),
    read("app/manifest.ts"),
  ]);

  assert.match(accountPage, /<PwaInstallCard \/>/);
  assert.match(installCard, /beforeinstallprompt/);
  assert.match(installCard, /appinstalled/);
  assert.match(installCard, /async function handleInstall\(\)/);
  assert.match(installCard, /await installPrompt\.prompt\(\)/);
  assert.match(registration, /document\.readyState === "complete"/);
  assert.match(registration, /window\.addEventListener\("load", scheduleRegistration/);
  assert.match(registration, /COMBINED_WORKER_PATH = "\/OneSignalSDKWorker\.js"/);
  assert.match(registration, /register\(COMBINED_WORKER_PATH, \{ scope: "\/", updateViaCache: "none" \}\)/);
  assert.match(worker, /OneSignalSDK\.sw\.js/);
  assert.match(worker, /SAFE_ASSETS/);
  assert.match(worker, /caches\.match\("\/offline"\)/);
  assert.match(manifest, /display:\s*"standalone"/);
});

test("UI-6 regression gate keeps auth, order flow and OneSignal/deep-link surfaces present", async () => {
  const [login, orders, orderDetail, news, announcementDetail, oneSignal] = await Promise.all([
    read("components/login-card.tsx"),
    read("components/orders-screen.tsx"),
    read("components/order-detail.tsx"),
    read("components/notification-center.tsx"),
    read("components/announcement-detail.tsx"),
    read("lib/push/onesignal-browser.ts"),
  ]);

  assert.match(login, /mountSignIn/);
  assert.match(login, /mountSignUp/);
  assert.match(orders, /listOrders/);
  assert.match(orderDetail, /reorderOrder/);
  assert.match(orderDetail, /cancelOrder/);
  assert.match(news, /listAnnouncements/);
  assert.match(announcementDetail, /targetHref/);
  assert.match(oneSignal, /ONESIGNAL_WORKER_SCOPE/);
  assert.match(oneSignal, /serviceWorkerParam/);
});
