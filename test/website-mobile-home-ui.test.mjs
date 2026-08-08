import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile("app/page.tsx", "utf8");
const theme = await readFile("app/hung-phat-warm-gold.css", "utf8");

test("homepage mobile refinements stay scoped to the homepage", () => {
  assert.match(page, /<main className="home-page">/);
  assert.match(theme, /\.home-page \.section \{/);
  assert.match(theme, /\.home-page \.hero-stack \{\s*display: none;/);
});

test("mobile category cards use a horizontal snap strip", () => {
  assert.match(theme, /\.home-page \.category-layout \{[\s\S]*display: flex;[\s\S]*overflow-x: auto;[\s\S]*scroll-snap-type: x mandatory;/);
  assert.match(theme, /\.home-page \.category-stack \{\s*display: contents;/);
});

test("mobile navigation inherits the warm header tone and normalized CTAs", () => {
  assert.match(theme, /\.mobile-menu \{[\s\S]*rgba\(90, 59, 32, 0\.99\)/);
  assert.match(theme, /\.mobile-menu \.mobile-quote \{[\s\S]*min-height: 42px;[\s\S]*border-radius: 12px;/);
  assert.match(theme, /\.mobile-menu \.button-surface \{/);
  assert.match(theme, /\.mobile-menu \.button-primary \{/);
});
