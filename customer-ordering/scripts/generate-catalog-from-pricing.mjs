#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(HERE, '..');
const REPO_ROOT = resolve(APP_ROOT, '..');
const OUTPUT = resolve(APP_ROOT, 'lib/adapters/mock/generated-catalog.json');

const SOURCE_FILES = [
  'BANG_GIA_CHUAN_HOA_CAP_NHAT_DS_SP_23.07.26.xlsx',
  'BANG_GIA_KENH_QUAN_THEM_NHOM_CHI_TIET.xlsx',
];

const CATEGORY_META = {
  'milk-tea': { name: 'Trà sữa', shortName: 'Trà sữa', tone: 'sugar' },
  'spicy-noodle': { name: 'Mỳ cay', shortName: 'Mỳ cay', tone: 'wheat' },
  frozen: { name: 'Đông lạnh', shortName: 'Đông lạnh', tone: 'starch' },
  snacks: { name: 'Ăn vặt', shortName: 'Ăn vặt', tone: 'sugar' },
  packaging: { name: 'Bao bì', shortName: 'Bao bì', tone: 'additive' },
  'sauce-seasoning': { name: 'Gia vị & sốt', shortName: 'Gia vị & sốt', tone: 'additive' },
  other: { name: 'Khác', shortName: 'Khác', tone: 'additive' },
};

const HEADER_ALIASES = {
  sku: ['sku', 'ma sku', 'ma hang', 'ma sp', 'ma san pham', 'ma'],
  name: ['ten san pham', 'ten sp', 'ten hang', 'san pham', 'ten'],
  category: ['nhom chinh', 'nganh hang', 'nganh', 'nhom san pham', 'nhom sp', 'phan nhom', 'nhom'],
  productType: ['nhom chi tiet', 'loai san pham', 'loai sp', 'chung loai', 'loai'],
  brand: ['thuong hieu', 'nhan hieu', 'brand'],
  flavor: ['huong vi', 'mui vi', 'flavor', 'vi'],
  size: ['kich thuoc', 'khoi luong', 'dung tich', 'size'],
  packaging: ['quy cach dong goi', 'quy cach', 'dong goi', 'packaging'],
  casePackaging: ['quy cach thung', 'dong goi thung'],
  unit: ['don vi tinh', 'dvt', 'unit', 'don vi'],
  caseQuantity: ['sl thung', 'so luong thung', 'quy doi thung'],
};

function decodeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function cleanSku(value) {
  return clean(value).toUpperCase().replace(/\s+/g, '');
}

