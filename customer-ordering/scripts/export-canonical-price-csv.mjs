#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generator = resolve(app, 'scripts/generate-catalog-sku.mjs');
const generatedCatalog = resolve(app, 'lib/adapters/mock/generated-catalog.json');
const artifactDir = resolve(app, '.artifacts');
const csvPath = resolve(artifactDir, 'customer-ordering-price-canonical.csv');
const summaryPath = resolve(artifactDir, 'customer-ordering-price-canonical-summary.json');

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const key = (value) => clean(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');
const csvCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

await execFileAsync(process.execPath, [generator], { cwd: app });
const catalog = JSON.parse(await readFile(generatedCatalog, 'utf8'));
const categoryNames = new Map((catalog.categories ?? []).map((category) => [category.id, category.name]));

const headers = [
  'industry_key', 'industry',
  'product_group_key', 'product_group',
  'brand_line_key', 'brand_line',
  'pair_key', 'variant_key',
  'flavor', 'size',
  'pack_type', 'purchase_mode',
  'sku', 'family_sku',
  'price_vnd', 'price_status',
  'unit', 'packaging', 'case_quantity',
  'display_name',
  'taxonomy_status',
  'source_product_type', 'source_brand', 'source_flavor', 'source_size',
];

const rows = (catalog.products ?? []).map((product) => {
  const industryKey = clean(product.categoryId);
  const industry = categoryNames.get(industryKey) ?? industryKey;
  const productGroup = clean(product.productType);
  const sourceBrand = clean(product.brand);
  const brandLine = sourceBrand && sourceBrand !== 'Hưng Phát' ? sourceBrand : '';
  const flavor = clean(product.flavor);
  const size = clean(product.size);
  const productGroupKey = productGroup ? `${industryKey}:${key(productGroup)}` : '';
  const brandLineKey = brandLine ? `${productGroupKey}:${key(brandLine)}` : '';
  const taxonomyStatus = industryKey && productGroup && brandLine ? 'ready' : 'needs_review';
  return {
    industry_key: industryKey,
    industry,
    product_group_key: productGroupKey,
    product_group: productGroup,
    brand_line_key: brandLineKey,
    brand_line: brandLine,
    pair_key: clean(product.familySku),
    variant_key: clean(product.familySku),
    flavor,
    size,
    pack_type: product.purchaseMode === 'case' ? 'Thùng' : 'Lẻ',
    purchase_mode: clean(product.purchaseMode),
    sku: clean(product.sku),
    family_sku: clean(product.familySku),
    price_vnd: product.price?.amount ?? '',
    price_status: clean(product.price?.status),
    unit: clean(product.unit),
    packaging: clean(product.packaging),
    case_quantity: product.caseQuantity ?? '',
    display_name: clean(product.name),
    taxonomy_status: taxonomyStatus,
    source_product_type: productGroup,
    source_brand: sourceBrand,
    source_flavor: flavor,
    source_size: size,
  };
}).sort((left, right) =>
  left.industry.localeCompare(right.industry, 'vi') ||
  left.product_group.localeCompare(right.product_group, 'vi') ||
  left.brand_line.localeCompare(right.brand_line, 'vi') ||
  left.display_name.localeCompare(right.display_name, 'vi') ||
  left.purchase_mode.localeCompare(right.purchase_mode, 'vi') ||
  left.sku.localeCompare(right.sku, 'vi'));

const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(','))].join('\n');
await mkdir(artifactDir, { recursive: true });
await writeFile(csvPath, `\uFEFF${csv}\n`, 'utf8');

const ready = rows.filter((row) => row.taxonomy_status === 'ready').length;
const needsReview = rows.length - ready;
const summary = {
  sourceFiles: catalog.meta?.sourceFiles ?? [],
  skuRows: rows.length,
  retailRows: rows.filter((row) => row.purchase_mode === 'retail').length,
  caseRows: rows.filter((row) => row.purchase_mode === 'case').length,
  taxonomyReadyRows: ready,
  taxonomyNeedsReviewRows: needsReview,
  industries: [...new Set(rows.map((row) => row.industry).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')),
  productGroups: [...new Set(rows.map((row) => `${row.industry} > ${row.product_group}`).filter((value) => !value.endsWith(' > ')))].sort((a, b) => a.localeCompare(b, 'vi')),
  brandLines: [...new Set(rows.map((row) => `${row.industry} > ${row.product_group} > ${row.brand_line}`).filter((value) => !value.endsWith(' > ')))].sort((a, b) => a.localeCompare(b, 'vi')),
  needsReviewSample: rows.filter((row) => row.taxonomy_status === 'needs_review').slice(0, 40).map((row) => ({ sku: row.sku, name: row.display_name, industry: row.industry, productGroup: row.product_group, sourceBrand: row.source_brand })),
};
await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

console.log(`[canonical-price] ${rows.length} SKU rows = ${summary.retailRows} lẻ + ${summary.caseRows} thùng`);
console.log(`[canonical-price] taxonomy ready=${ready}, needs_review=${needsReview}`);
console.log(`[canonical-price] CSV: ${csvPath}`);
console.log(`[canonical-price] summary: ${summaryPath}`);
