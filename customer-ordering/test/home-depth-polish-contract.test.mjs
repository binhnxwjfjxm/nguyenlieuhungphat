import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("home depth polish stays presentation-only and preserves the approved hierarchy", async () => {
  const [layout, home, css] = await Promise.all([
    read("app/layout.tsx"),
    read("components/home-screen.tsx"),
    read("app/home-depth-polish.css"),
  ]);

  assert.match(layout, /import "\.\/home-depth-polish\.css";/);
  assert.match(home, /className="screen-stack home-depth-stack"/);
  assert.match(home, /className="content-section home-category-section"/);
  assert.match(home, /className="content-section home-product-section"/);
  assert.doesNotMatch(home, /Xin chào|Khách hàng Hưng Phát/);

  assert.match(css, /\.home-depth-stack\s*\{[\s\S]*radial-gradient/);
  assert.match(css, /\.home-depth-stack \.hero-card-r2\s*\{[\s\S]*box-shadow:/);
  assert.match(css, /\.home-depth-stack \.home-category-card\s*\{[\s\S]*0 6px 15px/);
  assert.match(css, /\.home-depth-stack \.home-product-card\s*\{[\s\S]*0 17px 32px/);
  assert.match(css, /\.app-header\s*\{[\s\S]*box-shadow:/);
  assert.match(css, /\.bottom-navigation\s*\{[\s\S]*box-shadow:/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