function parseMoney(value) {
  const text = clean(value);
  if (!text) return null;
  const digits = text.replace(/[^0-9-]/g, '');
  if (!digits) return null;
  const amount = Number.parseInt(digits, 10);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function parsePositiveInt(value) {
  const match = clean(value).match(/\d+/);
  if (!match) return null;
  const number = Number.parseInt(match[0], 10);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function findEocd(buffer) {
  for (let offset = Math.max(0, buffer.length - 65557); offset <= buffer.length - 22; offset += 1) {
    const candidate = buffer.length - 22 - (offset - Math.max(0, buffer.length - 65557));
    if (candidate >= 0 && buffer.readUInt32LE(candidate) === 0x06054b50) return candidate;
  }
  throw new Error('Không đọc được ZIP/XLSX: thiếu EOCD.');
}

function unzipEntries(buffer) {
  const eocd = findEocd(buffer);
  const entriesCount = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();

  for (let index = 0; index < entriesCount; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('Central directory XLSX không hợp lệ.');
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString('utf8');

    if (buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new Error(`Local header XLSX không hợp lệ: ${name}`);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    let data;
    if (method === 0) data = compressed;
    else if (method === 8) data = inflateRawSync(compressed);
    else throw new Error(`XLSX dùng compression chưa hỗ trợ (${method}): ${name}`);
    entries.set(name, data);
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  return entries;
}

function parseSharedStrings(xml = '') {
  const values = [];
  for (const match of xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) {
    const parts = [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((item) => decodeXml(item[1]));
    values.push(parts.join(''));
  }
  return values;
}

function columnIndex(ref) {
  const letters = ref.replace(/\d+/g, '').toUpperCase();
  let value = 0;
  for (const char of letters) value = value * 26 + char.charCodeAt(0) - 64;
  return value - 1;
}

function parseSheet(xml, sharedStrings) {
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const ref = attrs.match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!ref) continue;
      const type = attrs.match(/\bt="([^"]+)"/)?.[1] ?? '';
      let value = '';
      if (type === 'inlineStr') {
        value = [...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((item) => decodeXml(item[1])).join('');
      } else {
        const raw = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? '';
        value = type === 's' ? sharedStrings[Number.parseInt(raw, 10)] ?? '' : decodeXml(raw);
      }
      row[columnIndex(ref)] = clean(value);
    }
    rows.push(row);
  }
  return rows;
}

function aliasMatches(header, alias) {
  if (header === alias) return true;
  if (alias.length < 4) return false;
  return header.startsWith(`${alias} `) || header.endsWith(` ${alias}`) || header.includes(` ${alias} `);
}

function detectField(header) {
  const normalized = normalize(header);
  if (!normalized) return null;
  let best = null;
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    for (const aliasValue of aliases) {
      const alias = normalize(aliasValue);
      if (!aliasMatches(normalized, alias)) continue;
      const score = alias.length + (normalized === alias ? 100 : 0);
      if (!best || score > best.score) best = { field, score };
    }
  }
  return best?.field ?? null;
}

function detectPriceKind(header) {
  const normalized = normalize(header);
  if (!normalized.includes('gia')) return null;
  if (/(gia von|gia nhap|gia mua|cost)/.test(normalized)) return null;
  if (/(thung|case|si)/.test(normalized)) return 'casePrice';
  if (/(gia le|le|ban le|kenh quan|gia ban|don gia)/.test(normalized)) return 'retailPrice';
  return 'genericPrice';
}

function findHeader(rows) {
  let best = null;
  const limit = Math.min(rows.length, 40);
  for (let rowIndex = 0; rowIndex < limit; rowIndex += 1) {
    const columns = {};
    let score = 0;
    rows[rowIndex].forEach((header, column) => {
      const field = detectField(header);
      if (field && columns[field] === undefined) {
        columns[field] = column;
        score += field === 'sku' || field === 'name' ? 4 : 1;
      }
      const priceKind = detectPriceKind(header);
      if (priceKind && columns[priceKind] === undefined) {
        columns[priceKind] = column;
        score += 1;
      }
    });
    if (columns.sku !== undefined && columns.name !== undefined && (!best || score > best.score)) {
      best = { rowIndex, columns, score, headers: rows[rowIndex] };
    }
  }
  return best;
}

function categoryIdFor(record) {
  const text = normalize([
    record.category,
    record.productType,
    record.name,
    record.brand,
  ].filter(Boolean).join(' '));
  if (/(bao bi|ly nhua|ly giay|nap ly|ong hut|tui |hop |muong|dia |khay)/.test(text)) return 'packaging';
  if (/(my cay|mi cay|ramen|my han|mi han)/.test(text)) return 'spicy-noodle';
  if (/(dong lanh|vien |pho mai que|khoai tay|xuc xich|ca vien|bo vien|tom vien|ga vien)/.test(text)) return 'frozen';
  if (/(an vat|snack|banh trang|rong bien|kho bo|hat |keo )/.test(text)) return 'snacks';
  if (/(gia vi|sot |tuong|sa te|nuoc cham|dau hao)/.test(text)) return 'sauce-seasoning';
  if (/(tra sua|pha che|topping|tran chau|thach|siro|syrup|tra |bot beo|bot kem|pudding|duong den|mut |puree)/.test(text)) return 'milk-tea';
  return 'other';
}

function packagingFor(record, purchaseMode) {
  if (purchaseMode === 'case' && record.casePackaging) return record.casePackaging;
  return record.packaging || (purchaseMode === 'case' ? 'Thùng' : record.unit || 'Đơn vị');
}

function rowRecord(row, columns, sourceName) {
  const read = (field) => columns[field] === undefined ? '' : clean(row[columns[field]] ?? '');
  const sku = cleanSku(read('sku'));
  const name = read('name');
  if (!sku || !name) return [];
  if (normalize(sku) === 'sku' || normalize(name).includes('ten san pham')) return [];

  const baseRecord = {
    sku,
    name,
    category: read('category'),
    productType: read('productType'),
    brand: read('brand'),
    flavor: read('flavor'),
    size: read('size'),
    packaging: read('packaging'),
    casePackaging: read('casePackaging'),
    unit: read('unit'),
    caseQuantity: parsePositiveInt(read('caseQuantity')),
    retailPrice: parseMoney(read('retailPrice')),
    casePrice: parseMoney(read('casePrice')),
    genericPrice: parseMoney(read('genericPrice')),
    sourceName,
  };
  const explicitMode = sku.endsWith('T') ? 'case' : 'retail';
  const records = [{ ...baseRecord, purchaseMode: explicitMode }];

  if (explicitMode === 'retail' && baseRecord.casePrice !== null) {
    records.push({ ...baseRecord, sku: `${sku}T`, purchaseMode: 'case', genericPrice: null, sourceName });
  }
  return records;
}

function priceFor(record) {
  if (record.purchaseMode === 'case') return record.casePrice ?? record.genericPrice ?? record.retailPrice;
  return record.retailPrice ?? record.genericPrice;
}

function mergeRecord(previous, next) {
  if (!previous) return next;
  const merged = { ...previous };
  for (const [key, value] of Object.entries(next)) {
    if (value !== '' && value !== null && value !== undefined) merged[key] = value;
  }
  return merged;
}

async function readWorkbook(filePath) {
  const buffer = await readFile(filePath);
  const entries = unzipEntries(buffer);
  const sharedStrings = parseSharedStrings(entries.get('xl/sharedStrings.xml')?.toString('utf8') ?? '');
  const sheetNames = [...entries.keys()].filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name)).sort();
  const records = [];
  const diagnostics = [];

  for (const sheetName of sheetNames) {
    const rows = parseSheet(entries.get(sheetName).toString('utf8'), sharedStrings);
    const header = findHeader(rows);
    if (!header) {
      diagnostics.push({ sheetName, mapped: 0, fields: [] });
      continue;
    }
    let mapped = 0;
    for (let rowIndex = header.rowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
      const rowRecords = rowRecord(rows[rowIndex], header.columns, filePath.split('/').pop());
      mapped += rowRecords.length;
      records.push(...rowRecords);
    }
    diagnostics.push({ sheetName, mapped, fields: Object.keys(header.columns) });
  }
  return { records, diagnostics };
}

