"use client";

import {
  Check,
  Minus,
  PackageSearch,
  Plus,
  RotateCcw,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ProductVisual } from "@/components/product-visual";
import { announceCartUpdated } from "@/lib/cart-events";
import { productMatchesQuery, productSearchRank } from "@/lib/catalog-search";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { Category, Product, PurchaseMode } from "@/lib/contracts";
import { distinctProductValues, productSizeLabel } from "@/lib/product-grouping";

type PurchaseModeFilter = "all" | PurchaseMode;
interface CatalogFilters { brand: string; flavor: string; size: string; }
const EMPTY_FILTERS: CatalogFilters = { brand: "", flavor: "", size: "" };

function formatPrice(product: Product | null | undefined): string {
  if (!product) return "—";
  if (product.price.status !== "available" || product.price.amount === null) return "Chờ giá";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: product.price.currency,
    maximumFractionDigits: 0,
  }).format(product.price.amount);
}

function availabilityLabel(product: Product): string {
  if (product.availability === "out_of_stock") return "Hết hàng";
  if (product.availability === "paused") return "Tạm ngưng";
  return "Đang bán";
}

function purchaseModeLabel(mode: PurchaseMode): string {
  return mode === "case" ? "Thùng" : "Lẻ";
}

function clean(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function normalizeGroupText(value: string): string {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripTrailingVariantValue(name: string, value: string): string {
  const token = clean(value);
  if (!token) return name;
  const flexibleToken = escapeRegExp(token).replace(/\s+/g, "\\s+");
  return name.replace(new RegExp(`(?:\\s*[-–—]\\s*|\\s+)${flexibleToken}\\s*$`, "iu"), "").trim();
}

function productSeriesName(product: Product): string {
  const baseName = clean(product.name).replace(/\s*-\s*THÙNG\s*$/iu, "").trim();
  let seriesName = baseName;
  for (const token of [clean(product.flavor), productSizeLabel(product), clean(product.size)]) {
    const stripped = stripTrailingVariantValue(seriesName, token);
    if (stripped) seriesName = stripped;
  }
  return seriesName || baseName || "Sản phẩm";
}

function productCardGroupKey(product: Product): string {
  const baseName = clean(product.name).replace(/\s*-\s*THÙNG\s*$/iu, "").trim();
  const seriesName = productSeriesName(product);
  if (normalizeGroupText(seriesName) === normalizeGroupText(baseName)) {
    return `family:${clean(product.familySku) || product.sku}`;
  }
  return [
    "series",
    product.categoryId,
    normalizeGroupText(product.brand),
    normalizeGroupText(product.productType),
    normalizeGroupText(seriesName),
  ].join(":");
}

function chooseFamilyPreferred(
  variants: Product[],
  selectedSku: string | undefined,
  purchaseMode: PurchaseModeFilter,
): Product {
  const selected = variants.find((variant) => variant.sku === selectedSku);
  if (selected && (purchaseMode === "all" || selected.purchaseMode === purchaseMode)) return selected;
  if (purchaseMode !== "all") {
    const filtered = variants.find((variant) => variant.purchaseMode === purchaseMode);
    if (filtered) return filtered;
  }
  return variants.find((variant) => variant.purchaseMode === "retail") ?? variants[0];
}

function choosePreferred(candidates: Product[], current: Product): Product {
  return candidates.find((product) => product.purchaseMode === current.purchaseMode && product.size === current.size)
    ?? candidates.find((product) => product.purchaseMode === current.purchaseMode)
    ?? candidates.find((product) => product.purchaseMode === "retail")
    ?? candidates[0]
    ?? current;
}

function sameFlavor(product: Product, flavor: string): boolean {
  return clean(product.flavor) === flavor;
}

export function ProductCatalog() {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeProductType, setActiveProductType] = useState<string | null>(null);
  const [purchaseMode, setPurchaseMode] = useState<PurchaseModeFilter>("all");
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_FILTERS);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [loaded, setLoaded] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [addedSku, setAddedSku] = useState<string | null>(null);
  const [selectedSkuByFamily, setSelectedSkuByFamily] = useState<Record<string, string>>({});
  const [quickViewSku, setQuickViewSku] = useState<string | null>(null);
  const [quickViewQuantity, setQuickViewQuantity] = useState(1);
  const quickViewDialogRef = useRef<HTMLElement | null>(null);
  const quickViewCloseRef = useRef<HTMLButtonElement | null>(null);
  const quickViewOpenerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([service.listCategories(), service.listProducts()])
      .then(([categoryItems, productItems]) => {
        if (cancelled) return;
        setCategories(categoryItems);
        setProducts(productItems);
        setCatalogError("");
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setCatalogError("Không tải được danh mục sản phẩm.");
        setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [service]);

  useEffect(() => {
    if (!quickViewSku) return;
    const previousOverflow = document.body.style.overflow;
    const opener = quickViewOpenerRef.current;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => quickViewCloseRef.current?.focus(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setQuickViewSku(null);
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = quickViewDialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      opener?.focus();
    };
  }, [quickViewSku]);

  const categoryScope = useMemo(
    () => products.filter((product) => !activeCategory || product.categoryId === activeCategory),
    [activeCategory, products],
  );

  const productTypeOptions = useMemo(
    () => distinctProductValues(categoryScope, (product) => clean(product.productType)).filter(Boolean),
    [categoryScope],
  );

  const detailScope = useMemo(
    () => categoryScope.filter((product) => !activeProductType || product.productType === activeProductType),
    [activeProductType, categoryScope],
  );

  const filterOptions = useMemo(() => ({
    brands: distinctProductValues(detailScope, (product) => clean(product.brand)).filter(Boolean),
    flavors: distinctProductValues(detailScope, (product) => clean(product.flavor)).filter(Boolean),
    sizes: distinctProductValues(detailScope, (product) => clean(product.size)).filter(Boolean),
  }), [detailScope]);
  const activeDetailFilterCount = Object.values(filters).filter(Boolean).length;

  const filteredVariants = useMemo(() => products
    .filter((product) => !activeCategory || product.categoryId === activeCategory)
    .filter((product) => !activeProductType || product.productType === activeProductType)
    .filter((product) => purchaseMode === "all" || product.purchaseMode === purchaseMode)
    .filter((product) => !filters.brand || product.brand === filters.brand)
    .filter((product) => !filters.flavor || product.flavor === filters.flavor)
    .filter((product) => !filters.size || product.size === filters.size)
    .filter((product) => productMatchesQuery(product, deferredQuery))
    .sort((left, right) => productSearchRank(left, deferredQuery) - productSearchRank(right, deferredQuery)
      || left.name.localeCompare(right.name, "vi") || left.sku.localeCompare(right.sku, "vi")),
  [activeCategory, activeProductType, deferredQuery, filters, products, purchaseMode]);

  const productFamilies = useMemo(() => {
    const groupOrder: string[] = [];
    const seen = new Set<string>();
    for (const product of filteredVariants) {
      const groupKey = productCardGroupKey(product);
      if (!seen.has(groupKey)) {
        seen.add(groupKey);
        groupOrder.push(groupKey);
      }
    }
    return groupOrder.map((groupKey) => {
      const visibleVariants = filteredVariants.filter((product) => productCardGroupKey(product) === groupKey);
      const variants = products
        .filter((product) => productCardGroupKey(product) === groupKey)
        .sort((left, right) => left.name.localeCompare(right.name, "vi")
          || (left.purchaseMode === right.purchaseMode ? left.sku.localeCompare(right.sku, "vi") : left.purchaseMode === "retail" ? -1 : 1));
      return {
        groupKey,
        variants,
        selected: chooseFamilyPreferred(visibleVariants.length > 0 ? visibleVariants : variants, selectedSkuByFamily[groupKey], purchaseMode),
      };
    });
  }, [filteredVariants, products, purchaseMode, selectedSkuByFamily]);

  const quickViewProduct = quickViewSku ? products.find((product) => product.sku === quickViewSku) ?? null : null;
  const quickRelatedProducts = useMemo(() => {
    if (!quickViewProduct) return [];
    const quickViewGroupKey = productCardGroupKey(quickViewProduct);
    return products.filter((product) => productCardGroupKey(product) === quickViewGroupKey);
  }, [products, quickViewProduct]);

  const quickViewFlavor = clean(quickViewProduct?.flavor);
  const quickViewSize = clean(quickViewProduct?.size);
  const quickViewFlavorOptions = useMemo(
    () => distinctProductValues(quickRelatedProducts, (product) => clean(product.flavor)),
    [quickRelatedProducts],
  );
  const quickViewFlavorProducts = useMemo(
    () => quickRelatedProducts.filter((product) => sameFlavor(product, quickViewFlavor)),
    [quickRelatedProducts, quickViewFlavor],
  );
  const quickViewSizeOptions = useMemo(
    () => distinctProductValues(quickViewFlavorProducts, (product) => clean(product.size)),
    [quickViewFlavorProducts],
  );
  const quickViewDimensionProducts = useMemo(
    () => quickViewFlavorProducts.filter((product) => clean(product.size) === quickViewSize),
    [quickViewFlavorProducts, quickViewSize],
  );
  const quickViewPurchaseModes = useMemo(
    () => [...new Set(quickViewDimensionProducts.map((product) => product.purchaseMode))],
    [quickViewDimensionProducts],
  );
  const quickViewExactCandidates = useMemo(
    () => quickViewProduct
      ? quickViewDimensionProducts.filter((product) => product.purchaseMode === quickViewProduct.purchaseMode)
      : [],
    [quickViewDimensionProducts, quickViewProduct],
  );
  const quickViewFamilyVariants = useMemo(
    () => quickViewProduct ? products.filter((product) => product.familySku === quickViewProduct.familySku) : [],
    [products, quickViewProduct],
  );
  const quickViewRetail = quickViewFamilyVariants.find((product) => product.purchaseMode === "retail") ?? null;
  const quickViewCase = quickViewFamilyVariants.find((product) => product.purchaseMode === "case") ?? null;

  async function addProduct(product: Product, quantity = 1) {
    if (product.availability !== "available") return;
    const cart = await service.getCart();
    const existing = cart.lines.find((line) => line.sku === product.sku);
    const lines = existing
      ? cart.lines.map((line) => line.sku === product.sku
        ? { ...line, quantity: Math.min(999, line.quantity + quantity) }
        : line)
      : [...cart.lines, { sku: product.sku, quantity }];
    await service.saveCart({ lines, updatedAt: new Date().toISOString() });
    announceCartUpdated();
    setAddedSku(product.sku);
    window.setTimeout(() => setAddedSku((current) => current === product.sku ? null : current), 1400);
  }

  function openQuickView(product: Product, opener: HTMLElement) {
    quickViewOpenerRef.current = opener;
    setQuickViewSku(product.sku);
    setQuickViewQuantity(1);
  }

  function selectQuickProduct(product: Product) {
    setQuickViewSku(product.sku);
    const groupKey = productCardGroupKey(product);
    setSelectedSkuByFamily((current) => ({ ...current, [groupKey]: product.sku }));
    setQuickViewQuantity(1);
  }

  function selectCategory(categoryId: string | null) {
    setActiveCategory(categoryId);
    setActiveProductType(null);
    setFilters(EMPTY_FILTERS);
  }

  return (
    <section className="catalog-screen catalog-screen-compact">
      <label className="catalog-search">
        <Search aria-hidden="true" size={19} /><span className="sr-only">Tìm sản phẩm</span>
        <input autoComplete="off" onChange={(event) => setQuery(event.target.value)} placeholder="Tên, nhãn hoặc SKU" type="search" value={query} />
        {query ? <button aria-label="Xóa nội dung tìm kiếm" onClick={() => setQuery("")} type="button"><RotateCcw aria-hidden="true" size={17} /></button> : null}
      </label>

      <div className="catalog-primary-filter-row">
        <div aria-label="Chọn quy cách mua" className="catalog-purchase-mode" role="group">
          {([["all", "Tất cả"], ["retail", "Mua lẻ"], ["case", "Mua thùng"]] as const).map(([mode, label]) => (
            <button aria-pressed={purchaseMode === mode} className={purchaseMode === mode ? "is-active" : ""} key={mode} onClick={() => setPurchaseMode(mode)} type="button">{label}</button>
          ))}
        </div>
        <details className="catalog-filter-menu">
          <summary><SlidersHorizontal aria-hidden="true" size={17} /><span>Bộ lọc</span>{activeDetailFilterCount > 0 ? <b aria-label={`${activeDetailFilterCount} bộ lọc đang bật`}>{activeDetailFilterCount}</b> : null}</summary>
          <div className="catalog-filter-panel">
            <div className="catalog-filter-panel-heading"><strong>Lọc chi tiết</strong>{activeDetailFilterCount ? <button onClick={() => setFilters(EMPTY_FILTERS)} type="button"><X aria-hidden="true" size={15} /> Xóa lọc</button> : null}</div>
            <div className="catalog-filter-grid">
              {([['brand','Nhãn hàng',filterOptions.brands],['flavor','Vị',filterOptions.flavors],['size','Size',filterOptions.sizes]] as const).map(([field,label,options]) => (
                <label key={field}><span>{label}</span><select onChange={(event) => setFilters((current) => ({ ...current, [field]: event.target.value }))} value={filters[field]}><option value="">Tất cả</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
              ))}
            </div>
          </div>
        </details>
      </div>

      <div aria-label="Lọc theo ngành sản phẩm" className="catalog-category-row" role="tablist">
        <button aria-selected={activeCategory === null} className={activeCategory === null ? "is-active" : ""} onClick={() => selectCategory(null)} role="tab" type="button">Tất cả ngành</button>
        {categories.map((category) => <button aria-selected={activeCategory === category.id} className={activeCategory === category.id ? "is-active" : ""} key={category.id} onClick={() => selectCategory(category.id)} role="tab" type="button">{category.shortName}</button>)}
      </div>

      {activeCategory && productTypeOptions.length > 0 ? <div className="catalog-type-filter" aria-label="Nhóm hàng trong ngành">
        <span>Nhóm hàng</span>
        <div className="catalog-type-row" role="group">
          <button aria-pressed={activeProductType === null} className={activeProductType === null ? "is-active" : ""} onClick={() => { setActiveProductType(null); setFilters(EMPTY_FILTERS); }} type="button">Tất cả</button>
          {productTypeOptions.map((productType) => <button aria-pressed={activeProductType === productType} className={activeProductType === productType ? "is-active" : ""} key={productType} onClick={() => { setActiveProductType(productType); setFilters(EMPTY_FILTERS); }} type="button">{productType}</button>)}
        </div>
      </div> : null}

      {catalogError ? <div className="catalog-state-card is-error" role="alert"><PackageSearch aria-hidden="true" size={28} /><strong>Chưa tải được sản phẩm</strong><span>{catalogError}</span></div>
        : !loaded ? <div aria-label="Đang tải sản phẩm" className="catalog-grid">{Array.from({ length: 4 }, (_, index) => <div className="catalog-product-card is-skeleton" key={index}><span /><span /><span /></div>)}</div>
        : productFamilies.length === 0 ? <div className="catalog-state-card"><PackageSearch aria-hidden="true" size={30} /><strong>Không tìm thấy sản phẩm</strong></div>
        : <div className="catalog-grid">{productFamilies.map(({ groupKey, variants, selected }) => {
          const familySku = selected.familySku;
          const familyVariants = variants.filter((product) => product.familySku === familySku);
          const retail = familyVariants.find((variant) => variant.purchaseMode === "retail") ?? null;
          const caseVariant = familyVariants.find((variant) => variant.purchaseMode === "case") ?? null;
          const canOrder = selected.availability === "available";
          const flavorCount = distinctProductValues(variants, (product) => clean(product.flavor)).filter(Boolean).length;
          const sizeCount = distinctProductValues(variants, (product) => clean(product.size)).filter(Boolean).length;
          const productSubtitle = [
            selected.productType,
            flavorCount > 1 ? `${flavorCount} vị` : selected.flavor,
            sizeCount > 1 ? `${sizeCount} size` : productSizeLabel(selected),
          ].filter(Boolean).join(" · ");
          const cardName = productSeriesName(selected);
          return <article className="catalog-product-card catalog-product-card-compact catalog-family-card" key={groupKey}>
            <button className="catalog-product-main" onClick={(event) => openQuickView(selected, event.currentTarget)} type="button">
              <ProductVisual product={selected} />
              <div className="catalog-product-copy catalog-product-copy-compact">
                <div className="catalog-product-meta"><span>{selected.brand}</span><span className={`availability-${selected.availability}`}>{availabilityLabel(selected)}</span></div>
                <h2>{cardName}</h2>
                <span className="catalog-family-subtitle">{productSubtitle || selected.packaging}</span>
              </div>
            </button>
            <div className="catalog-family-footer">
              <div className="catalog-family-purchase">
                <strong className="catalog-card-price">{formatPrice(selected)}</strong>
                <div className="catalog-price-columns" aria-label={`Chọn mua lẻ hoặc thùng ${cardName}`}>
                  {retail ? <button aria-pressed={selected.sku === retail.sku} className={selected.sku === retail.sku ? "catalog-price-cell is-active" : "catalog-price-cell"} onClick={() => setSelectedSkuByFamily((current) => ({ ...current, [groupKey]: retail.sku }))} type="button"><span>Lẻ</span></button> : <div className="catalog-price-cell is-missing"><span>Lẻ</span></div>}
                  {caseVariant ? <button aria-pressed={selected.sku === caseVariant.sku} className={selected.sku === caseVariant.sku ? "catalog-price-cell is-active" : "catalog-price-cell"} onClick={() => setSelectedSkuByFamily((current) => ({ ...current, [groupKey]: caseVariant.sku }))} type="button"><span>Thùng</span></button> : <div className="catalog-price-cell is-missing"><span>Thùng</span></div>}
                </div>
              </div>
              <button aria-label={`Thêm ${selected.name} vào giỏ`} className="catalog-add-icon" disabled={!canOrder} onClick={() => void addProduct(selected)} type="button">{addedSku === selected.sku ? <Check aria-hidden="true" size={19} /> : <><Plus aria-hidden="true" size={14} /><ShoppingCart aria-hidden="true" size={18} /></>}</button>
            </div>
          </article>;
        })}</div>}

      {quickViewProduct ? <div className="product-quick-view-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setQuickViewSku(null); }} role="presentation">
        <section aria-label={`Chi tiết ${quickViewProduct.name}`} aria-modal="true" className="product-quick-view product-quick-view-tall" ref={quickViewDialogRef} role="dialog" tabIndex={-1}>
          <button aria-label="Đóng chi tiết sản phẩm" className="product-quick-view-close" onClick={() => setQuickViewSku(null)} ref={quickViewCloseRef} type="button"><X aria-hidden="true" size={20} /></button>
          <ProductVisual product={quickViewProduct} />
          <div className="product-quick-view-copy">
            <div className="catalog-product-meta"><span>{quickViewProduct.sku}</span><span className={`availability-${quickViewProduct.availability}`}>{availabilityLabel(quickViewProduct)}</span></div>
            <p className="product-quick-view-brand">{quickViewProduct.brand}</p>
            <h2>{quickViewProduct.productType}</h2>
            <strong className="product-quick-view-name">{quickViewProduct.name}</strong>

            {quickViewFlavorOptions.length > 1 ? <div className="product-choice-block"><span>Vị</span><div className="product-choice-chips" role="group" aria-label="Chọn vị">{quickViewFlavorOptions.map((flavor) => <button aria-pressed={flavor === quickViewFlavor} className={flavor === quickViewFlavor ? "is-active" : ""} key={flavor || "default"} onClick={() => selectQuickProduct(choosePreferred(quickRelatedProducts.filter((product) => sameFlavor(product, flavor)), quickViewProduct))} type="button">{flavor || "Không vị"}</button>)}</div></div> : null}

            {quickViewSizeOptions.length > 1 ? <div className="product-choice-block"><span>Dung tích / size</span><div className="product-choice-chips" role="group" aria-label="Chọn dung tích hoặc size">{quickViewSizeOptions.map((size) => {
              const candidates = quickViewFlavorProducts.filter((product) => clean(product.size) === size);
              const representative = candidates[0];
              return <button aria-pressed={size === quickViewSize} className={size === quickViewSize ? "is-active" : ""} key={size || "default"} onClick={() => selectQuickProduct(choosePreferred(candidates, quickViewProduct))} type="button">{representative ? productSizeLabel(representative) || size || "Mặc định" : size || "Mặc định"}</button>;
            })}</div></div> : null}

            {quickViewPurchaseModes.length > 1 ? <div className="product-choice-block"><span>Mua</span><div className="product-choice-chips product-choice-mode" role="group" aria-label="Chọn mua lẻ hoặc thùng">{quickViewPurchaseModes.map((mode) => <button aria-pressed={mode === quickViewProduct.purchaseMode} className={mode === quickViewProduct.purchaseMode ? "is-active" : ""} key={mode} onClick={() => selectQuickProduct(choosePreferred(quickViewDimensionProducts.filter((product) => product.purchaseMode === mode), quickViewProduct))} type="button">{purchaseModeLabel(mode)}</button>)}</div></div> : null}

            {quickViewExactCandidates.length > 1 ? <div className="product-choice-block"><span>SKU</span><div className="product-choice-chips product-choice-sku" role="group" aria-label="Chọn SKU chính xác">{quickViewExactCandidates.map((product) => <button aria-pressed={product.sku === quickViewProduct.sku} className={product.sku === quickViewProduct.sku ? "is-active" : ""} key={product.sku} onClick={() => selectQuickProduct(product)} type="button">{product.sku}</button>)}</div></div> : null}

            <dl className="product-quick-view-specs"><div><dt>Quy cách</dt><dd>{quickViewProduct.packaging}</dd></div><div><dt>Size</dt><dd>{productSizeLabel(quickViewProduct) || "—"}</dd></div><div><dt>Vị</dt><dd>{quickViewProduct.flavor || "—"}</dd></div><div><dt>SKU</dt><dd>{quickViewProduct.sku}</dd></div></dl>
            <div className="product-quick-view-price-pair" aria-label="Giá lẻ và giá thùng"><div><span>Giá lẻ</span><strong>{formatPrice(quickViewRetail)}</strong></div><div><span>Giá thùng</span><strong>{formatPrice(quickViewCase)}</strong></div></div>
            <div className="product-quick-view-order"><div className="quantity-stepper"><button aria-label="Giảm số lượng" disabled={quickViewQuantity <= 1} onClick={() => setQuickViewQuantity((current) => Math.max(1, current - 1))} type="button"><Minus aria-hidden="true" size={17} /></button><output>{quickViewQuantity}</output><button aria-label="Tăng số lượng" disabled={quickViewQuantity >= 99} onClick={() => setQuickViewQuantity((current) => Math.min(99, current + 1))} type="button"><Plus aria-hidden="true" size={17} /></button></div><button className="product-quick-view-add" disabled={quickViewProduct.availability !== "available"} onClick={() => void addProduct(quickViewProduct, quickViewQuantity)} type="button"><ShoppingCart aria-hidden="true" size={18} />{addedSku === quickViewProduct.sku ? "Đã thêm" : `Thêm ${purchaseModeLabel(quickViewProduct.purchaseMode).toLowerCase()} vào giỏ`}</button></div>
          </div>
        </section>
      </div> : null}
    </section>
  );
}
