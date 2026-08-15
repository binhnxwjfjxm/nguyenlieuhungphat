"use client";

import { Grid3X3, Layers3, Package, PackageSearch, Plus, RotateCcw, Search, ShoppingBag, Tag } from "lucide-react";
import { memo, useCallback, useDeferredValue, useMemo, useRef, useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { announceCartUpdated } from "@/lib/cart-events";
import { productMatchesQuery, productSearchRank } from "@/lib/catalog-search";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { Category, Product, PurchaseMode } from "@/lib/contracts";
import { distinctProductValues, productSizeLabel } from "@/lib/product-grouping";
import { ProductVisual } from "@/components/product-visual";

type PurchaseModeFilter = "all" | PurchaseMode;

const PURCHASE_FILTERS = [
  { mode: "all", label: "Tất cả", icon: Grid3X3 },
  { mode: "retail", label: "Mua lẻ", icon: ShoppingBag },
  { mode: "case", label: "Mua thùng", icon: Package },
] as const;

function availabilityLabel(product: Product): string {
  if (product.availability === "out_of_stock") return "Tạm hết hàng";
  if (product.availability === "paused") return "Tạm ngưng";
  return "Đang bán";
}

function purchaseModeLabel(mode: PurchaseMode): string {
  return mode === "case" ? "Thùng" : "Lẻ";
}

function formatPrice(product: Product): string {
  if (product.price.status !== "available" || product.price.amount === null) return "Chờ giá";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: product.price.currency,
    maximumFractionDigits: 0,
  }).format(product.price.amount);
}

function filterIndexStyle(index: number): CSSProperties {
  return { "--quick-filter-index": index } as CSSProperties;
}

type QuickOrderProductListProps = {
  products: Product[];
  addingSku: string | null;
  onAddProduct: (product: Product) => void;
};

const QuickOrderProductList = memo(function QuickOrderProductList({
  products,
  addingSku,
  onAddProduct,
}: Readonly<QuickOrderProductListProps>) {
  return <div className="quick-order-list quick-order-direct-list">{products.map((product) => {
    const canOrder = product.availability === "available";
    const busy = addingSku !== null;
    return <article className={`quick-order-row quick-order-direct-row ${canOrder ? "" : "is-disabled"}`} key={product.sku}>
      <div className="quick-product-visual"><ProductVisual compact product={product} /></div>
      <div className="quick-product-copy">
        <div className="quick-product-heading">
          <span>{purchaseModeLabel(product.purchaseMode)}</span>
          {!canOrder ? <span className={`availability-${product.availability}`}>{availabilityLabel(product)}</span> : null}
        </div>
        <h2>{product.name}</h2>
        <div className="quick-product-mode-price"><span>{productSizeLabel(product) || product.packaging}</span><strong>{formatPrice(product)}</strong></div>
      </div>
      <button
        aria-label={`Thêm ${product.name} ${purchaseModeLabel(product.purchaseMode)} vào giỏ`}
        className="catalog-add-icon quick-direct-add"
        disabled={!canOrder || busy}
        onClick={() => onAddProduct(product)}
        type="button"
      ><Plus aria-hidden="true" size={20} /></button>
    </article>;
  })}</div>;
});

