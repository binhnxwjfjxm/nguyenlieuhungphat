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
import {
  distinctProductValues,
  groupProductChoices,
  groupProductChoicesByBrand,
  productChoiceGroupKey,
  productDisplayBrand,
  productDisplayType,
  productFlavorValue,
  productSizeLabel,
  productSizeValue,
  productVariantSummary,
} from "@/lib/product-grouping";

type PurchaseModeFilter = "all" | PurchaseMode;
interface CatalogFilters { brand: string; productType: string; flavor: string; size: string; }
const EMPTY_FILTERS: CatalogFilters = { brand: "", productType: "", flavor: "", size: "" };

function formatPrice(product: Product): string {
  if (product.price.status !== "available" || product.price.amount === null) return "Chờ giá";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: product.price.currency, maximumFractionDigits: 0 }).format(product.price.amount);
}
function availabilityLabel(product: Product): string {
  if (product.availability === "out_of_stock") return "Hết hàng";
  if (product.availability === "paused") return "Tạm ngưng";
  return "Đang bán";
}
function purchaseModeLabel(mode: PurchaseMode): string { return mode === "case" ? "Thùng" : "Lẻ"; }
function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
}
function choosePreferred(candidates: Product[], current: Product | null): Product | null {
  if (candidates.length === 0) return null;
  if (!current) return candidates.find((product) => product.purchaseMode === "retail") ?? candidates[0];
  return candidates.find((product) => product.sku === current.sku)
    ?? candidates.find((product) => product.purchaseMode === current.purchaseMode && productSizeValue(product) === productSizeValue(current))
    ?? candidates.find((product) => product.purchaseMode === current.purchaseMode)
    ?? candidates.find((product) => product.purchaseMode === "retail")
    ?? candidates[0];
}

