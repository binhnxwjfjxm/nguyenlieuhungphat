import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("orders tabs slide horizontally according to tab direction", async () => {
  const [screen, motionCss] = await Promise.all([
    read("components/orders-screen.tsx"),
    read("app/motion.css"),
  ]);
  assert.match(screen, /type OrdersViewTransition = "forward" \| "back"/);
  assert.match(screen, /setViewTransition\(nextView === "purchased" \? "forward" : "back"\)/);
  assert.match(screen, /className=\{\["orders-view-panel", viewTransition \? `is-slide-\$\{viewTransition\}` : ""\]/);
  assert.match(screen, /key=\{view\}/);
  assert.match(motionCss, /\.orders-view-panel\.is-slide-forward/);
  assert.match(motionCss, /\.orders-view-panel\.is-slide-back/);
  assert.match(motionCss, /@keyframes hp-orders-slide-forward[\s\S]*translate3d\(32px, 0, 0\)/);
  assert.match(motionCss, /@keyframes hp-orders-slide-back[\s\S]*translate3d\(-32px, 0, 0\)/);
});

test("order list and detail routes infer forward and back slide direction", async () => {
  const provider = await read("components/mobile-motion-provider.tsx");
  assert.match(provider, /resolveScreenEntryDirection/);
  assert.match(provider, /previousPathname === "\/orders" && pathname\.startsWith\("\/orders\/"\)/);
  assert.match(provider, /previousPathname\?\.startsWith\("\/orders\/"\) && pathname === "\/orders"/);
  assert.match(provider, /translate3d\(32px, 0, 0\)/);
  assert.match(provider, /translate3d\(-32px, 0, 0\)/);
  assert.match(provider, /--hp-motion-page-slide-duration/);
});

test("horizontal ordering motion remains disabled for reduced-motion users", async () => {
  const motionCss = await read("app/motion.css");
  assert.match(motionCss, /--hp-motion-page-slide-duration:\s*210ms/);
  assert.match(motionCss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.orders-view-panel\.is-slide-forward,[\s\S]*\.orders-view-panel\.is-slide-back,[\s\S]*animation: none !important/);
});