function toProduct(record) {
  const sku = cleanSku(record.sku);
  const purchaseMode = record.purchaseMode === 'case' || sku.endsWith('T') ? 'case' : 'retail';
  const familySku = purchaseMode === 'case' && sku.endsWith('T') ? sku.slice(0, -1) : sku;
  const categoryId = categoryIdFor(record);
  const amount = priceFor(record);
  return {
    sku,
    familySku,
    categoryId,
    name: clean(record.name),
    aliases: [],
    brand: clean(record.brand) || 'Hưng Phát',
    productType: clean(record.productType) || clean(record.category) || 'Sản phẩm',
    flavor: clean(record.flavor) || null,
    size: clean(record.size) || clean(record.packaging) || '',
    purchaseMode,
    caseQuantity: purchaseMode === 'case' ? record.caseQuantity ?? null : null,
    packaging: packagingFor(record, purchaseMode),
    unit: clean(record.unit) || (purchaseMode === 'case' ? 'thùng' : 'đơn vị'),
    description: [clean(record.brand), clean(record.productType), clean(record.flavor), clean(record.size)].filter(Boolean).join(' · '),
    availability: 'available',
    price: {
      amount,
      currency: 'VND',
      status: amount === null ? 'customer_price_pending' : 'available',
    },
    visualTone: CATEGORY_META[categoryId].tone,
  };
}

async function main() {
  const missing = SOURCE_FILES.filter((name) => !existsSync(resolve(REPO_ROOT, name)));
  if (missing.length) throw new Error(`Thiếu bảng giá nguồn: ${missing.join(', ')}`);

  const bySku = new Map();
  const diagnostics = [];
  for (const sourceName of SOURCE_FILES) {
    const filePath = resolve(REPO_ROOT, sourceName);
    const workbook = await readWorkbook(filePath);
    diagnostics.push({ sourceName, sheets: workbook.diagnostics });
    for (const record of workbook.records) {
      const sku = cleanSku(record.sku);
      if (!sku) continue;
      bySku.set(sku, mergeRecord(bySku.get(sku), record));
    }
  }

  const products = [...bySku.values()]
    .map(toProduct)
    .filter((product) => product.sku && product.name)
    .sort((left, right) => left.name.localeCompare(right.name, 'vi') || left.sku.localeCompare(right.sku));

  if (products.length <= 14) {
    throw new Error(`Catalog chỉ map được ${products.length} SKU; dừng để tránh dùng lại dữ liệu demo. Diagnostics=${JSON.stringify(diagnostics)}`);
  }
  const uniqueSkuCount = new Set(products.map((product) => product.sku)).size;
  if (uniqueSkuCount !== products.length) throw new Error('Catalog sinh SKU trùng.');

  const usedCategories = new Set(products.map((product) => product.categoryId));
  const categories = Object.entries(CATEGORY_META)
    .filter(([id]) => usedCategories.has(id))
    .map(([id, meta]) => ({ id, name: meta.name, shortName: meta.shortName }));

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify({ categories, products, meta: { sourceFiles: SOURCE_FILES, productCount: products.length } }, null, 2)}\n`);
  console.log(`[catalog] generated ${products.length} unique SKU from ${SOURCE_FILES.length} workbooks`);
  for (const item of diagnostics) console.log(`[catalog] ${item.sourceName}: ${JSON.stringify(item.sheets)}`);
}

main().catch((error) => {
  console.error(`[catalog] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
