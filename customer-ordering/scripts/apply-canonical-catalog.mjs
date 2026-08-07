#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = resolve(app, 'lib/adapters/mock/generated-catalog.json');
const mapDir = resolve(app, 'data/canonical-product-map');
const EXPECTED_FAMILIES = 606;
const EXPECTED_PRODUCTS = 1212;

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const norm = (value) => clean(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/gi, 'd')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

function seriesName(productGroup, brandLine) {
  const group = clean(productGroup);
  const brand = clean(brandLine);
  if (!group) return brand || 'Sản phẩm';
  if (!brand) return group;
  const groupKey = norm(group);
  const brandKey = norm(brand);
  if (brandKey === groupKey || brandKey.startsWith(`${groupKey} `)) return brand;
  if (groupKey.startsWith(`${brandKey} `)) return group;
  return `${group} ${brand}`;
}

const partNames = (await readdir(mapDir)).filter((name) => /^part-\d+\.json$/.test(name)).sort();
if (!partNames.length) throw new Error('Thiếu canonical product map');
const familyMap = {};
for (const partName of partNames) {
  const part = JSON.parse(await readFile(resolve(mapDir, partName), 'utf8'));
  for (const [familySku, row] of Object.entries(part)) {
    if (familyMap[familySku]) throw new Error(`Canonical family trùng: ${familySku}`);
    familyMap[familySku] = row;
  }
}

const familyEntries = Object.entries(familyMap);
if (familyEntries.length !== EXPECTED_FAMILIES) {
  throw new Error(`Canonical map phải có ${EXPECTED_FAMILIES} family, thực tế ${familyEntries.length}`);
}

const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
if (!Array.isArray(catalog.products) || catalog.products.length !== EXPECTED_PRODUCTS) {
  throw new Error(`Catalog phải có ${EXPECTED_PRODUCTS} SKU trước overlay`);
}

const categories = new Map();
const missingFamilies = new Set();
let pendingPriceCount = 0;
for (const product of catalog.products) {
  const familySku = clean(product.familySku) || clean(product.sku);
  const row = familyMap[familySku];
  if (!row) {
    missingFamilies.add(familySku);
    continue;
  }
  const [industryKey, industry, productGroup, productCardKey, brandLine, variant, flavor, size, retailPrice, casePrice] = row;
  const amountRaw = product.purchaseMode === 'case' ? casePrice : retailPrice;
  const amount = Number.isFinite(Number(amountRaw)) && Number(amountRaw) > 0 ? Number(amountRaw) : null;
  if (amount === null) pendingPriceCount += 1;
  const canonicalFlavor = clean(flavor) || clean(variant) || null;
  const canonicalSeries = seriesName(productGroup, brandLine);

  product.categoryId = clean(industryKey);
  product.productType = clean(productGroup);
  product.brand = clean(brandLine);
  product.flavor = canonicalFlavor;
  product.size = clean(size);
  product.series = canonicalSeries;
  product.canonicalProductCardKey = clean(productCardKey);
  product.canonicalVariant = clean(variant) || clean(flavor);
  product.description = [productGroup, brandLine, variant || flavor, size].map(clean).filter(Boolean).join(' · ');
  product.price = {
    amount,
    currency: 'VND',
    status: amount === null ? 'customer_price_pending' : 'available',
  };
  categories.set(clean(industryKey), clean(industry));
}

if (missingFamilies.size) {
  throw new Error(`Canonical map thiếu family: ${[...missingFamilies].sort().join(', ')}`);
}

const usedFamilies = new Set(catalog.products.map((product) => clean(product.familySku) || clean(product.sku)));
const unusedFamilies = familyEntries.map(([familySku]) => familySku).filter((familySku) => !usedFamilies.has(familySku));
if (unusedFamilies.length) throw new Error(`Canonical map có family không tồn tại: ${unusedFamilies.join(', ')}`);

catalog.categories = [...categories.entries()]
  .map(([id, name]) => ({ id, name, shortName: name }))
  .sort((left, right) => left.name.localeCompare(right.name, 'vi'));
catalog.products.sort((left, right) =>
  left.categoryId.localeCompare(right.categoryId, 'vi')
  || left.productType.localeCompare(right.productType, 'vi')
  || left.series.localeCompare(right.series, 'vi')
  || left.name.localeCompare(right.name, 'vi')
  || (left.purchaseMode === right.purchaseMode ? left.sku.localeCompare(right.sku, 'vi') : left.purchaseMode === 'retail' ? -1 : 1));
catalog.meta = {
  ...(catalog.meta ?? {}),
  canonical: {
    schemaVersion: 1,
    familyCount: EXPECTED_FAMILIES,
    productCount: EXPECTED_PRODUCTS,
    pendingPriceCount,
    source: 'BANG_GIA_CANONICAL_CUSTOMER_ORDERING.xlsx / CATALOG_CANONICAL',
  },
};

await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
console.log(`[catalog] canonical overlay ${EXPECTED_FAMILIES} family / ${EXPECTED_PRODUCTS} SKU; pending price=${pendingPriceCount}`);
