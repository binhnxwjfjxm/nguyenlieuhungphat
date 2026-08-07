import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { buildProductSeriesIndex, normalizeSeriesText } from '../lib/product-series.mjs';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('catalog generation applies the one-sheet canonical taxonomy before tests/build', async () => {
  const packageJson = JSON.parse(await read('package.json'));
  assert.match(packageJson.scripts['catalog:generate'], /generate-catalog-sku\.mjs/);
  assert.match(packageJson.scripts['catalog:generate'], /apply-canonical-catalog\.mjs/);

  const partDir = new URL('../data/canonical-product-map/', import.meta.url);
  const partNames = (await readdir(partDir)).filter((name) => /^part-\d+\.json$/.test(name));
  const families = {};
  for (const partName of partNames) Object.assign(families, JSON.parse(await read(`data/canonical-product-map/${partName}`)));
  assert.equal(Object.keys(families).length, 606);
});

test('generated catalog is fully covered by canonical family keys and exact SKU prices', async () => {
  const generated = JSON.parse(await read('lib/adapters/mock/generated-catalog.json'));
  assert.equal(generated.products.length, 1212);
  assert.equal(generated.meta?.canonical?.familyCount, 606);
  assert.equal(generated.meta?.canonical?.productCount, 1212);
  assert.equal(generated.meta?.canonical?.pendingPriceCount, 86);

  const products = generated.products;
  assert.ok(products.every((product) => product.series && product.canonicalProductCardKey));
  assert.equal(products.filter((product) => product.price.status === 'customer_price_pending').length, 86);
  assert.ok(products.filter((product) => product.price.status === 'available').every((product) => product.price.amount > 0));

  const mamaRetail = products.find((product) => product.sku === 'SRMMCR');
  const mamaCase = products.find((product) => product.sku === 'SRMMCRT');
  assert.equal(mamaRetail?.price?.amount, 53000);
  assert.equal(mamaCase?.price?.amount, 636000);
  assert.equal(mamaRetail?.series, 'Siro Mama');
  assert.equal(mamaRetail?.flavor, 'CARAMEN');
  assert.equal(mamaRetail?.canonicalProductCardKey, 'tra-sua:siro:mama');

  const index = buildProductSeriesIndex(products);
  const mamaProducts = products.filter((product) => product.purchaseMode === 'retail' && product.canonicalProductCardKey === 'tra-sua:siro:mama');
  assert.ok(mamaProducts.length >= 10);
  const mamaKeys = new Set(mamaProducts.map((product) => index.groupKeyBySku.get(product.sku)));
  assert.equal(mamaKeys.size, 1);
  const group = index.groupsByKey.get([...mamaKeys][0]);
  assert.equal(normalizeSeriesText(group?.name), 'siro mama');
});
