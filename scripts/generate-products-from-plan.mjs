import fs from "node:fs/promises";
import path from "node:path";

const cwd = process.cwd();
const csvPath = path.join(cwd, ".codex-input", "hung-phat-full-image-rename-plan.csv");
const outputPath = path.join(cwd, "data", "products.generated.ts");

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => normalizeText(value));
}

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter((line, index, all) => line.trim() || index < all.length - 1);
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).filter(Boolean).map((line) => {
    const values = splitCsvLine(line);
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? "";
    });
    return record;
  });
}

function escapeTsString(value) {
  return JSON.stringify(normalizeText(value));
}

const csv = await fs.readFile(csvPath, "utf8");
const rows = parseCsv(csv);

if (rows.length !== 275) {
  throw new Error(`Expected 275 rows, got ${rows.length}.`);
}

const seenProductIds = new Set();
const seenImageKeys = new Set();
const seenR2Paths = new Set();

for (const row of rows) {
  if (seenProductIds.has(row.new_product_id)) {
    throw new Error(`Duplicate new_product_id: ${row.new_product_id}`);
  }
  if (seenImageKeys.has(row.new_image_key)) {
    throw new Error(`Duplicate new_image_key: ${row.new_image_key}`);
  }
  if (seenR2Paths.has(row.new_r2_object_path)) {
    throw new Error(`Duplicate new_r2_object_path: ${row.new_r2_object_path}`);
  }
  seenProductIds.add(row.new_product_id);
  seenImageKeys.add(row.new_image_key);
  seenR2Paths.add(row.new_r2_object_path);
}

const typeBlock = `export type ProductPlanRow = {\n  stt: number;\n  old_product_key: string;\n  old_name: string;\n  old_brand: string;\n  old_category: string;\n  old_image_key: string;\n  old_file_current: string;\n  old_r2_object_key: string;\n  new_product_id: string;\n  new_image_key: string;\n  new_file_name: string;\n  new_r2_object_path: string;\n  industry_code: string;\n  industry_name: string;\n  group_code: string;\n  group_name: string;\n  seq_in_group: number;\n  plan_status: string;\n  source_file_exists: boolean;\n  note: string;\n};\n\n`;

const rowsBlock = rows
  .map((row) => {
    const sourceExists = normalizeText(row.source_file_exists).toLowerCase() === "true";
    return `  {\n    stt: ${Number(row.STT)},\n    old_product_key: ${escapeTsString(row.old_product_key)},\n    old_name: ${escapeTsString(row.old_name)},\n    old_brand: ${escapeTsString(row.old_brand)},\n    old_category: ${escapeTsString(row.old_category)},\n    old_image_key: ${escapeTsString(row.old_image_key)},\n    old_file_current: ${escapeTsString(row.old_file_current)},\n    old_r2_object_key: ${escapeTsString(row.old_r2_object_key)},\n    new_product_id: ${escapeTsString(row.new_product_id)},\n    new_image_key: ${escapeTsString(row.new_image_key)},\n    new_file_name: ${escapeTsString(row.new_file_name)},\n    new_r2_object_path: ${escapeTsString(row.new_r2_object_path)},\n    industry_code: ${escapeTsString(row.industry_code)},\n    industry_name: ${escapeTsString(row.industry_name)},\n    group_code: ${escapeTsString(row.group_code)},\n    group_name: ${escapeTsString(row.group_name)},\n    seq_in_group: ${Number(row.seq_in_group)},\n    plan_status: ${escapeTsString(row.plan_status)},\n    source_file_exists: ${sourceExists ? "true" : "false"},\n    note: ${escapeTsString(row.note)},\n  }`;
  })
  .join(",\n");

const output = `${typeBlock}export const productPlans: ProductPlanRow[] = [\n${rowsBlock}\n];\n`;

await fs.writeFile(outputPath, output, "utf8");
console.log(`Wrote ${rows.length} product plan rows to ${path.relative(cwd, outputPath)}`);
console.log(`Unique product ids: ${seenProductIds.size}`);
console.log(`Unique image keys: ${seenImageKeys.size}`);
console.log(`Unique R2 paths: ${seenR2Paths.size}`);
