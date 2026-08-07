"use client";

import Link from "next/link";
import { Check, ChevronDown, ChevronUp, Minus, PackageSearch, Plus, RotateCcw, Search, ShoppingCart } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { announceCartUpdated } from "@/lib/cart-events";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { Category, Product } from "@/lib/contracts";

function availabilityLabel(product: Product): string {
  if (product.availability === "out_of_stock") return "Tạm hết hàng";
  if (product.availability === "paused") return "Tạm ngưng";
  return "Đang bán";
}

export function QuickOrder() {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loadedQueryKey, setLoadedQueryKey] = useState("");
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const queryKey = `${activeCategory ?? "all"}:${deferredQuery}`;
  const loading = loadedQueryKey !== queryKey;

  useEffect(() => {
    let cancelled = false;
    void service.listCategories().then((items) => { if (!cancelled) setCategories(items); }).catch(() => { if (!cancelled) setError("Không tải được danh mục."); });
    return () => { cancelled = true; };
  }, [service]);

  useEffect(() => {
    let cancelled = false;
    const requestKey = queryKey;
    void service.listProducts({ categoryId: activeCategory, query: deferredQuery }).then((items) => {
      if (!cancelled) { setProducts(items); setError(""); setLoadedQueryKey(requestKey); }
    }).catch(() => { if (!cancelled) { setError("Không tải được danh sách đặt nhanh."); setLoadedQueryKey(requestKey); } });
    return () => { cancelled = true; };
  }, [activeCategory, deferredQuery, queryKey, service]);

  const visibleProducts = selectedOnly ? products.filter((product) => (quantities[product.sku] ?? 0) > 0) : products;
  const selectedEntries = Object.entries(quantities).filter(([, quantity]) => quantity > 0);
  const selectedLines = selectedEntries.length;
  const selectedQuantity = selectedEntries.reduce((total, [, quantity]) => total + quantity, 0);

  function changeQuantity(product: Product, nextValue: number) {
    if (product.availability !== "available") return;
    const next = Math.min(999, Math.max(0, Math.trunc(Number.isFinite(nextValue) ? nextValue : 0)));
    setAdded(false);
    setQuantities((current) => {
      if (next === 0) { const rest = { ...current }; delete rest[product.sku]; return rest; }
      return { ...current, [product.sku]: next };
    });
  }

  async function addSelectedToCart() {
    if (selectedLines === 0) return;
    const cart = await service.getCart();
    const nextLines = [...cart.lines];
    for (const [sku, quantity] of selectedEntries) {
      const existingIndex = nextLines.findIndex((line) => line.sku === sku);
      if (existingIndex >= 0) nextLines[existingIndex] = { ...nextLines[existingIndex], quantity: Math.min(999, nextLines[existingIndex].quantity + quantity) };
      else nextLines.push({ sku, quantity });
    }
    await service.saveCart({ lines: nextLines, updatedAt: new Date().toISOString() });
    announceCartUpdated(); setQuantities({}); setSelectedOnly(false); setAdded(true); window.setTimeout(() => setAdded(false), 1800);
  }

  return <section className="quick-order-screen">
    <div className="quick-order-intro"><div><p className="eyebrow">Nhập số lượng thật nhanh</p><h1>Đặt hàng nhanh</h1><p>Tìm bằng tên hoặc SKU, chọn nhiều mặt hàng rồi thêm giỏ một lần.</p></div><Link className="quick-cart-link" href="/cart"><ShoppingCart aria-hidden="true" size={18} />Xem giỏ</Link></div>
    <label className="catalog-search quick-order-search"><Search aria-hidden="true" size={19} /><span className="sr-only">Tìm sản phẩm đặt nhanh</span><input autoComplete="off" onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên hoặc SKU..." type="search" value={query} />{query ? <button aria-label="Xóa nội dung tìm kiếm" onClick={() => setQuery("")} type="button"><RotateCcw aria-hidden="true" size={17} /></button> : null}</label>
    <div className="quick-filter-row"><div aria-label="Lọc danh mục đặt nhanh" className="catalog-category-row" role="tablist"><button aria-selected={activeCategory === null} className={activeCategory === null ? "is-active" : ""} onClick={() => setActiveCategory(null)} role="tab" type="button">Tất cả</button>{categories.map((category) => <button aria-selected={activeCategory === category.id} className={activeCategory === category.id ? "is-active" : ""} key={category.id} onClick={() => setActiveCategory(category.id)} role="tab" type="button">{category.shortName}</button>)}</div><button aria-pressed={selectedOnly} className={`selected-only-button ${selectedOnly ? "is-active" : ""}`} onClick={() => setSelectedOnly((current) => !current)} type="button"><Check aria-hidden="true" size={16} />Đã chọn ({selectedLines})</button></div>
    {error ? <div className="catalog-state-card is-error" role="alert"><PackageSearch aria-hidden="true" size={28} /><strong>Chưa tải được sản phẩm</strong><span>{error}</span></div> : loading ? <div aria-label="Đang tải danh sách đặt nhanh" className="quick-order-list">{Array.from({ length: 5 }, (_, index) => <div className="quick-order-row is-skeleton" key={index} />)}</div> : visibleProducts.length === 0 ? <div className="catalog-state-card"><PackageSearch aria-hidden="true" size={30} /><strong>{selectedOnly ? "Chưa chọn sản phẩm nào" : "Không tìm thấy sản phẩm"}</strong><span>{selectedOnly ? "Nhập số lượng ở danh sách trước khi bật bộ lọc này." : "Thử tên khác, SKU khác hoặc đổi ngành."}</span></div> : <div className="quick-order-list">{visibleProducts.map((product) => {
      const quantity = quantities[product.sku] ?? 0; const canOrder = product.availability === "available";
      return <article className={`quick-order-row ${canOrder ? "" : "is-disabled"}`} key={product.sku}><Link className="quick-product-copy" href={`/products/${encodeURIComponent(product.sku)}`}><div className="quick-product-heading"><span>{product.sku}</span><span className={`availability-${product.availability}`}>{availabilityLabel(product)}</span></div><h2>{product.name}</h2><p>{product.packaging} · {product.unit}</p></Link><div className="quick-quantity-control" aria-label={`Số lượng ${product.name}`}><button aria-label={`Giảm ${product.name}`} disabled={!canOrder || quantity === 0} onClick={() => changeQuantity(product, quantity - 1)} type="button"><Minus aria-hidden="true" size={16} /></button><label><span className="sr-only">Số lượng {product.name}</span><input disabled={!canOrder} inputMode="numeric" max={999} min={0} onChange={(event) => changeQuantity(product, Number(event.target.value))} onFocus={(event) => event.currentTarget.select()} type="number" value={quantity} /><small>{product.unit}</small></label><div className="quick-step-buttons"><button aria-label={`Tăng ${product.name}`} disabled={!canOrder || quantity >= 999} onClick={() => changeQuantity(product, quantity + 1)} type="button"><ChevronUp aria-hidden="true" size={15} /></button><button aria-label={`Giảm ${product.name}`} disabled={!canOrder || quantity === 0} onClick={() => changeQuantity(product, quantity - 1)} type="button"><ChevronDown aria-hidden="true" size={15} /></button></div><button aria-label={`Tăng nhanh ${product.name}`} className="quick-plus-button" disabled={!canOrder || quantity >= 999} onClick={() => changeQuantity(product, quantity + 1)} type="button"><Plus aria-hidden="true" size={17} /></button></div></article>;
    })}</div>}
    <div className="quick-order-summary" aria-live="polite"><div><span>{selectedLines} dòng đã chọn</span><strong>{selectedQuantity} sản phẩm</strong></div><button disabled={selectedLines === 0} onClick={() => void addSelectedToCart()} type="button">{added ? <Check aria-hidden="true" size={19} /> : <ShoppingCart aria-hidden="true" size={19} />}{added ? "Đã thêm vào giỏ" : "Thêm tất cả vào giỏ"}</button></div>
  </section>;
}
