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

function normalizedSku(value) {
  return clean(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function sharedPrefixLength(left, right) {
  const a = normalizedSku(left);
  const b = normalizedSku(right);
  const limit = Math.min(a.length, b.length);
  let index = 0;
  while (index < limit && a[index] === b[index]) index += 1;
  return index;
}

function wordsWithOffsets(value) {
  const matches = [...clean(value).matchAll(/[\p{L}\p{N}]+/gu)];
  return matches.map((match) => ({ value: match[0], start: match.index ?? 0, end: (match.index ?? 0) + match[0].length }));
}

function normalizedWords(value) {
  return wordsWithOffsets(value).map((item) => normalizeSeriesText(item.value)).filter(Boolean);
}

function scopeKey(product) {
  return `${clean(product?.categoryId)}:${normalizeSeriesText(product?.productType)}`;
}

function startsWithWords(words, prefix) {
  return prefix.length <= words.length && prefix.every((word, index) => words[index] === word);
}

function displayPrefix(value, count) {
  const words = wordsWithOffsets(value);
  if (!count || words.length < count) return clean(value);
  return clean(value).slice(0, words[count - 1].end).trim();
}

function preferredFamilyProduct(products) {
  return products.find((product) => product.purchaseMode === "retail") ?? products[0];
}

function buildFamilyRepresentatives(products) {
  const families = new Map();
  for (const product of products) {
    const familySku = clean(product.familySku) || clean(product.sku);
    const current = families.get(familySku) ?? [];
    current.push(product);
    families.set(familySku, current);
  }
  return [...families.entries()].map(([familySku, familyProducts]) => ({
    familySku,
    product: preferredFamilyProduct(familyProducts),
    products: familyProducts,
  }));
}

function seriesMetaFromSource(rep) {
  const sourceSeries = clean(rep.product.series);
  if (!sourceSeries) return null;
  return {
    key: `series:${scopeKey(rep.product)}:${normalizeSeriesText(sourceSeries)}`,
    name: sourceSeries,
    prefixTokenCount: 0,
    sourceSeries,
  };
}

function findFallbackSeries(rep, scopeReps) {
  const name = baseProductName(rep.product);
  const words = normalizedWords(name);
  const genericWords = normalizedWords(rep.product.productType);
  if (words.length < 2) return null;

  let best = null;
  for (let length = 1; length <= words.length; length += 1) {
    const prefix = words.slice(0, length);
    if (genericWords.length === length && startsWithWords(prefix, genericWords) && startsWithWords(genericWords, prefix)) continue;
    if (genericWords.length > 0 && length <= genericWords.length && startsWithWords(genericWords, prefix)) continue;

    const matches = scopeReps.filter((candidate) => {
      if (clean(candidate.product.series)) return false;
      if (!startsWithWords(normalizedWords(baseProductName(candidate.product)), prefix)) return false;
      return candidate.familySku === rep.familySku || sharedPrefixLength(candidate.familySku, rep.familySku) >= 3;
    });
    const distinctFamilies = new Set(matches.map((candidate) => candidate.familySku));
    if (distinctFamilies.size < 2) continue;

    const prefixName = displayPrefix(name, length);
    const productType = clean(rep.product.productType);
    const displayName = genericWords.length > 0 && !startsWithWords(prefix, genericWords)
      ? `${productType} ${prefixName}`.trim()
      : prefixName;
    const candidate = {
      normalizedPrefix: prefix.join(" "),
      tokenCount: length,
      displayName,
      familyCount: distinctFamilies.size,
    };
    if (!best || candidate.familyCount > best.familyCount || (candidate.familyCount === best.familyCount && candidate.tokenCount > best.tokenCount)) best = candidate;
  }
  return best;
}

function familyMetaFor(rep, scopeReps) {
  const source = seriesMetaFromSource(rep);
  if (source) return source;
  const fallback = findFallbackSeries(rep, scopeReps);
  if (fallback) {
    return {
      key: `series:${scopeKey(rep.product)}:${fallback.normalizedPrefix}`,
      name: fallback.displayName,
      prefixTokenCount: fallback.tokenCount,
      sourceSeries: "",
    };
  }
  return {
    key: `family:${rep.familySku}`,
    name: baseProductName(rep.product) || "Sản phẩm",
    prefixTokenCount: 0,
    sourceSeries: "",
  };
}

export function buildProductSeriesIndex(products) {
  const reps = buildFamilyRepresentatives(products);
  const scopes = new Map();
  for (const rep of reps) {
    const key = scopeKey(rep.product);
    scopes.set(key, [...(scopes.get(key) ?? []), rep]);
  }

  const familyMeta = new Map();
  for (const scopeReps of scopes.values()) {
    for (const rep of scopeReps) familyMeta.set(rep.familySku, familyMetaFor(rep, scopeReps));
  }

  const groupsByKey = new Map();
  const groupKeyBySku = new Map();
  const groupKeyByFamilySku = new Map();
  for (const product of products) {
    const familySku = clean(product.familySku) || clean(product.sku);
    const meta = familyMeta.get(familySku) ?? {
      key: `family:${familySku}`,
      name: baseProductName(product) || "Sản phẩm",
      prefixTokenCount: 0,
      sourceSeries: "",
    };
    groupKeyBySku.set(product.sku, meta.key);
    groupKeyByFamilySku.set(familySku, meta.key);
    const group = groupsByKey.get(meta.key) ?? {
      key: meta.key,
      name: meta.name,
      prefixTokenCount: meta.prefixTokenCount,
      sourceSeries: meta.sourceSeries,
      products: [],
    };
    group.products.push(product);
    if (!groupsByKey.has(meta.key)) groupsByKey.set(meta.key, group);
  }

  for (const group of groupsByKey.values()) {
    group.products.sort((left, right) =>
      baseProductName(left).localeCompare(baseProductName(right), "vi")
      || (left.purchaseMode === right.purchaseMode ? left.sku.localeCompare(right.sku, "vi") : left.purchaseMode === "retail" ? -1 : 1));
  }

  return {
    groups: [...groupsByKey.values()],
    groupsByKey,
    groupKeyBySku,
    groupKeyByFamilySku,
  };
}

function matchingPrefixTokenCount(name, group, product) {
  const nameWords = normalizedWords(name);
  const candidates = [];
  if (group?.prefixTokenCount) candidates.push(normalizedWords(group.name));
  if (group?.sourceSeries) {
    const seriesWords = normalizedWords(group.sourceSeries);
    candidates.push(seriesWords);
    for (let start = 1; start < seriesWords.length; start += 1) candidates.push(seriesWords.slice(start));
  }
  const brandWords = normalizedWords(product?.brand);
  const brand = normalizeSeriesText(product?.brand);
  if (brand && brand !== "hung phat") candidates.push(brandWords);
  candidates.push(normalizedWords(product?.productType));

  return candidates
    .filter((candidate) => candidate.length > 0 && startsWithWords(nameWords, candidate))
    .reduce((best, candidate) => Math.max(best, candidate.length), 0);
}

function stripTrailingMeasure(value, product) {
  let result = clean(value);
  const size = normalizeSeriesText(product?.size).replace(/\s+/g, "");
  result = result.replace(/(?:\s*[-–—]\s*|\s+)?\d+(?:[.,]\d+)?\s*(?:ml|cl|l|g|gr|kg)\s*$/iu, (match) => {
    const normalized = normalizeSeriesText(match).replace(/\s+/g, "");
    return !size || size.includes(normalized) || normalized.includes(size) ? "" : match;
  }).trim();
  return result.replace(/^[-–—,:;|/\s]+|[-–—,:;|/\s]+$/gu, "").trim();
}

export function productSeriesVariantLabel(product, group) {
  const explicitFlavor = clean(product?.flavor);
  if (explicitFlavor) return explicitFlavor;
  if (!group) return "";

  const name = baseProductName(product);
  const words = wordsWithOffsets(name);
  const prefixCount = matchingPrefixTokenCount(name, group, product);
  if (!prefixCount || words.length <= prefixCount) return "";
  const remainder = name.slice(words[prefixCount].start).trim();
  return stripTrailingMeasure(remainder, product);
}
