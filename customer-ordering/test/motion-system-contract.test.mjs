import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const motionCss = source("../app/motion.css");
const provider = source("../components/mobile-motion-provider.tsx");
const layout = source("../app/layout.tsx");

test("customer ordering defines one restrained mobile motion scale", () => {
  assert.match(motionCss, /--hp-motion-press-duration:\s*100ms/);
  assert.match(motionCss, /--hp-motion-control-duration:\s*140ms/);
  assert.match(motionCss, /--hp-motion-screen-duration:\s*160ms/);
  assert.match(motionCss, /--hp-motion-sheet-duration:\s*220ms/);
  assert.match(motionCss, /--hp-motion-sheet-exit-duration:\s*170ms/);
  assert.match(motionCss, /--hp-motion-cart-flight-duration:\s*280ms/);
  assert.match(motionCss, /--hp-motion-cart-bump-duration:\s*180ms/);
  assert.match(motionCss, /@media \(prefers-reduced-motion: reduce\)/);
});

test("motion controller is mounted globally without changing ordering business flow", () => {
  assert.match(layout, /MobileMotionProvider/);
  assert.match(layout, /import "\.\/motion\.css"/);
  assert.match(provider, /usePathname/);
  assert.match(provider, /requestAnimationFrame\(\(\) => animateScreenEntry\(direction\)\)/);
  assert.match(provider, /PRODUCT_ADD_SELECTOR = "\.catalog-add-icon, \.product-quick-view-add"/);
  assert.doesNotMatch(provider, /bulk-add-summary/);
  assert.match(provider, /CART_UPDATED_EVENT/);
});

test("motion duration parser preserves milliseconds after CSS production minification", () => {
  assert.match(provider, /\.trim\(\)\.toLowerCase\(\)/);
  assert.match(provider, /raw\.endsWith\("ms"\)/);
  assert.match(provider, /raw\.endsWith\("s"\)/);
  assert.match(provider, /return parsed \* 1000/);
});

test("single-product add motion never blocks the add-to-cart click", () => {
  const addBranch = provider.match(/const addControl = target\.closest<HTMLElement>\(PRODUCT_ADD_SELECTOR\);[\s\S]*?\n\s*}\n\n\s*if \(reducedMotionEnabled\(\)\)/)?.[0] ?? "";
  assert.match(addBranch, /animateProductToCart\(addControl\)/);
  assert.doesNotMatch(addBranch, /preventDefault|stopPropagation|setTimeout|await/);
  assert.match(provider, /clone\.animate/);
  assert.match(provider, /deltaX \* 0\.30/);
  assert.match(provider, /deltaY \* 0\.18 - 30/);
});

test("product sheet owns mobile enter and exit motion while keeping reduced-motion immediate", () => {
  assert.match(provider, /SHEET_BACKDROP_SELECTOR = "\.product-quick-view-backdrop"/);
  assert.match(provider, /animateSheetIn/);
  assert.match(provider, /animateSheetOut/);
  assert.match(provider, /SHEET_CLOSE_SELECTOR = "\.product-quick-view-close"/);
  assert.match(provider, /if \(reducedMotionEnabled\(\)\) return/);
});

test("navigation, controls, success and loading feedback use the shared motion foundation", () => {
  assert.match(motionCss, /\.bottom-navigation-item\.is-active \.bottom-navigation-icon/);
  assert.match(motionCss, /\.catalog-filter-menu\[open\] \.catalog-filter-panel/);
  assert.match(motionCss, /\.order-success-screen \.success-icon-shell:not\(:empty\)/);
  assert.match(motionCss, /\.is-skeleton/);
  assert.match(motionCss, /\.hp-cart-flight/);
});