export function ProductCatalog() {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [purchaseMode, setPurchaseMode] = useState<PurchaseModeFilter>("all");
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_FILTERS);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [loaded, setLoaded] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [addedSku, setAddedSku] = useState<string | null>(null);
  const [selectedSkuByGroup, setSelectedSkuByGroup] = useState<Record<string, string>>({});
  const [quickViewGroupKey, setQuickViewGroupKey] = useState<string | null>(null);
  const [quickViewSku, setQuickViewSku] = useState<string | null>(null);
  const [quickViewQuantity, setQuickViewQuantity] = useState(1);
  const quickViewDialogRef = useRef<HTMLElement | null>(null);
  const quickViewCloseRef = useRef<HTMLButtonElement | null>(null);
  const quickViewOpenerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([service.listCategories(), service.listProducts()])
      .then(([categoryItems, productItems]) => {
        if (!cancelled) { setCategories(categoryItems); setProducts(productItems); setCatalogError(""); setLoaded(true); }
      })
      .catch(() => { if (!cancelled) { setCatalogError("Không tải được danh mục sản phẩm."); setLoaded(true); } });
    return () => { cancelled = true; };
  }, [service]);

  useEffect(() => {
    if (!quickViewGroupKey) return;
    const previousOverflow = document.body.style.overflow;
    const opener = quickViewOpenerRef.current;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => quickViewCloseRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setQuickViewGroupKey(null);
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = quickViewDialogRef.current;
      if (!dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter((element) => !element.hasAttribute("hidden"));
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
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
  }, [quickViewGroupKey]);

  const filterOptions = useMemo(() => ({
    brands: unique(products.map((product) => productDisplayBrand(product, categories))),
    productTypes: unique(products.map((product) => productDisplayType(product, categories))),
    flavors: unique(products.map((product) => productFlavorValue(product, categories))),
    sizes: unique(products.map(productSizeLabel)),
  }), [categories, products]);
  const activeDetailFilterCount = Object.values(filters).filter(Boolean).length;

  const filteredVariants = useMemo(() => products
    .filter((product) => !activeCategory || product.categoryId === activeCategory)
    .filter((product) => purchaseMode === "all" || product.purchaseMode === purchaseMode)
    .filter((product) => !filters.brand || productDisplayBrand(product, categories) === filters.brand)
    .filter((product) => !filters.productType || productDisplayType(product, categories) === filters.productType)
    .filter((product) => !filters.flavor || productFlavorValue(product, categories) === filters.flavor)
    .filter((product) => !filters.size || productSizeLabel(product) === filters.size)
    .filter((product) => productMatchesQuery(product, deferredQuery))
    .sort((left, right) => productSearchRank(left, deferredQuery) - productSearchRank(right, deferredQuery)
      || left.name.localeCompare(right.name, "vi") || left.sku.localeCompare(right.sku)),
  [activeCategory, categories, deferredQuery, filters, products, purchaseMode]);

  const productGroups = useMemo(() => groupProductChoices(filteredVariants, categories), [categories, filteredVariants]);
  const brandSections = useMemo(() => groupProductChoicesByBrand(productGroups), [productGroups]);
  const quickViewProducts = useMemo(() => quickViewGroupKey
    ? filteredVariants.filter((product) => productChoiceGroupKey(product, categories) === quickViewGroupKey)
    : [], [categories, filteredVariants, quickViewGroupKey]);
  const quickViewProduct = quickViewProducts.find((product) => product.sku === quickViewSku)
    ?? quickViewProducts.find((product) => product.purchaseMode === "retail")
    ?? quickViewProducts[0]
    ?? null;

  const quickViewFlavorOptions = useMemo(() => distinctProductValues(quickViewProducts, (product) => productFlavorValue(product, categories)), [categories, quickViewProducts]);
  const quickViewFlavor = quickViewProduct ? productFlavorValue(quickViewProduct, categories) : "";
  const quickViewFlavorProducts = useMemo(() => quickViewProducts.filter((product) => productFlavorValue(product, categories) === quickViewFlavor), [categories, quickViewFlavor, quickViewProducts]);
  const quickViewSizeOptions = useMemo(() => distinctProductValues(quickViewFlavorProducts, productSizeValue), [quickViewFlavorProducts]);
  const quickViewSize = quickViewProduct ? productSizeValue(quickViewProduct) : "";
  const quickViewDimensionProducts = useMemo(() => quickViewFlavorProducts.filter((product) => productSizeValue(product) === quickViewSize), [quickViewFlavorProducts, quickViewSize]);
  const quickViewPurchaseModes = useMemo(() => [...new Set(quickViewDimensionProducts.map((product) => product.purchaseMode))], [quickViewDimensionProducts]);
  const quickViewExactCandidates = useMemo(() => quickViewProduct
    ? quickViewDimensionProducts.filter((product) => product.purchaseMode === quickViewProduct.purchaseMode)
    : [], [quickViewDimensionProducts, quickViewProduct]);

  function selectQuickProduct(product: Product | null) {
    if (!product) return;
    const groupKey = productChoiceGroupKey(product, categories);
    setQuickViewSku(product.sku);
    setSelectedSkuByGroup((current) => ({ ...current, [groupKey]: product.sku }));
    setQuickViewQuantity(1);
  }

  function openQuickView(product: Product, opener: HTMLElement) {
    const key = productChoiceGroupKey(product, categories);
    quickViewOpenerRef.current = opener;
    setQuickViewGroupKey(key);
    setQuickViewSku(product.sku);
    setSelectedSkuByGroup((current) => ({ ...current, [key]: product.sku }));
    setQuickViewQuantity(1);
  }

  async function addProduct(product: Product, quantity = 1) {
    if (product.availability !== "available") return;
    const cart = await service.getCart();
    const existing = cart.lines.find((line) => line.sku === product.sku);
    const lines = existing
      ? cart.lines.map((line) => line.sku === product.sku ? { ...line, quantity: Math.min(999, line.quantity + quantity) } : line)
      : [...cart.lines, { sku: product.sku, quantity }];
    await service.saveCart({ lines, updatedAt: new Date().toISOString() });
    announceCartUpdated();
    setAddedSku(product.sku);
    window.setTimeout(() => setAddedSku((current) => current === product.sku ? null : current), 1400);
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
            <div className="catalog-filter-panel-heading"><strong>Lọc sản phẩm</strong>{activeDetailFilterCount ? <button onClick={() => setFilters(EMPTY_FILTERS)} type="button"><X aria-hidden="true" size={15} /> Xóa lọc</button> : null}</div>
            <div className="catalog-filter-grid">
              {([['brand','Nhãn hàng',filterOptions.brands],['productType','Loại',filterOptions.productTypes],['flavor','Vị',filterOptions.flavors],['size','Dung tích / size',filterOptions.sizes]] as const).map(([field,label,options]) => (
                <label key={field}><span>{label}</span><select onChange={(event) => setFilters((current) => ({ ...current, [field]: event.target.value }))} value={filters[field]}><option value="">Tất cả</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
              ))}
            </div>
          </div>
        </details>
      </div>

      <div aria-label="Lọc theo ngành sản phẩm" className="catalog-category-row" role="tablist">
        <button aria-selected={activeCategory === null} className={activeCategory === null ? "is-active" : ""} onClick={() => setActiveCategory(null)} role="tab" type="button">Tất cả ngành</button>
        {categories.map((category) => <button aria-selected={activeCategory === category.id} className={activeCategory === category.id ? "is-active" : ""} key={category.id} onClick={() => setActiveCategory(category.id)} role="tab" type="button">{category.shortName}</button>)}
      </div>

      {catalogError ? <div className="catalog-state-card is-error" role="alert"><PackageSearch aria-hidden="true" size={28} /><strong>Chưa tải được sản phẩm</strong><span>{catalogError}</span></div>
        : !loaded ? <div aria-label="Đang tải sản phẩm" className="catalog-grid">{Array.from({ length: 4 }, (_, index) => <div className="catalog-product-card is-skeleton" key={index}><span /><span /><span /></div>)}</div>
        : productGroups.length === 0 ? <div className="catalog-state-card"><PackageSearch aria-hidden="true" size={30} /><strong>Không tìm thấy sản phẩm</strong></div>
        : <div className="catalog-brand-list">{brandSections.map((brandSection) => (
          <section className="catalog-brand-section" key={brandSection.brand}>
            <div className="catalog-brand-heading"><strong>{brandSection.brand}</strong><span>{brandSection.groups.length} loại</span></div>
            <div className="catalog-grid catalog-brand-grid">{brandSection.groups.map((group) => {
              const selectedSku = selectedSkuByGroup[group.key];
              const selected = group.products.find((product) => product.sku === selectedSku)
                ?? group.products.find((product) => product.purchaseMode === "retail")
                ?? group.products[0];
              const familyVariants = group.products.filter((product) => product.familySku === selected.familySku);
              const canOrder = selected.availability === "available";
              const hasChoices = new Set(group.products.map((product) => product.familySku)).size > 1;
              return <article className="catalog-product-card catalog-product-card-compact catalog-group-card" key={group.key}>
                <button className="catalog-product-main" onClick={(event) => openQuickView(selected, event.currentTarget)} type="button">
                  <ProductVisual product={selected} />
                  <div className="catalog-product-copy catalog-product-copy-compact">
                    <div className="catalog-product-meta"><span>{selected.sku}</span><span className={`availability-${selected.availability}`}>{availabilityLabel(selected)}</span></div>
                    <h2>{group.productType}</h2>
                    <span className="catalog-group-variant-line">{productVariantSummary(selected, categories)}</span>
                    <strong className={selected.price.status === "available" ? "" : "is-pending"}>{formatPrice(selected)}</strong>
                  </div>
                </button>
                <div className="catalog-card-action-row">
                  <div aria-label={`Chọn quy cách ${group.productType}`} className="catalog-variant-switch catalog-variant-switch-inline" role="group">
                    {familyVariants.map((variant) => <button aria-pressed={variant.sku === selected.sku} className={variant.sku === selected.sku ? "is-active" : ""} key={variant.sku} onClick={() => setSelectedSkuByGroup((current) => ({ ...current, [group.key]: variant.sku }))} type="button">{purchaseModeLabel(variant.purchaseMode)}</button>)}
                  </div>
                  <button aria-label={hasChoices ? `Chọn vị và quy cách ${group.productType}` : `Thêm ${selected.name} vào giỏ`} className="catalog-add-icon" disabled={!canOrder} onClick={(event) => hasChoices ? openQuickView(selected, event.currentTarget) : void addProduct(selected)} type="button">{addedSku === selected.sku ? <Check aria-hidden="true" size={19} /> : <><Plus aria-hidden="true" size={14} /><ShoppingCart aria-hidden="true" size={18} /></>}</button>
                </div>
              </article>;
            })}</div>
          </section>
        ))}</div>}

      {quickViewProduct ? <div className="product-quick-view-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setQuickViewGroupKey(null); }} role="presentation">
        <section aria-label={`Chi tiết ${quickViewProduct.name}`} aria-modal="true" className="product-quick-view product-quick-view-tall" ref={quickViewDialogRef} role="dialog" tabIndex={-1}>
          <button aria-label="Đóng chi tiết sản phẩm" className="product-quick-view-close" onClick={() => setQuickViewGroupKey(null)} ref={quickViewCloseRef} type="button"><X aria-hidden="true" size={20} /></button>
          <ProductVisual product={quickViewProduct} />
          <div className="product-quick-view-copy">
            <div className="catalog-product-meta"><span>{quickViewProduct.sku}</span><span className={`availability-${quickViewProduct.availability}`}>{availabilityLabel(quickViewProduct)}</span></div>
            <p className="product-quick-view-brand">{productDisplayBrand(quickViewProduct, categories)}</p>
            <h2>{productDisplayType(quickViewProduct, categories)}</h2>
            <strong className="product-quick-view-name">{quickViewProduct.name}</strong>

            {quickViewFlavorOptions.length > 1 ? <div className="product-choice-block"><span>Vị</span><div className="product-choice-chips" role="group" aria-label="Chọn vị">{quickViewFlavorOptions.map((flavor) => <button aria-pressed={flavor === quickViewFlavor} className={flavor === quickViewFlavor ? "is-active" : ""} key={flavor || "default"} onClick={() => selectQuickProduct(choosePreferred(quickViewProducts.filter((product) => productFlavorValue(product, categories) === flavor), quickViewProduct))} type="button">{flavor || "Không vị"}</button>)}</div></div> : null}

            {quickViewSizeOptions.length > 1 ? <div className="product-choice-block"><span>Dung tích / size</span><div className="product-choice-chips" role="group" aria-label="Chọn dung tích hoặc size">{quickViewSizeOptions.map((size) => {
              const representative = quickViewFlavorProducts.find((product) => productSizeValue(product) === size);
              return <button aria-pressed={size === quickViewSize} className={size === quickViewSize ? "is-active" : ""} key={size || "default"} onClick={() => selectQuickProduct(choosePreferred(quickViewFlavorProducts.filter((product) => productSizeValue(product) === size), quickViewProduct))} type="button">{representative ? productSizeLabel(representative) : size || "Mặc định"}</button>;
            })}</div></div> : null}

            {quickViewPurchaseModes.length > 1 ? <div className="product-choice-block"><span>Mua</span><div className="product-choice-chips product-choice-mode" role="group" aria-label="Chọn mua lẻ hoặc thùng">{quickViewPurchaseModes.map((mode) => <button aria-pressed={mode === quickViewProduct.purchaseMode} className={mode === quickViewProduct.purchaseMode ? "is-active" : ""} key={mode} onClick={() => selectQuickProduct(choosePreferred(quickViewDimensionProducts.filter((product) => product.purchaseMode === mode), quickViewProduct))} type="button">{purchaseModeLabel(mode)}</button>)}</div></div> : null}

            {quickViewExactCandidates.length > 1 ? <div className="product-choice-block"><span>SKU</span><div className="product-choice-chips product-choice-sku" role="group" aria-label="Chọn SKU chính xác">{quickViewExactCandidates.map((product) => <button aria-pressed={product.sku === quickViewProduct.sku} className={product.sku === quickViewProduct.sku ? "is-active" : ""} key={product.sku} onClick={() => selectQuickProduct(product)} type="button">{product.sku}</button>)}</div></div> : null}

            <dl className="product-quick-view-specs"><div><dt>Quy cách</dt><dd>{quickViewProduct.packaging}</dd></div><div><dt>Size</dt><dd>{productSizeLabel(quickViewProduct) || "—"}</dd></div><div><dt>Vị</dt><dd>{productFlavorValue(quickViewProduct, categories) || "—"}</dd></div><div><dt>SKU</dt><dd>{quickViewProduct.sku}</dd></div></dl>
            <div className="product-quick-view-price"><span>{quickViewProduct.purchaseMode === "case" ? "Giá thùng" : "Giá lẻ"}</span><strong>{formatPrice(quickViewProduct)}</strong></div>
            <div className="product-quick-view-order"><div className="quantity-stepper"><button aria-label="Giảm số lượng" disabled={quickViewQuantity <= 1} onClick={() => setQuickViewQuantity((current) => Math.max(1, current - 1))} type="button"><Minus aria-hidden="true" size={17} /></button><output>{quickViewQuantity}</output><button aria-label="Tăng số lượng" disabled={quickViewQuantity >= 99} onClick={() => setQuickViewQuantity((current) => Math.min(99, current + 1))} type="button"><Plus aria-hidden="true" size={17} /></button></div><button className="product-quick-view-add" disabled={quickViewProduct.availability !== "available"} onClick={() => void addProduct(quickViewProduct, quickViewQuantity)} type="button"><ShoppingCart aria-hidden="true" size={18} />{addedSku === quickViewProduct.sku ? "Đã thêm" : "Thêm vào giỏ"}</button></div>
          </div>
        </section>
      </div> : null}
    </section>
  );
}
