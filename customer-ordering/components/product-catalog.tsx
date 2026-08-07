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
import { createPortal } from "react-dom";
import { ProductVisual } from "@/components/product-visual";
import { announceCartUpdated } from "@/lib/cart-events";
import { productMatchesQuery, productSearchRank } from "@/lib/catalog-search";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { Category, Product, PurchaseMode } from "@/lib/contracts";
import { distinctProductValues, productSizeLabel } from "@/lib/product-grouping";
import { buildProductSeriesIndex, productSeriesVariantLabel } from "@/lib/product-series.mjs";
import type { ProductSeriesGroup, ProductSeriesIndex } from "@/lib/product-series.mjs";

type PurchaseModeFilter = "all" | PurchaseMode;
interface CatalogFilters { brand: string; flavor: string; size: string; }
const EMPTY_FILTERS: CatalogFilters = { brand: "", flavor: "", size: "" };
const INITIAL_VISIBLE_GROUPS = 20;
const LOAD_MORE_GROUPS = 20;

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

function chooseGroupPreferred(
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

function seriesGroupFor(index: ProductSeriesIndex, product: Product): ProductSeriesGroup | null {
  const key = index.groupKeyBySku.get(product.sku);
  return key ? index.groupsByKey.get(key) ?? null : null;
}

function seriesVariantFor(index: ProductSeriesIndex, product: Product): string {
  return productSeriesVariantLabel(product, seriesGroupFor(index, product));
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
  const [selectedSkuByGroup, setSelectedSkuByGroup] = useState<Record<string, string>>({});
  const [visibleGroupCount, setVisibleGroupCount] = useState(INITIAL_VISIBLE_GROUPS);
  const [quickViewSku, setQuickViewSku] = useState<string | null>(null);
  const [quickViewQuantity, setQuickViewQuantity] = useState(1);
  const [portalReady, setPortalReady] = useState(false);
  const quickViewDialogRef = useRef<HTMLElement | null>(null);
  const quickViewCloseRef = useRef<HTMLButtonElement | null>(null);
  const quickViewOpenerRef = useRef<HTMLElement | null>(null);

  useEffect(() => { setPortalReady(true); }, []);

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

  const seriesIndex = useMemo(() => buildProductSeriesIndex(products), [products]);

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
    flavors: distinctProductValues(detailScope, (product) => seriesVariantFor(seriesIndex, product)).filter(Boolean),
    sizes: distinctProductValues(detailScope, (product) => clean(product.size)).filter(Boolean),
  }), [detailScope, seriesIndex]);
  const activeDetailFilterCount = Object.values(filters).filter(Boolean).length;

  const filteredVariants = useMemo(() => products
    .filter((product) => !activeCategory || product.categoryId === activeCategory)
    .filter((product) => !activeProductType || product.productType === activeProductType)
    .filter((product) => purchaseMode === "all" || product.purchaseMode === purchaseMode)
    .filter((product) => !filters.brand || product.brand === filters.brand)
    .filter((product) => !filters.flavor || seriesVariantFor(seriesIndex, product) === filters.flavor)
    .filter((product) => !filters.size || product.size === filters.size)
    .filter((product) => productMatchesQuery(product, deferredQuery))
    .sort((left, right) => productSearchRank(left, deferredQuery) - productSearchRank(right, deferredQuery)
      || left.name.localeCompare(right.name, "vi") || left.sku.localeCompare(right.sku, "vi")),
  [activeCategory, activeProductType, deferredQuery, filters, products, purchaseMode, seriesIndex]);

  const productGroups = useMemo(() => {
    const groupOrder: string[] = [];
    const entries = new Map<string, {
      groupKey: string;
      group: ProductSeriesGroup;
      variants: Product[];
      visibleVariants: Product[];
    }>();

    for (const product of filteredVariants) {
      const groupKey = seriesIndex.groupKeyBySku.get(product.sku) ?? `family:${product.familySku}`;
      let entry = entries.get(groupKey);
      if (!entry) {
        const group = seriesIndex.groupsByKey.get(groupKey);
        if (!group) continue;
        entry = { groupKey, group, variants: group.products, visibleVariants: [] };
        entries.set(groupKey, entry);
        groupOrder.push(groupKey);
      }
      entry.visibleVariants.push(product);
    }

    return groupOrder.flatMap((groupKey) => {
      const entry = entries.get(groupKey);
      return entry ? [entry] : [];
    });
  }, [filteredVariants, seriesIndex]);

  const visibleProductGroups = useMemo(
    () => productGroups.slice(0, visibleGroupCount),
    [productGroups, visibleGroupCount],
  );

  const quickViewProduct = quickViewSku ? products.find((product) => product.sku === quickViewSku) ?? null : null;
  const quickViewGroup = useMemo(() => quickViewProduct ? seriesGroupFor(seriesIndex, quickViewProduct) : null, [quickViewProduct, seriesIndex]);
  const quickRelatedProducts = useMemo(() => quickViewGroup?.products ?? (quickViewProduct
    ? products.filter((product) => product.familySku === quickViewProduct.familySku)
    : []), [products, quickViewGroup, quickViewProduct]);
  const quickViewVariant = quickViewProduct ? productSeriesVariantLabel(quickViewProduct, quickViewGroup) : "";
  const quickViewSize = clean(quickViewProduct?.size);
  const quickViewVariantOptions = useMemo(
    () => distinctProductValues(quickRelatedProducts, (product) => productSeriesVariantLabel(product, quickViewGroup)).filter(Boolean),
    [quickRelatedProducts, quickViewGroup],
  );
  const quickViewVariantProducts = useMemo(
    () => quickViewVariantOptions.length === 0
      ? quickRelatedProducts
      : quickRelatedProducts.filter((product) => productSeriesVariantLabel(product, quickViewGroup) === quickViewVariant),
    [quickRelatedProducts, quickViewGroup, quickViewVariant, quickViewVariantOptions],
  );
  const quickViewSizeOptions = useMemo(
    () => distinctProductValues(quickViewVariantProducts, (product) => clean(product.size)),
    [quickViewVariantProducts],
  );
  const quickViewDimensionProducts = useMemo(
    () => quickViewSizeOptions.length <= 1
      ? quickViewVariantProducts
      : quickViewVariantProducts.filter((product) => clean(product.size) === quickViewSize),
    [quickViewSize, quickViewSizeOptions, quickViewVariantProducts],
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
    const groupKey = seriesIndex.groupKeyBySku.get(product.sku) ?? `family:${product.familySku}`;
    setSelectedSkuByGroup((current) => ({ ...current, [groupKey]: product.sku }));
    setQuickViewQuantity(1);
  }

  function selectCategory(categoryId: string | null) {
    setActiveCategory(categoryId);
    setActiveProductType(null);
    setFilters(EMPTY_FILTERS);
    setVisibleGroupCount(INITIAL_VISIBLE_GROUPS);
  }

  function selectPurchaseMode(mode: PurchaseModeFilter) {
    setPurchaseMode(mode);
    setVisibleGroupCount(INITIAL_VISIBLE_GROUPS);
  }

  function updateFilter(field: keyof CatalogFilters, value: string) {
    setFilters((current) => ({ ...current, [field]: value }));
    setVisibleGroupCount(INITIAL_VISIBLE_GROUPS);
  }

  function updateQuery(value: string) {
    setQuery(value);
    setVisibleGroupCount(INITIAL_VISIBLE_GROUPS);
  }

  return (
    <section className="catalog-screen catalog-screen-compact">
      <label className="catalog-search">
        <Search aria-hidden="true" size={19} /><span className="sr-only">Tìm sản phẩm</span>
        <input autoComplete="off" onChange={(event) => updateQuery(event.target.value)} placeholder="Tên, nhãn hoặc SKU" type="search" value={query} />
        {query ? <button aria-label="Xóa nội dung tìm kiếm" onClick={() => updateQuery("")} type="button"><RotateCcw aria-hidden="true" size={17} /></button> : null}
      </label>

      <div className="catalog-primary-filter-row">
        <div aria-label="Chọn quy cách mua" className="catalog-purchase-mode" role="group">
          {([["all", "Tất cả"], ["retail", "Mua lẻ"], ["case", "Mua thùng"]] as const).map(([mode, label]) => (
            <button aria-pressed={purchaseMode === mode} className={purchaseMode === mode ? "is-active" : ""} key={mode} onClick={() => selectPurchaseMode(mode)} type="button">{label}</button>
          ))}
        </div>
        <details className="catalog-filter-menu">
          <summary><SlidersHorizontal aria-hidden="true" size={17} /><span>Bộ lọc</span>{activeDetailFilterCount > 0 ? <b aria-label={`${activeDetailFilterCount} bộ lọc đang bật`}>{activeDetailFilterCount}</b> : null}</summary>
          <div className="catalog-filter-panel">
            <div className="catalog-filter-panel-heading"><strong>Lọc chi tiết</strong>{activeDetailFilterCount ? <button onClick={() => { setFilters(EMPTY_FILTERS); setVisibleGroupCount(INITIAL_VISIBLE_GROUPS); }} type="button"><X aria-hidden="true" size={15} /> Xóa lọc</button> : null}</div>
            <div className="catalog-filter-grid">
              {([['brand','Nhãn hàng',filterOptions.brands],['flavor','Vị / loại',filterOptions.flavors],['size','Size',filterOptions.sizes]] as const).map(([field,label,options]) => (
                <label key={field}><span>{label}</span><select onChange={(event) => updateFilter(field, event.target.value)} value={filters[field]}><option value="">Tất cả</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
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
          <button aria-pressed={activeProductType === null} className={activeProductType === null ? "is-active" : ""} onClick={() => { setActiveProductType(null); setFilters(EMPTY_FILTERS); setVisibleGroupCount(INITIAL_VISIBLE_GROUPS); }} type="button">Tất cả</button>
          {productTypeOptions.map((productType) => <button aria-pressed={activeProductType === productType} className={activeProductType === productType ? "is-active" : ""} key={productType} onClick={() => { setActiveProductType(productType); setFilters(EMPTY_FILTERS); setVisibleGroupCount(INITIAL_VISIBLE_GROUPS); }} type="button">{productType}</button>)}
        </div>
      </div> : null}

      {catalogError ? <div className="catalog-state-card is-error" role="alert"><PackageSearch aria-hidden="true" size={28} /><strong>Chưa tải được sản phẩm</strong><span>{catalogError}</span></div>
        : !loaded ? <div aria-label="Đang tải sản phẩm" className="catalog-grid">{Array.from({ length: 4 }, (_, index) => <div className="catalog-product-card is-skeleton" key={index}><span /><span /><span /></div>)}</div>
        : productGroups.length === 0 ? <div className="catalog-state-card"><PackageSearch aria-hidden="true" size={30} /><strong>Không tìm thấy sản phẩm</strong></div>
        : <>
          <div className="catalog-grid">{visibleProductGroups.map(({ groupKey, group, variants, visibleVariants }) => {
            const selected = chooseGroupPreferred(visibleVariants.length > 0 ? visibleVariants : variants, selectedSkuByGroup[groupKey], purchaseMode);
            const familyVariants = variants.filter((product) => product.familySku === selected.familySku);
            const retail = familyVariants.find((variant) => variant.purchaseMode === "retail") ?? null;
            const caseVariant = familyVariants.find((variant) => variant.purchaseMode === "case") ?? null;
            const canOrder = selected.availability === "available";
            const variantCount = distinctProductValues(variants, (product) => productSeriesVariantLabel(product, group)).filter(Boolean).length;
            const sizeCount = distinctProductValues(variants, (product) => clean(product.size)).filter(Boolean).length;
            const selectedVariant = productSeriesVariantLabel(selected, group);
            const productSubtitle = [
              selected.productType,
              variantCount > 1 ? `${variantCount} vị / loại` : selectedVariant,
              sizeCount > 1 ? `${sizeCount} size` : productSizeLabel(selected),
            ].filter(Boolean).join(" · ");
            return <article className="catalog-product-card catalog-product-card-compact catalog-family-card" key={groupKey}>
              <button className="catalog-product-main" onClick={(event) => openQuickView(selected, event.currentTarget)} type="button">
                <ProductVisual product={selected} />
                <div className="catalog-product-copy catalog-product-copy-compact">
                  <div className="catalog-product-meta"><span>{selected.brand}</span><span className={`availability-${selected.availability}`}>{availabilityLabel(selected)}</span></div>
                  <h2>{group.name}</h2>
                  <span className="catalog-family-subtitle">{productSubtitle || selected.packaging}</span>
                </div>
              </button>
              <div className="catalog-family-footer">
                <div className="catalog-family-purchase">
                  <strong className="catalog-card-price">{formatPrice(selected)}</strong>
                  <div className="catalog-price-columns" aria-label={`Chọn mua lẻ hoặc thùng ${group.name}`}>
                    {retail ? <button aria-pressed={selected.sku === retail.sku} className={selected.sku === retail.sku ? "catalog-price-cell is-active" : "catalog-price-cell"} onClick={() => setSelectedSkuByGroup((current) => ({ ...current, [groupKey]: retail.sku }))} type="button"><span>Lẻ</span></button> : <div className="catalog-price-cell is-missing"><span>Lẻ</span></div>}
                    {caseVariant ? <button aria-pressed={selected.sku === caseVariant.sku} className={selected.sku === caseVariant.sku ? "catalog-price-cell is-active" : "catalog-price-cell"} onClick={() => setSelectedSkuByGroup((current) => ({ ...current, [groupKey]: caseVariant.sku }))} type="button"><span>Thùng</span></button> : <div className="catalog-price-cell is-missing"><span>Thùng</span></div>}
                  </div>
                </div>
                <button aria-label={`Thêm ${selected.name} vào giỏ`} className="catalog-add-icon" disabled={!canOrder} onClick={() => void addProduct(selected)} type="button">{addedSku === selected.sku ? <Check aria-hidden="true" size={19} /> : <><Plus aria-hidden="true" size={14} /><ShoppingCart aria-hidden="true" size={18} /></>}</button>
              </div>
            </article>;
          })}</div>
          {visibleGroupCount < productGroups.length ? <button className="primary-button" onClick={() => setVisibleGroupCount((current) => Math.min(productGroups.length, current + LOAD_MORE_GROUPS))} style={{ marginTop: 12, width: "100%" }} type="button">
            Xem thêm {Math.min(LOAD_MORE_GROUPS, productGroups.length - visibleGroupCount)} sản phẩm
          </button> : null}
        </>}

      {portalReady && quickViewProduct ? createPortal(<div className="product-quick-view-backdrop" onClick={() => setQuickViewSku(null)} role="presentation">
        <section aria-label={`Chi tiết ${quickViewProduct.name}`} aria-modal="true" className="product-quick-view product-quick-view-tall" onClick={(event) => event.stopPropagation()} ref={quickViewDialogRef} role="dialog" tabIndex={-1}>
          <button aria-label="Đóng chi tiết sản phẩm" className="product-quick-view-close" onClick={() => setQuickViewSku(null)} ref={quickViewCloseRef} type="button"><X aria-hidden="true" size={20} /></button>
          <ProductVisual product={quickViewProduct} />
          <div className="product-quick-view-copy">
            <div className="catalog-product-meta"><span>{quickViewProduct.sku}</span><span className={`availability-${quickViewProduct.availability}`}>{availabilityLabel(quickViewProduct)}</span></div>
            <p className="product-quick-view-brand">{quickViewProduct.brand}</p>
            <h2>{quickViewGroup?.name ?? quickViewProduct.productType}</h2>
            <strong className="product-quick-view-name">{quickViewProduct.name}</strong>

            {quickViewVariantOptions.length > 1 ? <div className="product-choice-block"><span>Vị / loại</span><div className="product-choice-chips" role="group" aria-label="Chọn vị hoặc loại">{quickViewVariantOptions.map((variant) => <button aria-pressed={variant === quickViewVariant} className={variant === quickViewVariant ? "is-active" : ""} key={variant} onClick={() => selectQuickProduct(choosePreferred(quickRelatedProducts.filter((product) => productSeriesVariantLabel(product, quickViewGroup) === variant), quickViewProduct))} type="button">{variant}</button>)}</div></div> : null}

            {quickViewSizeOptions.length > 1 ? <div className="product-choice-block"><span>Dung tích / size</span><div className="product-choice-chips" role="group" aria-label="Chọn dung tích hoặc size">{quickViewSizeOptions.map((size) => {
              const candidates = quickViewVariantProducts.filter((product) => clean(product.size) === size);
              const representative = candidates[0];
              return <button aria-pressed={size === quickViewSize} className={size === quickViewSize ? "is-active" : ""} key={size || "default"} onClick={() => selectQuickProduct(choosePreferred(candidates, quickViewProduct))} type="button">{representative ? productSizeLabel(representative) || size || "Mặc định" : size || "Mặc định"}</button>;
            })}</div></div> : null}

            {quickViewPurchaseModes.length > 1 ? <div className="product-choice-block"><span>Mua</span><div className="product-choice-chips product-choice-mode" role="group" aria-label="Chọn mua lẻ hoặc thùng">{quickViewPurchaseModes.map((mode) => <button aria-pressed={mode === quickViewProduct.purchaseMode} className={mode === quickViewProduct.purchaseMode ? "is-active" : ""} key={mode} onClick={() => selectQuickProduct(choosePreferred(quickViewDimensionProducts.filter((product) => product.purchaseMode === mode), quickViewProduct))} type="button">{purchaseModeLabel(mode)}</button>)}</div></div> : null}

            {quickViewExactCandidates.length > 1 ? <div className="product-choice-block"><span>SKU</span><div className="product-choice-chips product-choice-sku" role="group" aria-label="Chọn SKU chính xác">{quickViewExactCandidates.map((product) => <button aria-pressed={product.sku === quickViewProduct.sku} className={product.sku === quickViewProduct.sku ? "is-active" : ""} key={product.sku} onClick={() => selectQuickProduct(product)} type="button">{product.sku}</button>)}</div></div> : null}

            <dl className="product-quick-view-specs"><div><dt>Quy cách</dt><dd>{quickViewProduct.packaging}</dd></div><div><dt>Size</dt><dd>{productSizeLabel(quickViewProduct) || "—"}</dd></div><div><dt>Vị / loại</dt><dd>{quickViewVariant || "—"}</dd></div><div><dt>SKU</dt><dd>{quickViewProduct.sku}</dd></div></dl>
            <div className="product-quick-view-price-pair" aria-label="Giá lẻ và giá thùng"><div><span>Giá lẻ</span><strong>{formatPrice(quickViewRetail)}</strong></div><div><span>Giá thùng</span><strong>{formatPrice(quickViewCase)}</strong></div></div>
            <div className="product-quick-view-order"><div className="quantity-stepper"><button aria-label="Giảm số lượng" disabled={quickViewQuantity <= 1} onClick={() => setQuickViewQuantity((current) => Math.max(1, current - 1))} type="button"><Minus aria-hidden="true" size={17} /></button><output>{quickViewQuantity}</output><button aria-label="Tăng số lượng" disabled={quickViewQuantity >= 99} onClick={() => setQuickViewQuantity((current) => Math.min(99, current + 1))} type="button"><Plus aria-hidden="true" size={17} /></button></div><button className="product-quick-view-add" disabled={quickViewProduct.availability !== "available"} onClick={() => void addProduct(quickViewProduct, quickViewQuantity)} type="button"><ShoppingCart aria-hidden="true" size={18} />{addedSku === quickViewProduct.sku ? "Đã thêm" : `Thêm ${purchaseModeLabel(quickViewProduct.purchaseMode).toLowerCase()} vào giỏ`}</button></div>
          </div>
        </section>
      </div>, document.body) : null}
    </section>
  );
}
