import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [screen, css, layout] = await Promise.all([
  readFile("components/cart-screen.tsx", "utf8"),
  readFile("app/cart-compact.css", "utf8"),
  readFile("app/layout.tsx", "utf8"),
]);

test("cart items use compact list rows instead of one card per SKU", () => {
  assert.match(screen, /cart-screen cart-screen-compact/);
  assert.match(screen, /className="cart-line-row"/);
  assert.match(screen, /className="cart-line-actions"/);
  assert.doesNotMatch(screen, /className="cart-line-card"/);
  assert.match(css, /\.cart-line-row\s*\{/);
  assert.match(css, /border-bottom:/);
  assert.match(css, /\.cart-screen-compact \.cart-line-list/);
});

test("compact cart keeps the selected SKU purchase mode static", () => {
  assert.match(screen, /className="cart-mode-static"/);
  assert.match(screen, /purchaseModeLabel\(product\)/);
  assert.doesNotMatch(screen, /switchVariant/);
  assert.doesNotMatch(screen, /familyMap/);
  assert.doesNotMatch(screen, /targetSku/);
  assert.doesNotMatch(screen, /cart-variant-switch/);
  assert.match(screen, /cart\.lines\.map\(\(item\) => item\.sku === line\.sku/);
  assert.match(screen, /cart\.lines\.filter\(\(item\) => item\.sku !== line\.sku\)/);
  assert.match(screen, /cart-quantity-stepper/);
  assert.match(screen, /cart-line-price/);
  assert.match(screen, /cart-line-note-compact/);
  assert.match(screen, /persistCurrentCart/);
  assert.match(screen, /cart-remove-button/);
});

test("mobile controls stay deliberately compact", () => {
  assert.match(css, /grid-template-columns: minmax\(92px, 112px\) 96px minmax\(70px, 1fr\)/);
  assert.match(css, /\.cart-line-row \.cart-remove-button[\s\S]*width: 30px;[\s\S]*height: 30px;/);
  assert.match(css, /\.cart-mode-static[\s\S]*min-height: 30px;/);
  assert.match(css, /\.cart-line-note-compact input[\s\S]*min-height: 34px;/);
  assert.match(layout, /import "\.\/cart-compact\.css";/);
});
