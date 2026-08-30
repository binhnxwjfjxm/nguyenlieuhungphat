"use client";

import { Grid3X3, Layers3, Package, PackageSearch, Plus, RotateCcw, Search, ShoppingBag, Tag } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { announceCartUpdated } from "@/lib/cart-events";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { Category, Product, PurchaseMode } from "@/lib/contracts";
import { productSizeLabel } from "@/lib/product-grouping";
import { ProductVisual } from "@/components/product-visual";

type PurchaseModeFilter = "all" | PurchaseMode;

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 250;
const DATA_MODE = process.env.NEXT_PUBLIC_CUSTOMER_ORDERING_DATA_MODE?.trim().toLowerCase();
const USE_MOCK_CATALOG_FALLBACK = DATA_MODE === "mock" || (!DATA_MODE && process.env.NODE_ENV !== "production");
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

function mergeProducts(current: Product[], incoming: Product[]): Product[] {
  const merged = new Map(current.map((product) => [product.sku, product] as const));
  for (const product of incoming) merged.set(product.sku, product);
  return [...merged.values()];
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
  const requestVersionRef = useRef(0);
  const categoriesLoadedRef = useRef(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [activeProductType, setActiveProductType] = useState<string | null>(null);
  const [mockProductTypes, setMockProductTypes] = useState<string[]>([]);
  const [purchaseMode, setPurchaseMode] = useState<PurchaseModeFilter>("all");
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [addError, setAddError] = useState("");
  const [addingSku, setAddingSku] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const rootCategories = useMemo(() => {
    const categoryIds = new Set(categories.map((category) => category.id));
    return categories.filter((category) => !category.parentCategoryId || !categoryIds.has(category.parentCategoryId));
  }, [categories]);

  const subcategories = useMemo(
    () => activeCategory ? categories.filter((category) => category.parentCategoryId === activeCategory) : [],
    [activeCategory, categories],
  );

  const selectedPurchaseMode = purchaseMode === "all" ? null : purchaseMode;
  const useMockProductTypeFallback = USE_MOCK_CATALOG_FALLBACK && Boolean(activeCategory) && subcategories.length === 0;

  useEffect(() => {
    if (!useMockProductTypeFallback || !activeCategory) return;

    let cancelled = false;
    void service.listProducts({ categoryId: activeCategory, purchaseMode: selectedPurchaseMode })
      .then((items) => {
        if (cancelled) return;
        const options = [...new Set(items.map((product) => product.productType.trim()).filter(Boolean))]
          .sort((left, right) => left.localeCompare(right, "vi"));
        setMockProductTypes(options);
        setActiveProductType((current) => current && options.includes(current) ? current : null);
      })
      .catch(() => {
        if (cancelled) return;
        setMockProductTypes([]);
        setActiveProductType(null);
      });

    return () => { cancelled = true; };
  }, [activeCategory, selectedPurchaseMode, service, useMockProductTypeFallback]);

  const selectedCategoryId = activeSubcategory ?? activeCategory;
  const selectedProductType = useMockProductTypeFallback ? activeProductType : null;

  useEffect(() => {
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    void service.listProductPage({
      query: searchQuery,
      categoryId: selectedCategoryId,
      purchaseMode: selectedPurchaseMode,
      productType: selectedProductType,
      limit: PAGE_SIZE,
      offset: 0,
      includeCategories: !categoriesLoadedRef.current,
    }).then((page) => {
      if (requestVersionRef.current !== requestVersion) return;
      setProducts(page.products);
      setHasMore(page.hasMore);
      setLoadingMore(false);
      setError("");
      if (page.categories.length > 0) {
        categoriesLoadedRef.current = true;
        setCategories(page.categories);
      }
      setLoaded(true);
    }).catch(() => {
      if (requestVersionRef.current !== requestVersion) return;
      setProducts([]);
      setHasMore(false);
      setLoadingMore(false);
      setError("Không tải được danh sách đặt nhanh.");
      setLoaded(true);
    });
  }, [searchQuery, selectedCategoryId, selectedProductType, selectedPurchaseMode, service]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !loaded) return;
    const requestVersion = requestVersionRef.current;
    setError("");
    setLoadingMore(true);
    try {
      const page = await service.listProductPage({
        query: searchQuery,
        categoryId: selectedCategoryId,
        purchaseMode: selectedPurchaseMode,
        productType: selectedProductType,
        limit: PAGE_SIZE,
        offset: products.length,
        includeCategories: false,
      });
      if (requestVersionRef.current !== requestVersion) return;
      setProducts((current) => mergeProducts(current, page.products));
      setHasMore(page.hasMore);
      setError("");
    } catch {
      if (requestVersionRef.current === requestVersion) setError("Chưa tải thêm được sản phẩm. Vui lòng thử lại.");
    } finally {
      if (requestVersionRef.current === requestVersion) setLoadingMore(false);
    }
  }, [hasMore, loaded, loadingMore, products.length, searchQuery, selectedCategoryId, selectedProductType, selectedPurchaseMode, service]);

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

  function clearTransientRequestState() {
    setLoadingMore(false);
    setError("");
  }

  function selectCategory(categoryId: string | null) {
    clearTransientRequestState();
    setActiveCategory(categoryId);
    setActiveSubcategory(null);
    setActiveProductType(null);
    setMockProductTypes([]);
  }

  const modeIndex = purchaseMode === "all" ? 0 : purchaseMode === "retail" ? 1 : 2;
  const categoryIndex = activeCategory ? rootCategories.findIndex((category) => category.id === activeCategory) : -1;
  const subcategoryIndex = activeSubcategory ? subcategories.findIndex((category) => category.id === activeSubcategory) + 1 : 0;
  const productTypeIndex = activeProductType ? mockProductTypes.indexOf(activeProductType) + 1 : 0;
  const groupIndex = subcategories.length > 0 ? subcategoryIndex : productTypeIndex;
  const hasGroupFilters = Boolean(activeCategory && (subcategories.length > 0 || (useMockProductTypeFallback && mockProductTypes.length > 0)));
  const searchPending = query.trim() !== searchQuery;

  return <section className="quick-order-screen quick-order-screen-compact">
    <label className={`catalog-search quick-order-search quick-order-search-top ${searchPending ? "is-filtering" : ""}`}>
      <Search aria-hidden="true" size={18} />
      <span className="sr-only">Tìm sản phẩm đặt nhanh</span>
      <input
        ref={searchInputRef}
        autoComplete="off"
        onChange={(event) => { clearTransientRequestState(); setQuery(event.target.value); }}
        placeholder="Tìm tên, mã hàng, nhãn hàng, nhóm hàng"
        type="search"
        value={query}
      />
      {query ? <button aria-label="Xóa nội dung tìm kiếm" onClick={() => { clearTransientRequestState(); setQuery(""); }} type="button"><RotateCcw aria-hidden="true" size={16} /></button> : null}
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
            onClick={() => { clearTransientRequestState(); setPurchaseMode(mode); setActiveProductType(null); setMockProductTypes([]); }}
            type="button"
          ><Icon aria-hidden="true" size={15} /><span>{label}</span></button>)}
        </div>

        {rootCategories.length > 0 ? <>
          <div className="quick-filter-divider" />
          <span className="quick-filter-heading">Nhóm sản phẩm</span>
          <div className="quick-filter-block quick-filter-categories">
            {categoryIndex >= 0 ? <span aria-hidden="true" className="quick-filter-slider" style={filterIndexStyle(categoryIndex)} /> : null}
            {rootCategories.map((category) => <button
              aria-selected={activeCategory === category.id}
              className={`quick-filter-button quick-category-button ${activeCategory === category.id ? "is-active" : ""}`}
              key={category.id}
              onClick={() => selectCategory(activeCategory === category.id ? null : category.id)}
              role="tab"
              title={category.name}
              type="button"
            ><Tag aria-hidden="true" size={14} /><span>{category.shortName}</span></button>)}
          </div>
        </> : null}

        {hasGroupFilters ? <>
          <div className="quick-filter-divider" />
          <span className="quick-filter-heading">Nhóm hàng</span>
          <div className="quick-filter-block quick-filter-types">
            <span aria-hidden="true" className="quick-filter-slider" style={filterIndexStyle(groupIndex)} />
            <button
              aria-pressed={activeSubcategory === null && activeProductType === null}
              className={`quick-filter-button ${activeSubcategory === null && activeProductType === null ? "is-active" : ""}`}
              onClick={() => { clearTransientRequestState(); setActiveSubcategory(null); setActiveProductType(null); }}
              type="button"
            ><Layers3 aria-hidden="true" size={14} /><span>Tất cả</span></button>
            {subcategories.length > 0
              ? subcategories.map((category) => <button aria-pressed={activeSubcategory === category.id} className={`quick-filter-button ${activeSubcategory === category.id ? "is-active" : ""}`} key={category.id} onClick={() => { clearTransientRequestState(); setActiveSubcategory(category.id); }} title={category.name} type="button"><Tag aria-hidden="true" size={13} /><span>{category.shortName}</span></button>)
              : mockProductTypes.map((productType) => <button aria-pressed={activeProductType === productType} className={`quick-filter-button ${activeProductType === productType ? "is-active" : ""}`} key={productType} onClick={() => { clearTransientRequestState(); setActiveProductType(productType); }} title={productType} type="button"><Tag aria-hidden="true" size={13} /><span>{productType}</span></button>)}
          </div>
        </> : null}
      </aside>

      <div className="quick-order-results">
        {addError ? <p className="quick-order-inline-error" role="alert">{addError}</p> : null}
        {error && products.length > 0 ? <p className="quick-order-inline-error" role="alert">{error}</p> : null}
        {error && products.length === 0 ? <div className="catalog-state-card is-error" role="alert"><PackageSearch aria-hidden="true" size={28} /><strong>Chưa tải được sản phẩm</strong><span>{error}</span></div>
          : !loaded ? <div aria-label="Đang tải danh sách đặt nhanh" className="quick-order-list quick-order-direct-list">{Array.from({ length: 5 }, (_, index) => <div className="quick-order-row quick-order-direct-row is-skeleton" key={index} />)}</div>
          : products.length === 0 ? <div className="catalog-state-card"><PackageSearch aria-hidden="true" size={30} /><strong>Không tìm thấy sản phẩm</strong></div>
          : <>
            <QuickOrderProductList addingSku={addingSku} onAddProduct={(product) => void addProductToCart(product)} products={products} />
            {hasMore ? <button className="primary-button catalog-load-more" disabled={loadingMore} onClick={() => void loadMore()} type="button">{loadingMore ? "Đang tải thêm..." : "Xem thêm sản phẩm"}</button> : null}
          </>}
      </div>
    </div>
  </section>;
}
