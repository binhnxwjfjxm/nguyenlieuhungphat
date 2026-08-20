"use client";

import Link from "next/link";
import { ArrowRight, Minus, PackageOpen, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { announceCartUpdated } from "@/lib/cart-events";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { Cart, CartLine, Product } from "@/lib/contracts";

function formatMoney(amount: number): string { return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount); }
function purchaseModeLabel(product: Product): string { return product.purchaseMode === "case" ? "Thùng" : "Lẻ"; }

export function CartScreen() {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [cart, setCart] = useState<Cart | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([service.getCart(), service.listProducts()]).then(([nextCart, nextProducts]) => {
      if (!cancelled) { setCart(nextCart); setProducts(nextProducts); }
    }).catch(() => { if (!cancelled) setError("Không tải được giỏ hàng."); });
    return () => { cancelled = true; };
  }, [service]);

  const productMap = useMemo(() => new Map(products.map((product) => [product.sku, product])), [products]);
  const displayLines = cart?.lines.map((line) => ({ line, product: productMap.get(line.sku) ?? null })) ?? [];
  const pricedSubtotal = displayLines.reduce((total, item) => {
    const amount = item.product?.price.status === "available" ? item.product.price.amount : null;
    return total + (amount == null ? 0 : amount * item.line.quantity);
  }, 0);
  const pendingPriceCount = displayLines.filter((item) => item.product?.price.status !== "available" || item.product.price.amount === null).length;
  const totalQuantity = displayLines.reduce((total, item) => total + item.line.quantity, 0);

  async function persist(lines: CartLine[]) {
    const nextCart: Cart = { lines, updatedAt: new Date().toISOString() };
    setCart(nextCart); await service.saveCart(nextCart); announceCartUpdated();
  }
  function updateLocalNote(sku: string, note: string) {
    setCart((current) => current ? { ...current, lines: current.lines.map((line) => line.sku === sku ? { ...line, note } : line) } : current);
  }
  async function persistCurrentCart() { if (cart) await service.saveCart({ ...cart, updatedAt: new Date().toISOString() }); }
  async function clearCart() { await persist([]); setConfirmClear(false); }

  if (error) return <section className="catalog-state-card cart-state-card is-error" role="alert"><PackageOpen aria-hidden="true" size={30} /><strong>Chưa tải được giỏ hàng</strong><span>{error}</span></section>;
  if (!cart) return <section aria-label="Đang tải giỏ hàng" className="cart-screen cart-screen-compact"><div className="cart-line-list"><div className="cart-line-row is-skeleton" /><div className="cart-line-row is-skeleton" /></div></section>;
  if (displayLines.length === 0) return <section className="cart-empty-screen"><span className="cart-empty-icon"><ShoppingBasket aria-hidden="true" size={34} /></span><h1>Giỏ hàng trống</h1><div className="cart-empty-actions"><Link className="primary-link-button" href="/quick-order">Đặt nhanh</Link><Link className="secondary-link-button" href="/products">Sản phẩm</Link></div></section>;

  return <section className="cart-screen cart-screen-compact">
    <div className="cart-heading cart-heading-compact"><div><strong>{displayLines.length} dòng · {totalQuantity} sản phẩm</strong></div><button className="cart-clear-button" onClick={() => setConfirmClear(true)} type="button"><Trash2 aria-hidden="true" size={15} />Xóa tất cả</button></div>
    {confirmClear ? <div className="cart-clear-confirm" role="alert"><p>Xóa toàn bộ sản phẩm khỏi giỏ hàng?</p><div><button className="danger-button" onClick={() => void clearCart()} type="button">Xác nhận xóa</button><button className="secondary-action-button" onClick={() => setConfirmClear(false)} type="button">Giữ lại</button></div></div> : null}
    <div className="cart-line-list">{displayLines.map(({ line, product }) => {
      const unitPrice = product?.price.status === "available" ? product.price.amount : null;
      const customerProductName = product?.name ?? "sản phẩm";
      return <article className="cart-line-row" key={line.sku}>
        <div className="cart-line-primary">
          <div className="cart-product-copy"><span>{product ? purchaseModeLabel(product) : "Sản phẩm"}</span><h2>{product?.name ?? "Sản phẩm không còn"}</h2><p>{product ? `${product.packaging} · ${product.unit}` : "Không tìm thấy thông tin sản phẩm"}</p></div>
          <button aria-label={`Xóa ${customerProductName}`} className="cart-remove-button" onClick={() => void persist(cart.lines.filter((item) => item.sku !== line.sku))} type="button"><Trash2 aria-hidden="true" size={15} /></button>
        </div>
        <div className="cart-line-actions">
          <span className="cart-mode-static">{product ? purchaseModeLabel(product) : "—"}</span>
          <div className="quantity-stepper cart-quantity-stepper" aria-label={`Số lượng ${customerProductName}`}><button aria-label="Giảm số lượng" disabled={line.quantity <= 1} onClick={() => void persist(cart.lines.map((item) => item.sku === line.sku ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item))} type="button"><Minus aria-hidden="true" size={14} /></button><input aria-label={`Nhập số lượng ${customerProductName}`} inputMode="numeric" max={999} min={1} onChange={(event) => { const next = Math.min(999, Math.max(1, Number(event.target.value) || 1)); void persist(cart.lines.map((item) => item.sku === line.sku ? { ...item, quantity: next } : item)); }} onFocus={(event) => event.currentTarget.select()} type="number" value={line.quantity} /><button aria-label="Tăng số lượng" disabled={line.quantity >= 999} onClick={() => void persist(cart.lines.map((item) => item.sku === line.sku ? { ...item, quantity: Math.min(999, item.quantity + 1) } : item))} type="button"><Plus aria-hidden="true" size={14} /></button></div>
          <div className="cart-line-price"><strong>{unitPrice === null ? "—" : formatMoney(unitPrice * line.quantity)}</strong><span>{unitPrice === null ? "Chờ xác nhận giá" : `${formatMoney(unitPrice)} / ${product?.unit ?? "đơn vị"}`}</span></div>
        </div>
        <label className="cart-line-note cart-line-note-compact"><span>Ghi chú cho {customerProductName}</span><input maxLength={180} onBlur={() => void persistCurrentCart()} onChange={(event) => updateLocalNote(line.sku, event.target.value)} placeholder="Ghi chú cho mặt hàng" value={line.note ?? ""} /></label>
      </article>;
    })}</div>
    <div className="cart-summary-card"><div><span>Tạm tính</span><strong>{formatMoney(pricedSubtotal)}</strong></div>{pendingPriceCount > 0 ? <p>{pendingPriceCount} dòng đang chờ xác nhận giá.</p> : null}<Link className="cart-checkout-button" href="/checkout">Xác nhận đơn<ArrowRight aria-hidden="true" size={18} /></Link></div>
  </section>;
}
