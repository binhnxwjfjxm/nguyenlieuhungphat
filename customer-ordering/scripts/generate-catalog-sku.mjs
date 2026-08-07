#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repo = resolve(app, '..');
const out = resolve(app, 'lib/adapters/mock/generated-catalog.json');
const sources = [
  'BANG_GIA_CHUAN_HOA_CAP_NHAT_DS_SP_23.07.26.xlsx',
  'BANG_GIA_KENH_QUAN_THEM_NHOM_CHI_TIET.xlsx',
];
const MASTER_SHEET = 'xl/worksheets/sheet2.xml';
const EXPECTED_MASTER_ROWS = 606;

const categoryMeta = {
  'milk-tea': ['Trà sữa', 'sugar'],
  'spicy-noodle': ['Mỳ cay', 'wheat'],
  frozen: ['Đông lạnh', 'starch'],
  snacks: ['Ăn vặt', 'sugar'],
  packaging: ['Bao bì', 'additive'],
  'sauce-seasoning': ['Gia vị & sốt', 'additive'],
  other: ['Khác', 'additive'],
};

const aliases = {
  retailSku: ['sku le', 'sku don vi', 'ma sku cua san pham don vi', 'ma sku san pham don vi'],
  caseSku: ['sku quy doi', 'sku thung', 'ma sku cua san pham quy doi', 'ma sku san pham quy doi'],
  sku: ['sku', 'ma sku', 'ma hang', 'ma hang hoa', 'ma hh', 'ma vat tu', 'ma vt', 'ma mat hang', 'ma sp', 'ma san pham', 'item code', 'product code', 'code'],
  retailName: ['ten san pham chuan', 'ten sp chuan hoa', 'ten chuan hoa'],
  caseName: ['ten san pham quy doi', 'ten sp quy doi'],
  name: ['ten san pham', 'ten sp', 'ten hang', 'ten hang hoa', 'ten hh', 'ten vat tu', 'ten vt', 'ten mat hang', 'item name', 'product name', 'dien giai', 'mo ta san pham', 'san pham'],
  category: ['nhom chinh', 'nhom chuan', 'nganh hang', 'nganh', 'nhom san pham', 'nhom sp', 'phan nhom', 'nhom hang', 'nhom'],
  productType: ['nhom chi tiet', 'nhom cap 2', 'loai san pham', 'loai sp', 'chung loai', 'phan loai', 'loai'],
  brand: ['thuong hieu', 'nhan hieu', 'hang sx', 'hang san xuat', 'brand'],
  flavor: ['huong vi', 'mui vi', 'flavor', 'vi'],
  size: ['kich thuoc', 'khoi luong', 'trong luong', 'dung tich', 'quy cach size', 'size'],
  retailPackaging: ['quy cach le'],
  packaging: ['quy cach dong goi', 'quy cach', 'dong goi', 'packaging'],
  casePackaging: ['quy cach quy doi', 'quy cach thung', 'dong goi thung', 'quy cach si'],
  retailUnit: ['dvt le'],
  caseUnit: ['dvt quy doi', 'don vi quy doi'],
  unit: ['don vi tinh', 'dvt chuan', 'dvt khoi luong', 'dvt', 'unit', 'don vi'],
  caseQuantity: ['sl quy doi', 'so luong quy doi', 'sl thung', 'so luong thung', 'quy doi thung', 'sl/thung', 'cay thung'],
};

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const norm = (value) => clean(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();
const sku = (value) => clean(value).toUpperCase().replace(/\s+/g, '');
const xmlDecode = (value) => value
  .replaceAll('&amp;', '&')
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"')
  .replaceAll('&apos;', "'")
  .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
  .replace(/&#x([0-9a-f]+);/gi, (_, number) => String.fromCodePoint(Number.parseInt(number, 16)));
const money = (value) => {
  const digits = clean(value).replace(/[^0-9-]/g, '');
  if (!digits) return null;
  const amount = Number.parseInt(digits, 10);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};
const positive = (value) => {
  const match = clean(value).match(/\d+/);
  const number = match ? Number.parseInt(match[0], 10) : 0;
  return number > 0 ? number : null;
};

function unzip(buffer) {
  let eocd = -1;
  for (let index = buffer.length - 22; index >= Math.max(0, buffer.length - 65557); index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) { eocd = index; break; }
  }
  if (eocd < 0) throw new Error('XLSX thiếu EOCD');
  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let index = 0; index < count; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('Central directory XLSX lỗi');
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
    if (buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new Error(`Local header lỗi: ${name}`);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const raw = buffer.subarray(start, start + compressedSize);
    if (method === 0) entries.set(name, raw);
    else if (method === 8) entries.set(name, inflateRawSync(raw));
    else throw new Error(`Compression ${method} chưa hỗ trợ`);
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function parseSharedStrings(xml = '') {
  const values = [];
  for (const match of xml.matchAll(/<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/g)) {
    values.push([...match[1].matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g)].map((item) => xmlDecode(item[1])).join(''));
  }
  return values;
}

function columnIndex(reference) {
  let value = 0;
  for (const char of reference.replace(/\d+/g, '').toUpperCase()) value = value * 26 + char.charCodeAt(0) - 64;
  return value - 1;
}

function parseRows(xml, sharedStrings) {
  const result = [];
  for (const rowMatch of xml.matchAll(/<(?:\w+:)?row\b[^>]*>([\s\S]*?)<\/(?:\w+:)?row>/g)) {
    const row = [];
    for (const cellMatch of rowMatch[1].matchAll(/<(?:\w+:)?c\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?c>/g)) {
      const reference = cellMatch[1].match(/\br=["']([A-Z]+\d+)["']/)?.[1];
      if (!reference) continue;
      const type = cellMatch[1].match(/\bt=["']([^"']+)["']/)?.[1] ?? '';
      let value = '';
      if (type === 'inlineStr') {
        value = [...cellMatch[2].matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g)].map((item) => xmlDecode(item[1])).join('');
      } else {
        const raw = cellMatch[2].match(/<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/)?.[1] ?? '';
        value = type === 's' ? (sharedStrings[Number.parseInt(raw, 10)] ?? '') : xmlDecode(raw);
      }
      row[columnIndex(reference)] = clean(value);
    }
    result.push(row);
  }
  return result;
}

function detectField(header) {
  const normalized = norm(header);
  if (!normalized) return null;
  let best = null;
  for (const [field, list] of Object.entries(aliases)) {
    for (const aliasValue of list) {
      const candidate = norm(aliasValue);
      const matches = normalized === candidate || (candidate.length >= 4 && (normalized.startsWith(`${candidate} `) || normalized.endsWith(` ${candidate}`) || normalized.includes(` ${candidate} `)));
      if (matches && (!best || candidate.length > best.length)) best = { field, length: candidate.length };
    }
  }
  if (best) return best.field;
  if (/\bsku\b|\b(item|product) code\b/.test(normalized)) return 'sku';
  if (/\bma\b/.test(normalized) && /(hang|hang hoa|vat tu|san pham|mat hang|sp|hh|vt)/.test(normalized)) return 'sku';
  if (/\bten\b/.test(normalized) && /(hang|hang hoa|vat tu|san pham|mat hang|sp|hh|vt)/.test(normalized)) return 'name';
  if (/(dien giai|mo ta)/.test(normalized) && !/(ghi chu|note)/.test(normalized)) return 'name';
  return null;
}

function detectPriceField(header) {
  const normalized = norm(header);
  if (!normalized.includes('gia') || /(gia von|gia nhap|gia mua|cost)/.test(normalized)) return null;
  if (/(thung|case|si)/.test(normalized)) return 'casePrice';
  if (/(gia le|ban le|kenh quan|gia ban|don gia)/.test(normalized)) return 'retailPrice';
  return 'genericPrice';
}

function mapHeaders(headers) {
  const columns = {};
  let score = 0;
  headers.forEach((header, index) => {
    const field = detectField(header);
    if (field && columns[field] === undefined) { columns[field] = index; score += field === 'sku' || field === 'name' ? 5 : 1; }
    const priceField = detectPriceField(header);
    if (priceField && columns[priceField] === undefined) { columns[priceField] = index; score += 1; }
  });
  return { columns, score };
}

function mergedHeader(rows, start, span) {
  const width = Math.max(...rows.slice(start, start + span).map((row) => row.length), 0);
  return Array.from({ length: width }, (_, index) => clean(rows.slice(start, start + span).map((row) => row[index] ?? '').filter(Boolean).join(' ')));
}

function validSku(value) {
  const text = clean(value);
  const normalized = norm(text).replaceAll(' ', '');
  return Boolean(text)
    && text.length <= 48
    && !/\s/.test(text)
    && /^[\p{L}0-9._/+\-]+$/u.test(text)
    && !/^(stt|sku|ma|mahang|masanpham|tong|total)$/i.test(normalized);
}
function inferSku(value) { return validSku(value) && /[\p{L}]/u.test(value); }
function nameLike(value) {
  const text = clean(value);
  const normalized = norm(text);
  return text.length >= 3 && text.length <= 220 && !/^[-+]?\d[\d.,% -]*$/.test(text) && /[a-z]/.test(normalized) && normalized.replace(/[^a-z]/g, '').length >= 3;
}

function headerEvidence(rows, dataStart, columns) {
  const skuColumns = [columns.retailSku, columns.caseSku, columns.sku].filter((value) => value !== undefined);
  const nameColumns = [columns.retailName, columns.caseName, columns.name].filter((value) => value !== undefined);
  let hits = 0;
  for (let index = dataStart; index < Math.min(rows.length, dataStart + 100); index += 1) {
    if (skuColumns.some((column) => validSku(rows[index][column] ?? '')) && nameColumns.some((column) => nameLike(rows[index][column] ?? ''))) hits += 1;
  }
  return hits;
}

function inferHeader(rows) {
  const limit = Math.min(rows.length, 1500);
  const width = Math.min(Math.max(...rows.slice(0, limit).map((row) => row.length), 0), 80);
  let best = null;
  for (let skuColumn = 0; skuColumn < width; skuColumn += 1) {
    for (let nameColumn = 0; nameColumn < width; nameColumn += 1) {
      if (skuColumn === nameColumn) continue;
      let matched = 0; let first = -1; let caseCount = 0;
      const values = new Set();
      for (let index = 0; index < limit; index += 1) {
        const rawSku = clean(rows[index][skuColumn] ?? '');
        const rawName = clean(rows[index][nameColumn] ?? '');
        if (!inferSku(rawSku) || !nameLike(rawName)) continue;
        const currentSku = sku(rawSku);
        if (first < 0) first = index;
        matched += 1; values.add(currentSku); if (currentSku.endsWith('T')) caseCount += 1;
      }
      if (matched < 5) continue;
      let pairs = 0;
      for (const value of values) if (value.endsWith('T') && values.has(value.slice(0, -1))) pairs += 1;
      const score = matched * 12 + pairs * 20 + caseCount * 2 + (values.size / matched) * 20 + Math.max(0, 4 - Math.abs(nameColumn - skuColumn));
      if (!best || score > best.score) best = { skuColumn, nameColumn, first, matched, score };
    }
  }
  if (!best) return null;
  const headerStart = Math.max(0, best.first - 8);
  const headers = Array.from({ length: width }, (_, index) => clean(rows.slice(headerStart, best.first).map((row) => row[index] ?? '').filter(Boolean).join(' ')));
  const mapped = mapHeaders(headers);
  mapped.columns.sku = best.skuColumn;
  mapped.columns.name = best.nameColumn;
  return { dataStart: best.first, columns: mapped.columns, mode: 'inferred', score: best.score, matched: best.matched };
}

function findHeader(rows) {
  let best = null;
  const limit = Math.min(rows.length, 40);
  for (let start = 0; start < limit; start += 1) {
    for (const span of [1, 2, 3]) {
      if (start + span > limit) continue;
      const mapped = mapHeaders(mergedHeader(rows, start, span));
      const hasSku = [mapped.columns.retailSku, mapped.columns.caseSku, mapped.columns.sku].some((value) => value !== undefined);
      const hasName = [mapped.columns.retailName, mapped.columns.caseName, mapped.columns.name].some((value) => value !== undefined);
      if (!hasSku || !hasName) continue;
      const hits = headerEvidence(rows, start + span, mapped.columns);
      if (hits < 5) continue;
      const candidate = { dataStart: start + span, columns: mapped.columns, mode: span === 1 ? 'header' : 'multi-row-header', score: mapped.score + hits + (span === 1 ? 2 : 0) };
      if (!best || candidate.score > best.score) best = candidate;
    }
  }
  return best ?? inferHeader(rows);
}

function sample(rows) {
  return rows.map((row, index) => ({ row: index, values: row.filter(Boolean).slice(0, 10) })).filter((item) => item.values.length).slice(0, 6);
}

function categoryFor(record) {
  const text = norm([record.category, record.productType, record.name, record.brand].filter(Boolean).join(' '));
  if (/(bao bi|ly nhua|ly giay|nap ly|ong hut|tui |hop |muong|dia |khay)/.test(text)) return 'packaging';
  if (/(my cay|mi cay|ramen|my han|mi han)/.test(text)) return 'spicy-noodle';
  if (/(dong lanh|vien |pho mai que|khoai tay|xuc xich|ca vien|bo vien|tom vien|ga vien)/.test(text)) return 'frozen';
  if (/(an vat|snack|banh trang|rong bien|kho bo|hat |keo )/.test(text)) return 'snacks';
  if (/(gia vi|sot |tuong|sa te|nuoc cham|dau hao)/.test(text)) return 'sauce-seasoning';
  if (/(tra sua|pha che|topping|tran chau|thach|siro|syrup|tra |bot beo|bot kem|pudding|duong den|mut |puree)/.test(text)) return 'milk-tea';
  return 'other';
}

function recordsFromRow(row, columns, source, sheet) {
  const get = (field) => columns[field] === undefined ? '' : clean(row[columns[field]] ?? '');
  const common = {
    category: get('category'), productType: get('productType'), brand: get('brand'), flavor: get('flavor'), size: get('size'),
    packaging: get('retailPackaging') || get('packaging'), casePackaging: get('casePackaging'), unit: get('retailUnit') || get('unit'),
    caseUnit: get('caseUnit'), caseQuantity: positive(get('caseQuantity')), retailPrice: money(get('retailPrice')), casePrice: money(get('casePrice')),
    genericPrice: money(get('genericPrice')), source, sheet,
  };
  const retailRaw = get('retailSku'); const caseRaw = get('caseSku'); const genericRaw = get('sku');
  const retailName = get('retailName') || get('name'); const caseName = get('caseName') || retailName;
  const result = [];
  if (validSku(retailRaw) && retailName) result.push({ ...common, sku: sku(retailRaw), name: retailName, purchaseMode: 'retail' });
  if (validSku(caseRaw) && caseName && sku(caseRaw).endsWith('T')) result.push({ ...common, sku: sku(caseRaw), name: caseName, purchaseMode: 'case', retailPrice: null, genericPrice: null, unit: get('caseUnit') || get('unit') || 'thùng' });
  if (!retailRaw && !caseRaw && validSku(genericRaw)) {
    const value = sku(genericRaw); const name = get('name') || get('retailName') || get('caseName');
    if (name) {
      const mode = value.endsWith('T') ? 'case' : 'retail';
      result.push({ ...common, sku: value, name, purchaseMode: mode, retailPrice: mode === 'case' ? null : common.retailPrice, genericPrice: mode === 'case' ? null : common.genericPrice });
    }
  }
  return result;
}

function enrichRecord(base, incoming) {
  if (!base || base.sku !== incoming.sku) return base;
  const next = { ...base };
  for (const [key, value] of Object.entries(incoming)) {
    if (['sku', 'purchaseMode', 'name', 'source', 'sheet'].includes(key)) continue;
    if (value === '' || value === null || value === undefined) continue;
    if (key === 'retailPrice' && base.purchaseMode !== 'retail') continue;
    if (key === 'casePrice' && base.purchaseMode !== 'case') continue;
    next[key] = value;
  }
  return next;
}

function toProduct(record) {
  const currentSku = sku(record.sku);
  const purchaseMode = record.purchaseMode === 'case' ? 'case' : 'retail';
  const familySku = purchaseMode === 'case' ? currentSku.slice(0, -1) : currentSku;
  const categoryId = categoryFor(record);
  const amount = purchaseMode === 'case' ? record.casePrice : (record.retailPrice ?? record.genericPrice);
  return {
    sku: currentSku,
    familySku,
    categoryId,
    name: clean(record.name),
    aliases: [],
    brand: clean(record.brand) || 'Hưng Phát',
    productType: clean(record.productType) || clean(record.category) || 'Sản phẩm',
    flavor: clean(record.flavor) || null,
    size: clean(record.size) || clean(record.packaging) || '',
    purchaseMode,
    caseQuantity: purchaseMode === 'case' ? (record.caseQuantity ?? null) : null,
    packaging: purchaseMode === 'case' && record.casePackaging ? record.casePackaging : (record.packaging || (purchaseMode === 'case' ? 'Thùng' : record.unit || 'Đơn vị')),
    unit: clean(record.unit) || (purchaseMode === 'case' ? 'thùng' : 'đơn vị'),
    description: [record.brand, record.productType, record.flavor, record.size].map(clean).filter(Boolean).join(' · '),
    availability: 'available',
    price: { amount, currency: 'VND', status: amount === null ? 'customer_price_pending' : 'available' },
    visualTone: categoryMeta[categoryId][1],
  };
}

async function readWorkbook(path) {
  const entries = unzip(await readFile(path));
  const sharedStrings = parseSharedStrings(entries.get('xl/sharedStrings.xml')?.toString('utf8') ?? '');
  const sheetNames = [...entries.keys()].filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name)).sort();
  const all = []; const bySheet = new Map(); const diagnostics = [];
  for (const sheet of sheetNames) {
    const parsedRows = parseRows(entries.get(sheet).toString('utf8'), sharedStrings);
    const header = findHeader(parsedRows);
    const sheetRecords = [];
    if (!header) {
      diagnostics.push({ sheet, rows: parsedRows.length, mapped: 0, mode: 'unmapped', sample: sample(parsedRows) });
      bySheet.set(sheet, sheetRecords);
      continue;
    }
    for (let index = header.dataStart; index < parsedRows.length; index += 1) sheetRecords.push(...recordsFromRow(parsedRows[index], header.columns, path.split('/').pop(), sheet));
    all.push(...sheetRecords); bySheet.set(sheet, sheetRecords);
    diagnostics.push({ sheet, rows: parsedRows.length, mapped: sheetRecords.length, mode: header.mode, fields: Object.keys(header.columns), sample: sample(parsedRows) });
  }
  return { all, bySheet, diagnostics };
}

async function main() {
  const missing = sources.filter((name) => !existsSync(resolve(repo, name)));
  if (missing.length) throw new Error(`Thiếu bảng giá: ${missing.join(', ')}`);

  const primary = await readWorkbook(resolve(repo, sources[0]));
  const secondary = await readWorkbook(resolve(repo, sources[1]));
  const masterRecords = primary.bySheet.get(MASTER_SHEET) ?? [];
  const retailMaster = masterRecords.filter((record) => record.purchaseMode === 'retail');
  const caseMaster = masterRecords.filter((record) => record.purchaseMode === 'case');
  if (retailMaster.length !== EXPECTED_MASTER_ROWS || caseMaster.length !== EXPECTED_MASTER_ROWS) {
    throw new Error(`MASTER phải có ${EXPECTED_MASTER_ROWS} SKU lẻ + ${EXPECTED_MASTER_ROWS} SKU thùng; thực tế ${retailMaster.length} + ${caseMaster.length}`);
  }
  if (caseMaster.some((record) => !record.sku.endsWith('T'))) throw new Error('MASTER có SKU thùng không kết thúc bằng T');

  const catalog = new Map(masterRecords.map((record) => [record.sku, { ...record }]));
  for (const incoming of [...primary.all, ...secondary.all]) {
    if (!catalog.has(incoming.sku)) continue;
    catalog.set(incoming.sku, enrichRecord(catalog.get(incoming.sku), incoming));
  }

  for (const [currentSku, record] of catalog) {
    if (record.purchaseMode !== 'case') continue;
    const retail = catalog.get(currentSku.slice(0, -1));
    if (!retail) continue;
    for (const key of ['category', 'productType', 'brand', 'flavor', 'size']) {
      if (!record[key] && retail[key]) record[key] = retail[key];
    }
    if (!record.packaging && retail.casePackaging) record.packaging = retail.casePackaging;
  }

  const products = [...catalog.values()].map(toProduct).sort((left, right) => left.name.localeCompare(right.name, 'vi') || left.sku.localeCompare(right.sku));
  const expectedProducts = EXPECTED_MASTER_ROWS * 2;
  if (products.length !== expectedProducts) throw new Error(`Catalog canonical phải có ${expectedProducts} SKU, thực tế ${products.length}`);
  if (new Set(products.map((product) => product.sku)).size !== products.length) throw new Error('SKU trùng sau khi map');
  const retailProducts = products.filter((product) => product.purchaseMode === 'retail').length;
  const caseProducts = products.filter((product) => product.purchaseMode === 'case').length;
  if (retailProducts !== EXPECTED_MASTER_ROWS || caseProducts !== EXPECTED_MASTER_ROWS) throw new Error(`Sai phân bổ lẻ/thùng: ${retailProducts}/${caseProducts}`);

  const usedCategories = new Set(products.map((product) => product.categoryId));
  const categories = Object.entries(categoryMeta).filter(([id]) => usedCategories.has(id)).map(([id, [name]]) => ({ id, name, shortName: name }));
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, `${JSON.stringify({ categories, products, meta: { sourceFiles: sources, masterRows: EXPECTED_MASTER_ROWS, productCount: products.length } }, null, 2)}\n`);
  console.log(`[catalog] canonical ${products.length} SKU = ${retailProducts} lẻ + ${caseProducts} thùng from MASTER ${EXPECTED_MASTER_ROWS} rows`);
  console.log(`[catalog] enrich only existing MASTER SKU from secondary sheets`);
  console.log(`[catalog] ${sources[0]}: ${JSON.stringify(primary.diagnostics)}`);
  console.log(`[catalog] ${sources[1]}: ${JSON.stringify(secondary.diagnostics)}`);
}

main().catch((error) => {
  console.error(`[catalog] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