export function QuickOrder() {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const addInFlightRef = useRef(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeProductType, setActiveProductType] = useState<string | null>(null);
  const [purchaseMode, setPurchaseMode] = useState<PurchaseModeFilter>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [addError, setAddError] = useState("");
  const [addingSku, setAddingSku] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([service.listCategories(), service.listProducts()])
      .then(([categoryItems, productItems]) => {
        if (cancelled) return;
        setCategories(categoryItems);
        setProducts(productItems);
        setError("");
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Không tải được danh sách đặt nhanh.");
        setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [service]);

  const categoryScope = useMemo(() => products
    .filter((product) => !activeCategory || product.categoryId === activeCategory)
    .filter((product) => purchaseMode === "all" || product.purchaseMode === purchaseMode),
  [activeCategory, products, purchaseMode]);

  const productTypeOptions = useMemo(
    () => distinctProductValues(categoryScope, (product) => product.productType.trim()).filter(Boolean),
    [categoryScope],
  );

  const filteredProducts = useMemo(() => categoryScope
    .filter((product) => !activeProductType || product.productType === activeProductType)
    .filter((product) => productMatchesQuery(product, deferredQuery))
    .sort((left, right) => productSearchRank(left, deferredQuery) - productSearchRank(right, deferredQuery)
      || left.productType.localeCompare(right.productType, "vi")
      || left.name.localeCompare(right.name, "vi")
      || (left.purchaseMode === right.purchaseMode ? 0 : left.purchaseMode === "retail" ? -1 : 1)
      || left.sku.localeCompare(right.sku, "vi")),
  [activeProductType, categoryScope, deferredQuery]);

  const addProductToCart = useCallback(async (product: Product) => {
    if (product.availability !== "available" || addInFlightRef.current) return;
    addInFlightRef.current = true;
    setAddingSku(product.sku);
    setAddError("");
    try {
      const cart = await service.getCart();
      const nextLines = [...cart.lines];
      const existingIndex = nextLines.findIndex((line) => line.sku === product.sku);
      if (existingIndex >= 0) {
        nextLines[existingIndex] = { ...nextLines[existingIndex], quantity: Math.min(999, nextLines[existingIndex].quantity + 1) };
      } else {
        nextLines.push({ sku: product.sku, quantity: 1 });
      }
      await service.saveCart({ lines: nextLines, updatedAt: new Date().toISOString() });
      announceCartUpdated();
    } catch {
      setAddError("Chưa thêm được sản phẩm vào giỏ.");
    } finally {
      addInFlightRef.current = false;
      setAddingSku(null);
    }
  }, [service]);

  function selectCategory(categoryId: string | null) {
    setActiveCategory(categoryId);
    setActiveProductType(null);
  }

  const modeIndex = purchaseMode === "all" ? 0 : purchaseMode === "retail" ? 1 : 2;
  const categoryIndex = activeCategory ? categories.findIndex((category) => category.id === activeCategory) : -1;
  const productTypeIndex = activeProductType ? productTypeOptions.indexOf(activeProductType) + 1 : 0;

  return <section className="quick-order-screen quick-order-screen-compact">
    <label className={`catalog-search quick-order-search quick-order-search-top ${query !== deferredQuery ? "is-filtering" : ""}`}>
      <Search aria-hidden="true" size={18} />
      <span className="sr-only">Tìm sản phẩm đặt nhanh</span>
      <input ref={searchInputRef} autoComplete="off" onChange={(event) => setQuery(event.target.value)} placeholder="Lọc nhanh tên, nhãn, vị, quy cách" type="search" value={query} />
      {query ? <button aria-label="Xóa nội dung tìm kiếm" onClick={() => setQuery("")} type="button"><RotateCcw aria-hidden="true" size={16} /></button> : null}
    </label>

    <div className="quick-order-catalog-layout">
      <aside aria-label="Bộ lọc đặt nhanh" className="quick-filter-rail">
        <button className="quick-filter-search-shortcut" onClick={() => searchInputRef.current?.focus()} type="button"><Search aria-hidden="true" size={16} /><span>Tìm nhanh</span></button>

        <div className="quick-filter-block quick-filter-mode">
          <span aria-hidden="true" className="quick-filter-slider" style={filterIndexStyle(modeIndex)} />
          {PURCHASE_FILTERS.map(({ mode, label, icon: Icon }) => <button
            aria-pressed={purchaseMode === mode}
            className={`quick-filter-button ${purchaseMode === mode ? "is-active" : ""}`}
            key={mode}
            onClick={() => setPurchaseMode(mode)}
            type="button"
          ><Icon aria-hidden="true" size={15} /><span>{label}</span></button>)}
        </div>

        <div className="quick-filter-divider" />
        <span className="quick-filter-heading">Nhóm sản phẩm</span>
        <div className="quick-filter-block quick-filter-categories">
          {categoryIndex >= 0 ? <span aria-hidden="true" className="quick-filter-slider" style={filterIndexStyle(categoryIndex)} /> : null}
          {categories.map((category) => <button
            aria-selected={activeCategory === category.id}
            className={`quick-filter-button quick-category-button ${activeCategory === category.id ? "is-active" : ""}`}
            key={category.id}
            onClick={() => selectCategory(activeCategory === category.id ? null : category.id)}
            role="tab"
            title={category.name}
            type="button"
          ><Tag aria-hidden="true" size={14} /><span>{category.shortName}</span></button>)}
        </div>

        {activeCategory && productTypeOptions.length > 0 ? <>
          <div className="quick-filter-divider" />
          <span className="quick-filter-heading">Nhóm hàng</span>
          <div className="quick-filter-block quick-filter-types">
            <span aria-hidden="true" className="quick-filter-slider" style={filterIndexStyle(productTypeIndex)} />
            <button aria-pressed={activeProductType === null} className={`quick-filter-button ${activeProductType === null ? "is-active" : ""}`} onClick={() => setActiveProductType(null)} type="button"><Layers3 aria-hidden="true" size={14} /><span>Tất cả</span></button>
            {productTypeOptions.map((productType) => <button aria-pressed={activeProductType === productType} className={`quick-filter-button ${activeProductType === productType ? "is-active" : ""}`} key={productType} onClick={() => setActiveProductType(productType)} title={productType} type="button"><Tag aria-hidden="true" size={13} /><span>{productType}</span></button>)}
          </div>
        </> : null}
      </aside>

      <div className="quick-order-results">
        {addError ? <p className="quick-order-inline-error" role="alert">{addError}</p> : null}
        {error ? <div className="catalog-state-card is-error" role="alert"><PackageSearch aria-hidden="true" size={28} /><strong>Chưa tải được sản phẩm</strong><span>{error}</span></div>
          : !loaded ? <div aria-label="Đang tải danh sách đặt nhanh" className="quick-order-list quick-order-direct-list">{Array.from({ length: 5 }, (_, index) => <div className="quick-order-row quick-order-direct-row is-skeleton" key={index} />)}</div>
          : filteredProducts.length === 0 ? <div className="catalog-state-card"><PackageSearch aria-hidden="true" size={30} /><strong>Không tìm thấy sản phẩm</strong></div>
          : <QuickOrderProductList addingSku={addingSku} onAddProduct={(product) => void addProductToCart(product)} products={filteredProducts} />}
      </div>
    </div>
  </section>;
}
