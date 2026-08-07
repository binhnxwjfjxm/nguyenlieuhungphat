import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("home industry cards use the six public R2 images with full-card cover and bottom labels", async () => {
  const [home, css, layout] = await Promise.all([
    read("components/home-screen.tsx"),
    read("app/home-category-icons.css"),
    read("app/layout.tsx"),
  ]);

  for (const file of [
    "icon-tra-sua.webp",
    "icon-mi-cay.webp",
    "icon-dong-lanh.webp",
    "icon-an-vat.webp",
    "icon-bao-bi.webp",
    "icon-gia-vi.webp",
  ]) assert.match(home, new RegExp(file.replace(".", "\\.")));

  assert.match(home, /home-category-image/);
  assert.match(home, /home-category-label/);
  assert.match(home, /fill sizes="82px"/);
  assert.match(css, /\.home-category-image[\s\S]*object-fit:\s*cover/);
  assert.match(css, /\.home-category-card[\s\S]*justify-content:\s*flex-end/);
  assert.match(css, /\.home-category-card \.home-category-label[\s\S]*text-align:\s*center/);
  assert.match(layout, /product-grouping\.css";\nimport "\.\/home-category-icons\.css";/);
});
