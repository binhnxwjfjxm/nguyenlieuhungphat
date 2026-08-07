const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

export function normalizeSeriesText(value) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function baseProductName(product) {
  return clean(product?.name).replace(/\s*-\s*THÙNG\s*$/iu, "").trim();
}

function preferredGroupName(product) {
  const series = clean(product?.series);
  if (series) return series;
  const productType = clean(product?.productType);
  const brand = clean(product?.brand);
  if (productType && brand && normalizeSeriesText(brand) !== "hung phat") return `${productType} ${brand}`.trim();
  return productType || brand || baseProductName(product) || "Sản phẩm";
}

function canonicalMeta(product) {
  const productCardKey = clean(product?.canonicalProductCardKey);
  if (!productCardKey) return null;
  return {
    key: `canonical:${productCardKey}`,
    name: preferredGroupName(product),
    prefixTokenCount: 0,
    sourceSeries: clean(product?.series),
  };
}

function fallbackMeta(product) {
  const familySku = clean(product?.familySku) || clean(product?.sku);
  return {
    key: `family:${familySku}`,
    name: baseProductName(product) || "Sản phẩm",
    prefixTokenCount: 0,
    sourceSeries: "",
  };
}

export function buildProductSeriesIndex(products) {
  const groupsByKey = new Map();
  const groupKeyBySku = new Map();
  const groupKeyByFamilySku = new Map();

  for (const product of products) {
    const familySku = clean(product?.familySku) || clean(product?.sku);
    const meta = canonicalMeta(product) ?? fallbackMeta(product);
    groupKeyBySku.set(product.sku, meta.key);

    const existingFamilyKey = groupKeyByFamilySku.get(familySku);
    if (existingFamilyKey && existingFamilyKey !== meta.key) {
      throw new Error(`Canonical family ${familySku} bị map vào nhiều product card: ${existingFamilyKey} / ${meta.key}`);
    }
    groupKeyByFamilySku.set(familySku, meta.key);

    const group = groupsByKey.get(meta.key) ?? {
      key: meta.key,
      name: meta.name,
      prefixTokenCount: meta.prefixTokenCount,
      sourceSeries: meta.sourceSeries,
      products: [],
    };

    if (clean(group.name) !== clean(meta.name)) {
      throw new Error(`Canonical product card ${meta.key} có nhiều tên dòng: ${group.name} / ${meta.name}`);
    }

    group.products.push(product);
    if (!groupsByKey.has(meta.key)) groupsByKey.set(meta.key, group);
  }

  for (const group of groupsByKey.values()) {
    group.products.sort((left, right) =>
      clean(left?.canonicalVariant).localeCompare(clean(right?.canonicalVariant), "vi")
      || clean(left?.size).localeCompare(clean(right?.size), "vi")
      || (left.purchaseMode === right.purchaseMode
        ? left.sku.localeCompare(right.sku, "vi")
        : left.purchaseMode === "retail" ? -1 : 1));
  }

  return {
    groups: [...groupsByKey.values()].sort((left, right) => left.name.localeCompare(right.name, "vi") || left.key.localeCompare(right.key, "vi")),
    groupsByKey,
    groupKeyBySku,
    groupKeyByFamilySku,
  };
}

export function productSeriesVariantLabel(product, group) {
  const canonicalVariant = clean(product?.canonicalVariant);
  if (canonicalVariant) return canonicalVariant;

  const explicitFlavor = clean(product?.flavor);
  if (explicitFlavor) return explicitFlavor;
  if (!group) return "";

  const name = baseProductName(product);
  const groupName = clean(group.name);
  if (!name || !groupName) return "";
  const normalizedName = normalizeSeriesText(name);
  const normalizedGroup = normalizeSeriesText(groupName);
  if (!normalizedName.startsWith(`${normalizedGroup} `)) return "";

  const groupWords = groupName.split(/\s+/).filter(Boolean).length;
  const nameWords = name.split(/\s+/).filter(Boolean);
  return nameWords.slice(groupWords).join(" ").replace(/\s+\d+(?:[.,]\d+)?\s*(?:ml|cl|l|g|gr|kg)\s*$/iu, "").trim();
}
