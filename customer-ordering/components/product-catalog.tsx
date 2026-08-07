"use client";

import Link from "next/link";
import { ArrowRight, PackageSearch, Plus, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
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
  if (product.price.status !== "available" || product.price.amount === null) return "Giá theo bảng khách hàng";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: product.price.currency, maximumFractionDigits: 0 }).format(product.price.amount);
}
function availabilityLabel(product: Product): string {
  if (product.availability === "out_of_stock") return "Tạm hết hàng";
  if (product.availability === "paused") return "Tạm ngưng";
  return "Đang bán";
}
function purchaseModeLabel(mode: PurchaseMode): string { return mode === "case" ? "Mua thùng" : "Mua lẻ"; }
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

  useEffect(() => {
    let cancelled = false;
    void Promise.all([service.listCategories(), service.listProducts()])
      .then(([categoryItems, productItems]) => {
        if (!cancelled) { setCategories(categoryItems); setProducts(productItems); setCatalogError(""); setLoaded(true); }
      })
      .catch(() => { if (!cancelled) { setCatalogError("Không tải được danh mục sản phẩm."); setLoaded(true); } });
    return () => { cancelled = true; };
  }, [service]);

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
    return [...groups.entries()].map(([familySku, variants]) => {
      const ordered = [...variants].sort((a, b) => a.purchaseMode === b.purchaseMode ? a.sku.localeCompare(b.sku) : a.purchaseMode === "retail" ? -1 : 1);
      const selectedSku = selectedVariantByFamily[familySku];
      const selected = ordered.find((variant) => variant.sku === selectedSku)
        ?? ordered.find((variant) => variant.purchaseMode === "retail") ?? ordered[0];
      return { familySku, variants: ordered, selected };
    });
  }, [filteredVariants, selectedVariantByFamily]);

  async function addOne(product: Product) {
    if (product.availability !== "available") return;
    const cart = await service.getCart();
    const existing = cart.lines.find((line) => line.sku === product.sku);
    const lines = existing
      ? cart.lines.map((line) => line.sku === product.sku ? { ...line, quantity: Math.min(999, line.quantity + 1) } : line)
      : [...cart.lines, { sku: product.sku, quantity: 1 }];
    await service.saveCart({ lines, updatedAt: new Date().toISOString() });
    announceCartUpdated();
    setAddedSku(product.sku);
    window.setTimeout(() => setAddedSku((current) => current === product.sku ? null : current), 1600);
  }

  return (
    <section className="catalog-screen">
      <div className="catalog-intro"><div><p className="eyebrow">Nguyên liệu Hưng Phát</p><h1>Danh mục sản phẩm</h1><p>Tìm theo tên hoặc SKU; chọn ngành và quy cách mua khi cần.</p></div><span className="catalog-count">{productFamilies.length} sản phẩm</span></div>
      <label className="catalog-search">
        <Search aria-hidden="true" size={19} /><span className="sr-only">Tìm sản phẩm</span>
        <input autoComplete="off" onChange={(event) => setQuery(event.target.value)} placeholder="Tên hoặc SKU, ví dụ 12345 / mã thùng..." type="search" value={query} />
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
            <div className="catalog-filter-panel-heading"><div><strong>Lọc chi tiết</strong><span>Chỉ mở khi cần thu hẹp danh sách.</span></div>{activeDetailFilterCount ? <button onClick={() => setFilters(EMPTY_FILTERS)} type="button"><X aria-hidden="true" size={15} /> Xóa lọc</button> : null}</div>
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
        : productFamilies.length === 0 ? <div className="catalog-state-card"><PackageSearch aria-hidden="true" size={30} /><strong>Không tìm thấy sản phẩm</strong><span>Thử tên khác, SKU khác hoặc xóa bớt bộ lọc.</span></div>
        : <div className="catalog-grid">{productFamilies.map(({ familySku, variants, selected }) => {
          const canOrder = selected.availability === "available";
          return <article className="catalog-product-card" key={familySku}>
            <Link className="catalog-product-link" href={`/products/${encodeURIComponent(selected.sku)}`}>
              <ProductVisual product={selected} />
              <div className="catalog-product-copy"><div className="catalog-product-meta"><span>{selected.sku}</span><span className={`availability-${selected.availability}`}>{availabilityLabel(selected)}</span></div><div className="catalog-product-heading-row"><h2>{selected.name}</h2><span className={`purchase-badge is-${selected.purchaseMode}`}>{purchaseModeLabel(selected.purchaseMode)}</span></div><p>{selected.brand} · {selected.productType}</p><small className="catalog-product-spec">{[selected.flavor, selected.size].filter(Boolean).join(" · ")}</small><strong className={selected.price.status === "available" ? "" : "is-pending"}>{formatPrice(selected)}</strong><span className="catalog-detail-link">Xem chi tiết <ArrowRight aria-hidden="true" size={15} /></span></div>
            </Link>
            {purchaseMode === "all" && variants.length > 1 ? <div aria-label={`Chọn quy cách ${selected.name}`} className="catalog-variant-switch" role="group">{variants.map((variant) => <button aria-pressed={variant.sku === selected.sku} className={variant.sku === selected.sku ? "is-active" : ""} key={variant.sku} onClick={() => setSelectedVariantByFamily((current) => ({ ...current, [familySku]: variant.sku }))} type="button">{purchaseModeLabel(variant.purchaseMode)}</button>)}</div> : null}
            <button aria-label={`Thêm một ${selected.unit} ${selected.name} vào giỏ`} className="catalog-add-button" disabled={!canOrder} onClick={() => void addOne(selected)} type="button"><Plus aria-hidden="true" size={18} />{addedSku === selected.sku ? "Đã thêm" : canOrder ? "Thêm giỏ" : availabilityLabel(selected)}</button>
          </article>;
        })}</div>}
    </section>
  );
}
