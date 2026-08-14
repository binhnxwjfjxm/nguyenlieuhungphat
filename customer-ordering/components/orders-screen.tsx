"use client";

import Link from "next/link";
import { ChevronRight, ClipboardList, Plus, Search, ShoppingCart, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { announceCartUpdated } from "@/lib/cart-events";
import type { CustomerOrder, OrderStatus, Product } from "@/lib/contracts";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import { ORDER_STATUS_FILTERS, ORDER_STATUS_META } from "@/lib/order-status";

function formatDate(value: string): string { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function formatMoney(amount: number): string { return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount); }
function normalizeSearch(value: string): string { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll("đ", "d").toLocaleLowerCase("vi").replace(/[^a-z0-9]+/g, " ").trim(); }

type OrdersView = "orders" | "purchased";
type PurchasedItem = { sku: string; name: string; lastOrderedAt: string; totalQuantity: number; orderCount: number; product: Product | null };

export function OrdersScreen() {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [view, setView] = useState<OrdersView>("orders");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedSku, setAddedSku] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([service.listOrders(), service.listProducts()]).then(([orderItems, productItems]) => {
      if (!cancelled) { setOrders(orderItems); setProducts(productItems); setLoading(false); }
    }).catch((loadError: unknown) => { if (!cancelled) { setError(loadError instanceof Error ? loadError.message : "Không thể tải đơn hàng."); setLoading(false); } });
    return () => { cancelled = true; };
  }, [service]);

  async function retryLoadOrders() {
    setLoading(true); setError(null);
    try { const [orderItems, productItems] = await Promise.all([service.listOrders(), service.listProducts()]); setOrders(orderItems); setProducts(productItems); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Không thể tải đơn hàng."); }
    finally { setLoading(false); }
  }

  const productMap = useMemo(() => new Map(products.map((product) => [product.sku, product])), [products]);
  const filteredOrders = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);
    return orders.filter((order) => {
      if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return normalizeSearch([order.code, order.address.label, order.address.recipientName, ...order.lines.flatMap((line) => [line.sku, line.productName])].join(" ")).includes(normalizedQuery);
    });
  }, [orders, query, statusFilter]);

  const purchasedItems = useMemo(() => {
    const bySku = new Map<string, PurchasedItem>();
    for (const order of orders) {
      for (const line of order.lines) {
        const current = bySku.get(line.sku);
        if (current) {
          current.totalQuantity += line.quantity;
          current.orderCount += 1;
        } else {
          bySku.set(line.sku, { sku: line.sku, name: line.productName, lastOrderedAt: order.submittedAt, totalQuantity: line.quantity, orderCount: 1, product: productMap.get(line.sku) ?? null });
        }
      }
    }
    const normalizedQuery = normalizeSearch(query);
    return [...bySku.values()]
      .filter((item) => !normalizedQuery || normalizeSearch([item.sku, item.name, item.product?.brand ?? "", item.product?.productType ?? ""].join(" ")).includes(normalizedQuery))
      .sort((a, b) => b.lastOrderedAt.localeCompare(a.lastOrderedAt) || b.totalQuantity - a.totalQuantity);
  }, [orders, productMap, query]);

  async function addPurchasedItem(item: PurchasedItem) {
    if (!item.product || item.product.availability !== "available") return;
    const cart = await service.getCart();
    const existing = cart.lines.find((line) => line.sku === item.sku);
    const lines = existing
      ? cart.lines.map((line) => line.sku === item.sku ? { ...line, quantity: Math.min(999, line.quantity + 1) } : line)
      : [...cart.lines, { sku: item.sku, quantity: 1 }];
    await service.saveCart({ lines, updatedAt: new Date().toISOString() });
    announceCartUpdated(); setAddedSku(item.sku); window.setTimeout(() => setAddedSku((current) => current === item.sku ? null : current), 1400);
  }

  if (loading) return <section aria-label="Đang tải danh sách đơn" className="orders-screen"><div className="orders-filter-skeleton" /><div className="order-card is-skeleton" /><div className="order-card is-skeleton" /></section>;
  if (error) return <section className="orders-state-card is-error"><TriangleAlert aria-hidden="true" size={34} /><strong>Chưa tải được đơn hàng</strong><span>{error}</span><button className="primary-button orders-retry-button" onClick={() => void retryLoadOrders()} type="button">Thử lại</button></section>;

  return <section className="orders-screen orders-screen-compact">
    <div className="orders-inner-tabs" role="tablist" aria-label="Đơn hàng và sản phẩm đã mua"><button aria-selected={view === "orders"} className={view === "orders" ? "is-active" : ""} onClick={() => { setView("orders"); setQuery(""); }} role="tab" type="button">Đơn hàng <span>{orders.length}</span></button><button aria-selected={view === "purchased"} className={view === "purchased" ? "is-active" : ""} onClick={() => { setView("purchased"); setQuery(""); }} role="tab" type="button">Sản phẩm đã mua <span>{new Set(orders.flatMap((order) => order.lines.map((line) => line.sku))).size}</span></button></div>
    <label className="orders-search"><Search aria-hidden="true" size={19} /><span className="sr-only">Tìm kiếm</span><input onChange={(event) => setQuery(event.target.value)} placeholder={view === "orders" ? "Mã đơn hoặc tên sản phẩm" : "Tên sản phẩm đã mua"} type="search" value={query} /></label>

    {view === "orders" ? <>
      {orders.length > 0 ? <div aria-label="Lọc theo trạng thái" className="orders-status-filters" role="group">{ORDER_STATUS_FILTERS.map((filter) => <button className={`filter-${filter.tone}${statusFilter === filter.value ? " is-active" : ""}`} key={filter.value} onClick={() => setStatusFilter(filter.value)} type="button">{filter.label}</button>)}</div> : null}
      {orders.length === 0 ? <section className="orders-state-card"><ClipboardList aria-hidden="true" size={38} /><strong>Chưa có đơn hàng</strong><Link className="primary-link-button" href="/quick-order">Đặt hàng</Link></section> : filteredOrders.length === 0 ? <section className="orders-state-card is-compact"><Search aria-hidden="true" size={30} /><strong>Không có đơn phù hợp</strong></section> : <div className="orders-list">{filteredOrders.map((order) => { const status = ORDER_STATUS_META[order.status]; return <article className="order-card" key={order.id}><div className="order-card-top"><div className="order-code-block"><span>Mã đơn</span><strong>{order.code}</strong><small>{formatDate(order.submittedAt)}</small></div><span className={`order-status-badge status-${status.tone}`}>{status.label}</span></div><div className="order-card-summary"><span>{order.lines.length} mặt hàng</span><span>{order.totalQuantity} đơn vị</span><strong>{formatMoney(order.pricedSubtotal)}</strong></div>{order.hasPendingPrice ? <p className="order-price-note">Có mặt hàng chờ xác nhận giá.</p> : null}<Link className="order-detail-link" href={`/orders/${order.id}`}>Chi tiết<ChevronRight aria-hidden="true" size={18} /></Link></article>; })}</div>}
    </> : <div className="purchased-products-list">{purchasedItems.length === 0 ? <section className="orders-state-card is-compact"><ShoppingCart aria-hidden="true" size={30} /><strong>Chưa có sản phẩm đã mua</strong></section> : purchasedItems.map((item) => <article className="purchased-product-row" key={item.sku}><div><span>{item.product?.brand || item.product?.productType || "Đã mua"}</span><strong>{item.name}</strong><small>{item.orderCount} lần mua · {item.totalQuantity} sản phẩm</small></div><button aria-label={`Thêm lại ${item.name} vào giỏ`} disabled={!item.product || item.product.availability !== "available"} onClick={() => void addPurchasedItem(item)} type="button">{addedSku === item.sku ? <ShoppingCart aria-hidden="true" size={18} /> : <><Plus aria-hidden="true" size={13} /><ShoppingCart aria-hidden="true" size={18} /></>}</button></article>)}</div>}
  </section>;
}
