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
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ProductVisual } from "@/components/product-visual";
import { announceCartUpdated } from "@/lib/cart-events";
import { productMatchesQuery, productSearchRank } from "@/lib/catalog-search";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { Category, Product, PurchaseMode } from "@/lib/contracts";

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
function unique(values: Array<string | null>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())))].sort((a, b) => a.localeCompare(b, "vi"));
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
  const [selectedVariantByFamily, setSelectedVariantByFamily] = useState<Record<string, string>>({});
  const [quickViewFamily, setQuickViewFamily] = useState<string | null>(null);
  const [quickViewQuantity, setQuickViewQuantity] = useState(1);

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
    if (!quickViewFamily) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setQuickViewFamily(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [quickViewFamily]);

  const filterOptions = useMemo(() => ({
    brands: unique(products.map((product) => product.brand)),
    productTypes: unique(products.map((product) => product.productType)),
    flavors: unique(products.map((product) => product.flavor)),
    sizes: unique(products.map((product) => product.size)),
  }), [products]);
  const activeDetailFilterCount = Object.values(filters).filter(Boolean).length;

  const filteredVariants = useMemo(() => products
    .filter((product) => !activeCategory || product.categoryId === activeCategory)
    .filter((product) => purchaseMode === "all" || product.purchaseMode === purchaseMode)
    .filter((product) => !filters.brand || product.brand === filters.brand)
    .filter((product) => !filters.productType || product.productType === filters.productType)
    .filter((product) => !filters.flavor || product.flavor === filters.flavor)
    .filter((product) => !filters.size || product.size === filters.size)
    .filter((product) => productMatchesQuery(product, deferredQuery))
    .sort((left, right) => productSearchRank(left, deferredQuery) - productSearchRank(right, deferredQuery)
      || left.name.localeCompare(right.name, "vi") || left.sku.localeCompare(right.sku)),
  [activeCategory, deferredQuery, filters, products, purchaseMode]);

  const productFamilies = useMemo(() => {
    const groups = new Map<string, Product[]>();
    for (const product of filteredVariants) groups.set(product.familySku, [...(groups.get(product.familySku) ?? []), product]);
    return [...groups.entries()].map(([familySku, visibleVariants]) => {
      const allVariants = products.filter((product) => product.familySku === familySku)
        .sort((a, b) => a.purchaseMode === b.purchaseMode ? a.sku.localeCompare(b.sku) : a.purchaseMode === "retail" ? -1 : 1);
      const selectedSku = selectedVariantByFamily[familySku];
      const selected = allVariants.find((variant) => variant.sku === selectedSku)
        ?? visibleVariants.find((variant) => variant.purchaseMode === "retail")
        ?? visibleVariants[0]
        ?? allVariants[0];
      return { familySku, allVariants, selected };
    });
  }, [filteredVariants, products, selectedVariantByFamily]);

  const quickViewVariants = useMemo(() => quickViewFamily
    ? products.filter((product) => product.familySku === quickViewFamily)
      .sort((a, b) => a.purchaseMode === b.purchaseMode ? a.sku.localeCompare(b.sku) : a.purchaseMode === "retail" ? -1 : 1)
    : [], [products, quickViewFamily]);
  const quickViewProduct = quickViewVariants.find((variant) => variant.sku === selectedVariantByFamily[quickViewFamily ?? ""])
    ?? quickViewVariants.find((variant) => variant.purchaseMode === "retail")
    ?? quickViewVariants[0]
    ?? null;

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
        <input autoComplete="off" onChange={(event) => setQuery(event.target.value)} placeholder="Tên hoặc SKU" type="search" value={query} />
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
              {([['brand','Thương hiệu',filterOptions.brands],['productType','Loại',filterOptions.productTypes],['flavor','Vị',filterOptions.flavors],['size','Size',filterOptions.sizes]] as const).map(([field,label,options]) => (
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
        : productFamilies.length === 0 ? <div className="catalog-state-card"><PackageSearch aria-hidden="true" size={30} /><strong>Không tìm thấy sản phẩm</strong></div>
        : <div className="catalog-grid">{productFamilies.map(({ familySku, allVariants, selected }) => {
          const canOrder = selected.availability === "available";
          const selectableVariants = purchaseMode === "all" ? allVariants : allVariants.filter((variant) => variant.purchaseMode === purchaseMode);
          return <article className="catalog-product-card catalog-product-card-compact" key={familySku}>
            <button className="catalog-product-main" onClick={() => { setQuickViewFamily(familySku); setQuickViewQuantity(1); }} type="button">
              <ProductVisual product={selected} />
              <div className="catalog-product-copy catalog-product-copy-compact">
                <div className="catalog-product-meta"><span>{selected.sku}</span><span className={`availability-${selected.availability}`}>{availabilityLabel(selected)}</span></div>
                <h2>{selected.name}</h2>
                <strong className={selected.price.status === "available" ? "" : "is-pending"}>{formatPrice(selected)}</strong>
              </div>
            </button>
            <div className="catalog-card-action-row">
              <div aria-label={`Chọn quy cách ${selected.name}`} className="catalog-variant-switch catalog-variant-switch-inline" role="group">
                {selectableVariants.map((variant) => <button aria-pressed={variant.sku === selected.sku} className={variant.sku === selected.sku ? "is-active" : ""} key={variant.sku} onClick={() => setSelectedVariantByFamily((current) => ({ ...current, [familySku]: variant.sku }))} type="button">{purchaseModeLabel(variant.purchaseMode)}</button>)}
              </div>
              <button aria-label={`Thêm ${selected.name} vào giỏ`} className="catalog-add-icon" disabled={!canOrder} onClick={() => void addProduct(selected)} type="button">{addedSku === selected.sku ? <Check aria-hidden="true" size={19} /> : <><Plus aria-hidden="true" size={14} /><ShoppingCart aria-hidden="true" size={18} /></>}</button>
            </div>
          </article>;
        })}</div>}

      {quickViewProduct ? <div className="product-quick-view-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setQuickViewFamily(null); }} role="presentation">
        <section aria-label={`Chi tiết ${quickViewProduct.name}`} aria-modal="true" className="product-quick-view" role="dialog">
          <button aria-label="Đóng chi tiết sản phẩm" className="product-quick-view-close" onClick={() => setQuickViewFamily(null)} type="button"><X aria-hidden="true" size={20} /></button>
          <ProductVisual product={quickViewProduct} />
          <div className="product-quick-view-copy">
            <div className="catalog-product-meta"><span>{quickViewProduct.sku}</span><span className={`availability-${quickViewProduct.availability}`}>{availabilityLabel(quickViewProduct)}</span></div>
            <h2>{quickViewProduct.name}</h2>
            <p className="product-detail-brand">{[quickViewProduct.brand, quickViewProduct.productType].filter(Boolean).join(" · ")}</p>
            {quickViewVariants.length > 1 ? <div className="product-quick-view-variants" role="group" aria-label="Chọn mua lẻ hoặc thùng">{quickViewVariants.map((variant) => <button aria-pressed={variant.sku === quickViewProduct.sku} className={variant.sku === quickViewProduct.sku ? "is-active" : ""} key={variant.sku} onClick={() => { setSelectedVariantByFamily((current) => ({ ...current, [variant.familySku]: variant.sku })); setQuickViewQuantity(1); }} type="button"><strong>{purchaseModeLabel(variant.purchaseMode)}</strong><span>{variant.packaging}</span></button>)}</div> : null}
            <dl className="product-quick-view-specs"><div><dt>Quy cách</dt><dd>{quickViewProduct.packaging}</dd></div><div><dt>Size</dt><dd>{quickViewProduct.size || "—"}</dd></div><div><dt>Vị</dt><dd>{quickViewProduct.flavor || "—"}</dd></div><div><dt>SKU</dt><dd>{quickViewProduct.sku}</dd></div></dl>
            <div className="product-quick-view-price"><span>{quickViewProduct.purchaseMode === "case" ? "Giá thùng" : "Giá lẻ"}</span><strong>{formatPrice(quickViewProduct)}</strong></div>
            <div className="product-quick-view-order"><div className="quantity-stepper"><button aria-label="Giảm số lượng" disabled={quickViewQuantity <= 1} onClick={() => setQuickViewQuantity((current) => Math.max(1, current - 1))} type="button"><Minus aria-hidden="true" size={17} /></button><output>{quickViewQuantity}</output><button aria-label="Tăng số lượng" disabled={quickViewQuantity >= 99} onClick={() => setQuickViewQuantity((current) => Math.min(99, current + 1))} type="button"><Plus aria-hidden="true" size={17} /></button></div><button className="product-quick-view-add" disabled={quickViewProduct.availability !== "available"} onClick={() => void addProduct(quickViewProduct, quickViewQuantity)} type="button"><ShoppingCart aria-hidden="true" size={18} />{addedSku === quickViewProduct.sku ? "Đã thêm" : "Thêm vào giỏ"}</button></div>
          </div>
        </section>
      </div> : null}
    </section>
  );
}
