"use client";

import Link from "next/link";
import { Check, ChevronDown, ChevronUp, Minus, PackageSearch, Plus, RotateCcw, Search, ShoppingCart } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { announceCartUpdated } from "@/lib/cart-events";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { Category, Product, PurchaseMode } from "@/lib/contracts";
import { distinctProductValues, productSizeLabel } from "@/lib/product-grouping";

type PurchaseModeFilter = "all" | PurchaseMode;

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

export function QuickOrder() {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeProductType, setActiveProductType] = useState<string | null>(null);
  const [purchaseMode, setPurchaseMode] = useState<PurchaseModeFilter>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loadedQueryKey, setLoadedQueryKey] = useState("");
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const queryKey = `${activeCategory ?? "all"}:${purchaseMode}:${deferredQuery}`;
  const loading = loadedQueryKey !== queryKey;

  useEffect(() => {
    let cancelled = false;
    void service.listCategories()
      .then((items) => { if (!cancelled) setCategories(items); })
      .catch(() => { if (!cancelled) setError("Không tải được danh mục."); });
    return () => { cancelled = true; };
  }, [service]);

  useEffect(() => {
    let cancelled = false;
    const requestKey = queryKey;
    void service.listProducts({
      categoryId: activeCategory,
      query: deferredQuery,
      purchaseMode: purchaseMode === "all" ? null : purchaseMode,
    }).then((items) => {
      if (cancelled) return;
      setProducts(items);
      setError("");
      setLoadedQueryKey(requestKey);
    }).catch(() => {
      if (cancelled) return;
      setError("Không tải được danh sách đặt nhanh.");
      setLoadedQueryKey(requestKey);
    });
    return () => { cancelled = true; };
  }, [activeCategory, deferredQuery, purchaseMode, queryKey, service]);

  const productTypeOptions = useMemo(
    () => distinctProductValues(products, (product) => product.productType.trim()).filter(Boolean),
    [products],
  );

  const visibleProducts = useMemo(() => products
    .filter((product) => !activeProductType || product.productType === activeProductType)
    .filter((product) => !selectedOnly || (quantities[product.sku] ?? 0) > 0)
    .sort((left, right) => left.productType.localeCompare(right.productType, "vi")
      || left.name.localeCompare(right.name, "vi")
      || (left.purchaseMode === right.purchaseMode ? 0 : left.purchaseMode === "retail" ? -1 : 1)
      || left.sku.localeCompare(right.sku, "vi")),
  [activeProductType, products, quantities, selectedOnly]);

  const selectedEntries = Object.entries(quantities).filter(([, quantity]) => quantity > 0);
  const selectedLines = selectedEntries.length;
  const selectedQuantity = selectedEntries.reduce((total, [, quantity]) => total + quantity, 0);

  function changeQuantity(product: Product, nextValue: number) {
    if (product.availability !== "available") return;
    const next = Math.min(999, Math.max(0, Math.trunc(Number.isFinite(nextValue) ? nextValue : 0)));
    setAdded(false);
    setQuantities((current) => {
      if (next === 0) {
        const rest = { ...current };
        delete rest[product.sku];
        return rest;
      }
      return { ...current, [product.sku]: next };
    });
  }

  async function addSelectedToCart() {
    if (selectedLines === 0) return;
    const cart = await service.getCart();
    const nextLines = [...cart.lines];
    for (const [sku, quantity] of selectedEntries) {
      const existingIndex = nextLines.findIndex((line) => line.sku === sku);
      if (existingIndex >= 0) {
        nextLines[existingIndex] = {
          ...nextLines[existingIndex],
          quantity: Math.min(999, nextLines[existingIndex].quantity + quantity),
        };
      } else {
        nextLines.push({ sku, quantity });
      }
    }
    await service.saveCart({ lines: nextLines, updatedAt: new Date().toISOString() });
    announceCartUpdated();
    setQuantities({});
    setSelectedOnly(false);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  function selectCategory(categoryId: string | null) {
    setActiveCategory(categoryId);
    setActiveProductType(null);
  }

  const searchField = (className: string) => <label className={`catalog-search quick-order-search ${className}`}>
    <Search aria-hidden="true" size={18} />
    <span className="sr-only">Tìm sản phẩm đặt nhanh</span>
    <input autoComplete="off" onChange={(event) => setQuery(event.target.value)} placeholder="Lọc nhanh tên, nhãn, SKU" type="search" value={query} />
    {query ? <button aria-label="Xóa nội dung tìm kiếm" onClick={() => setQuery("")} type="button"><RotateCcw aria-hidden="true" size={16} /></button> : null}
  </label>;

  return <section className="quick-order-screen quick-order-screen-compact">
    <div className="quick-order-toolbar">
      <div aria-label="Lọc quy cách mua" className="catalog-purchase-mode quick-purchase-mode" role="group">{([["all", "Tất cả"], ["retail", "Mua lẻ"], ["case", "Mua thùng"]] as const).map(([mode, label]) => <button aria-pressed={purchaseMode === mode} className={purchaseMode === mode ? "is-active" : ""} key={mode} onClick={() => setPurchaseMode(mode)} type="button">{label}</button>)}</div>
      <Link aria-label="Xem giỏ hàng" className="quick-cart-link quick-cart-icon" href="/cart"><ShoppingCart aria-hidden="true" size={19} /></Link>
    </div>

    {searchField("quick-order-search-top")}

    <div className="quick-filter-row"><div aria-label="Lọc danh mục đặt nhanh" className="catalog-category-row" role="tablist"><button aria-selected={activeCategory === null} className={activeCategory === null ? "is-active" : ""} onClick={() => selectCategory(null)} role="tab" type="button">Tất cả</button>{categories.map((category) => <button aria-selected={activeCategory === category.id} className={activeCategory === category.id ? "is-active" : ""} key={category.id} onClick={() => selectCategory(category.id)} role="tab" type="button">{category.shortName}</button>)}</div><button aria-pressed={selectedOnly} className={`selected-only-button ${selectedOnly ? "is-active" : ""}`} onClick={() => setSelectedOnly((current) => !current)} type="button"><Check aria-hidden="true" size={16} />Đã chọn ({selectedLines})</button></div>

    {activeCategory && productTypeOptions.length > 0 ? <div className="catalog-type-filter quick-type-filter"><span>Nhóm hàng</span><div className="catalog-type-row" role="group"><button aria-pressed={activeProductType === null} className={activeProductType === null ? "is-active" : ""} onClick={() => setActiveProductType(null)} type="button">Tất cả</button>{productTypeOptions.map((productType) => <button aria-pressed={activeProductType === productType} className={activeProductType === productType ? "is-active" : ""} key={productType} onClick={() => setActiveProductType(productType)} type="button">{productType}</button>)}</div></div> : null}

    {error ? <div className="catalog-state-card is-error" role="alert"><PackageSearch aria-hidden="true" size={28} /><strong>Chưa tải được sản phẩm</strong><span>{error}</span></div>
      : loading ? <div aria-label="Đang tải danh sách đặt nhanh" className="quick-order-list">{Array.from({ length: 5 }, (_, index) => <div className="quick-order-row is-skeleton" key={index} />)}</div>
      : visibleProducts.length === 0 ? <div className="catalog-state-card"><PackageSearch aria-hidden="true" size={30} /><strong>{selectedOnly ? "Chưa chọn sản phẩm nào" : "Không tìm thấy sản phẩm"}</strong></div>
      : <div className="quick-order-list quick-order-direct-list">{visibleProducts.map((product) => {
        const quantity = quantities[product.sku] ?? 0;
        const canOrder = product.availability === "available";
        return <article className={`quick-order-row quick-order-direct-row ${quantity > 0 ? "is-selected" : ""} ${canOrder ? "" : "is-disabled"}`} key={product.sku}>
          <div className="quick-product-copy">
            <div className="quick-product-heading"><span>{product.sku}</span><span className={`availability-${product.availability}`}>{availabilityLabel(product)}</span></div>
            <h2>{product.name}</h2>
            <p>{product.brand} · {product.productType}{product.flavor ? ` · ${product.flavor}` : ""}</p>
            <div className="quick-product-mode-price"><span>{purchaseModeLabel(product.purchaseMode)} · {productSizeLabel(product) || product.packaging}</span><strong>{formatPrice(product)}</strong></div>
          </div>
          <div className="quick-quantity-control" aria-label={`Số lượng ${product.name}`}>
            <button aria-label={`Giảm ${product.name}`} disabled={!canOrder || quantity === 0} onClick={() => changeQuantity(product, quantity - 1)} type="button"><Minus aria-hidden="true" size={16} /></button>
            <label><span className="sr-only">Số lượng {product.name}</span><input disabled={!canOrder} inputMode="numeric" max={999} min={0} onChange={(event) => changeQuantity(product, Number(event.target.value))} onFocus={(event) => event.currentTarget.select()} type="number" value={quantity} /><small>{product.unit}</small></label>
            <div className="quick-step-buttons"><button aria-label={`Tăng ${product.name}`} disabled={!canOrder || quantity >= 999} onClick={() => changeQuantity(product, quantity + 1)} type="button"><ChevronUp aria-hidden="true" size={15} /></button><button aria-label={`Giảm ${product.name}`} disabled={!canOrder || quantity === 0} onClick={() => changeQuantity(product, quantity - 1)} type="button"><ChevronDown aria-hidden="true" size={15} /></button></div>
            <button aria-label={`Tăng nhanh ${product.name}`} className="quick-plus-button" disabled={!canOrder || quantity >= 999} onClick={() => changeQuantity(product, quantity + 1)} type="button"><Plus aria-hidden="true" size={17} /></button>
          </div>
        </article>;
      })}</div>}

    <div className="quick-order-summary quick-order-summary-search" aria-live="polite">
      {searchField("quick-order-sticky-search")}
      <div className="quick-order-summary-row"><div className="quick-summary-count"><span>{selectedLines} dòng</span><strong>{selectedQuantity} sản phẩm</strong></div><button className="quick-summary-add" disabled={selectedLines === 0} onClick={() => void addSelectedToCart()} type="button">{added ? <Check aria-hidden="true" size={19} /> : <ShoppingCart aria-hidden="true" size={19} />}{added ? "Đã thêm" : "Thêm vào giỏ"}</button></div>
    </div>
  </section>;
}
