import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const inventoryPath = new URL("../data/r2-product-image-skus.json", import.meta.url);
const resolverPath = new URL("../lib/product-images.ts", import.meta.url);
const visualPath = new URL("../components/product-visual.tsx", import.meta.url);
const nextConfigPath = new URL("../next.config.ts", import.meta.url);

test("R2 product image inventory is the uploaded 250-file snapshot", async () => {
  const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
  assert.equal(inventory.length, 250);
  assert.equal(new Set(inventory).size, 250);
  for (const sku of ["DHUPMN", "BBACAM", "XXVBIA", "CATIEU", "VTLCAM"]) {
    assert.ok(inventory.includes(sku), `missing uploaded image ${sku}`);
  }
  assert.equal(inventory.includes("TGHANN"), false);
});

test("product image resolver keys images by family SKU, not sale-mode SKU", async () => {
  const source = await readFile(resolverPath, "utf8");
  assert.match(source, /product\.familySku/);
  assert.match(source, /R2_PRODUCT_IMAGE_SKUS\.has\(familySku\)/);
  assert.match(source, /app-customer\/products/);
  assert.doesNotMatch(source, /replace\([^\n]*T/);
});

test("product visual uses Next Image optimization for R2 photos with placeholder fallback", async () => {
  const source = await readFile(visualPath, "utf8");
  assert.match(source, /productImageUrl\(product\)/);
  assert.match(source, /className="catalog-product-image"/);
  assert.match(source, /sizes=\{/);
  assert.doesNotMatch(source, /\bunoptimized\b/);
  assert.match(source, /PackageOpen/);

  const nextConfig = await readFile(nextConfigPath, "utf8");
  assert.match(nextConfig, /pathname: "\/app-customer\/products\/\*\*"/);
});
