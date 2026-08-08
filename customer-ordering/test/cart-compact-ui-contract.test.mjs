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

test("compact cart keeps variant, quantity, price, note and remove controls", () => {
  assert.match(screen, /switchVariant\(line\.sku, variant\.sku\)/);
  assert.match(screen, /cart-quantity-stepper/);
  assert.match(screen, /cart-line-price/);
  assert.match(screen, /cart-line-note-compact/);
  assert.match(screen, /persistCurrentCart/);
  assert.match(screen, /cart-remove-button/);
  assert.match(screen, /cart-mode-static/);
});

test("mobile controls stay deliberately compact", () => {
  assert.match(css, /grid-template-columns: minmax\(92px, 112px\) 96px minmax\(70px, 1fr\)/);
  assert.match(css, /\.cart-line-row \.cart-remove-button[\s\S]*width: 30px;[\s\S]*height: 30px;/);
  assert.match(css, /\.cart-line-row \.cart-variant-switch button[\s\S]*min-height: 30px;/);
  assert.match(css, /\.cart-line-note-compact input[\s\S]*min-height: 34px;/);
  assert.match(layout, /import "\.\/cart-compact\.css";/);
});
