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

  useEffect(() => {
    let cancelled = false;
    void Promise.all([service.getCart(), service.listProducts()]).then(([nextCart, nextProducts]) => {
      if (!cancelled) { setCart(nextCart); setProducts(nextProducts); }
    }).catch(() => { if (!cancelled) setError("Không tải được giỏ hàng."); });
    return () => { cancelled = true; };
  }, [service]);

  const productMap = useMemo(() => new Map(products.map((product) => [product.sku, product])), [products]);
  const familyMap = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const product of products) map.set(product.familySku, [...(map.get(product.familySku) ?? []), product]);
    for (const variants of map.values()) variants.sort((a, b) => a.purchaseMode === b.purchaseMode ? a.sku.localeCompare(b.sku) : a.purchaseMode === "retail" ? -1 : 1);
    return map;
  }, [products]);
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
  async function switchVariant(sourceSku: string, targetSku: string) {
    if (!cart || sourceSku === targetSku) return;
    const source = cart.lines.find((line) => line.sku === sourceSku);
    if (!source) return;
    const existingTarget = cart.lines.find((line) => line.sku === targetSku);
    const remaining = cart.lines.filter((line) => line.sku !== sourceSku && line.sku !== targetSku);
    const merged: CartLine = {
      sku: targetSku,
      quantity: Math.min(999, source.quantity + (existingTarget?.quantity ?? 0)),
      note: existingTarget?.note || source.note,
    };
    await persist([...remaining, merged]);
  }

  if (error) return <section className="catalog-state-card cart-state-card is-error" role="alert"><PackageOpen aria-hidden="true" size={30} /><strong>Chưa tải được giỏ hàng</strong><span>{error}</span></section>;
  if (!cart) return <section aria-label="Đang tải giỏ hàng" className="cart-screen"><div className="cart-line-card is-skeleton" /><div className="cart-line-card is-skeleton" /></section>;
  if (displayLines.length === 0) return <section className="cart-empty-screen"><span className="cart-empty-icon"><ShoppingBasket aria-hidden="true" size={34} /></span><h1>Giỏ hàng trống</h1><div className="cart-empty-actions"><Link className="primary-link-button" href="/quick-order">Đặt nhanh</Link><Link className="secondary-link-button" href="/products">Sản phẩm</Link></div></section>;

  return <section className="cart-screen">
    <div className="cart-heading cart-heading-compact"><div><strong>{displayLines.length} dòng · {totalQuantity} sản phẩm</strong></div><button className="cart-clear-button" onClick={() => void persist([])} type="button"><Trash2 aria-hidden="true" size={16} />Xóa tất cả</button></div>
    <div className="cart-line-list">{displayLines.map(({ line, product }) => {
      const unitPrice = product?.price.status === "available" ? product.price.amount : null;
      const familyVariants = product ? (familyMap.get(product.familySku) ?? []) : [];
      return <article className="cart-line-card" key={line.sku}><div className="cart-line-top"><div className="cart-product-copy"><span>{line.sku}</span><h2>{product?.name ?? "Sản phẩm không còn"}</h2><p>{product ? `${product.packaging} · ${product.unit}` : "Không tìm thấy thông tin sản phẩm"}</p></div><button aria-label={`Xóa ${product?.name ?? line.sku}`} className="cart-remove-button" onClick={() => void persist(cart.lines.filter((item) => item.sku !== line.sku))} type="button"><Trash2 aria-hidden="true" size={17} /></button></div>
        {familyVariants.length > 1 ? <div className="cart-variant-switch" role="group" aria-label={`Chọn mua lẻ hoặc thùng cho ${product?.name ?? line.sku}`}>{familyVariants.map((variant) => <button aria-pressed={variant.sku === line.sku} className={variant.sku === line.sku ? "is-active" : ""} key={variant.sku} onClick={() => void switchVariant(line.sku, variant.sku)} type="button">{purchaseModeLabel(variant)}</button>)}</div> : null}
        <div className="cart-line-controls"><div className="quantity-stepper cart-quantity-stepper" aria-label={`Số lượng ${product?.name ?? line.sku}`}><button aria-label="Giảm số lượng" disabled={line.quantity <= 1} onClick={() => void persist(cart.lines.map((item) => item.sku === line.sku ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item))} type="button"><Minus aria-hidden="true" size={16} /></button><input aria-label={`Nhập số lượng ${product?.name ?? line.sku}`} inputMode="numeric" max={999} min={1} onChange={(event) => { const next = Math.min(999, Math.max(1, Number(event.target.value) || 1)); void persist(cart.lines.map((item) => item.sku === line.sku ? { ...item, quantity: next } : item)); }} onFocus={(event) => event.currentTarget.select()} type="number" value={line.quantity} /><button aria-label="Tăng số lượng" disabled={line.quantity >= 999} onClick={() => void persist(cart.lines.map((item) => item.sku === line.sku ? { ...item, quantity: Math.min(999, item.quantity + 1) } : item))} type="button"><Plus aria-hidden="true" size={16} /></button></div><div className="cart-line-price"><span>{unitPrice === null ? "Chờ xác nhận giá" : `${formatMoney(unitPrice)} / ${product?.unit ?? "đơn vị"}`}</span><strong>{unitPrice === null ? "—" : formatMoney(unitPrice * line.quantity)}</strong></div></div>
        <label className="cart-line-note"><span>Ghi chú</span><input maxLength={180} onBlur={() => void persistCurrentCart()} onChange={(event) => updateLocalNote(line.sku, event.target.value)} placeholder="Ghi chú cho mặt hàng" value={line.note ?? ""} /></label></article>;
    })}</div>
    <div className="cart-summary-card"><div><span>Tạm tính</span><strong>{formatMoney(pricedSubtotal)}</strong></div>{pendingPriceCount > 0 ? <p>{pendingPriceCount} dòng đang chờ xác nhận giá.</p> : null}<Link className="cart-checkout-button" href="/checkout">Xác nhận đơn<ArrowRight aria-hidden="true" size={18} /></Link></div>
  </section>;
}
