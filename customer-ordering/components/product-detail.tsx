"use client";

import Link from "next/link";
import { ArrowLeft, Check, Minus, PackageSearch, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProductVisual } from "@/components/product-visual";
import { announceCartUpdated } from "@/lib/cart-events";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { Product } from "@/lib/contracts";

function formatPrice(product: Product): string {
  if (product.price.status !== "available" || product.price.amount === null) return "Giá dành cho điểm bán sẽ được xác nhận sau";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: product.price.currency, maximumFractionDigits: 0 }).format(product.price.amount);
}
function availabilityText(product: Product): string {
  if (product.availability === "out_of_stock") return "Sản phẩm đang tạm hết hàng";
  if (product.availability === "paused") return "Sản phẩm đang tạm ngưng nhận đơn";
  return "Có thể thêm vào giỏ";
}
function purchaseModeLabel(product: Product): string { return product.purchaseMode === "case" ? "Mua thùng" : "Mua lẻ"; }

export function ProductDetail({ sku }: Readonly<{ sku: string }>) {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [product, setProduct] = useState<Product | null>(null);
  const [familyVariants, setFamilyVariants] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([service.getProductBySku(sku), service.listProducts()]).then(([item, products]) => {
      if (!cancelled) {
        setProduct(item);
        setFamilyVariants(item ? products.filter((candidate) => candidate.familySku === item.familySku).sort((a, b) => a.purchaseMode === b.purchaseMode ? a.sku.localeCompare(b.sku) : a.purchaseMode === "retail" ? -1 : 1) : []);
        setLoaded(true); setQuantity(1);
      }
    }).catch(() => { if (!cancelled) { setProduct(null); setLoaded(true); } });
    return () => { cancelled = true; };
  }, [sku, service]);

  async function addToCart() {
    if (!product || product.availability !== "available") return;
    const cart = await service.getCart();
    const existing = cart.lines.find((line) => line.sku === product.sku);
    const lines = existing
      ? cart.lines.map((line) => line.sku === product.sku ? { ...line, quantity: Math.min(999, line.quantity + quantity) } : line)
      : [...cart.lines, { sku: product.sku, quantity }];
    await service.saveCart({ lines, updatedAt: new Date().toISOString() });
    announceCartUpdated(); setAdded(true); window.setTimeout(() => setAdded(false), 1800);
  }

  if (!loaded) return <section aria-label="Đang tải chi tiết sản phẩm" className="product-detail-screen is-loading"><div className="product-detail-visual-skeleton" /><div className="product-detail-copy-skeleton" /></section>;
  if (!product) return <section className="catalog-state-card product-not-found"><PackageSearch aria-hidden="true" size={32} /><strong>Không tìm thấy SKU</strong><span>Kiểm tra lại SKU hoặc tìm sản phẩm trong danh mục.</span><Link className="secondary-link-button" href="/products"><ArrowLeft aria-hidden="true" size={17} /> Về danh mục</Link></section>;
  const canOrder = product.availability === "available";

  return <article className="product-detail-screen">
    <Link className="product-back-link" href="/products"><ArrowLeft aria-hidden="true" size={17} />Danh mục sản phẩm</Link>
    <ProductVisual product={product} />
    <div className="product-detail-copy">
      <div className="catalog-product-meta"><span>{product.sku}</span><span className={`availability-${product.availability}`}>{availabilityText(product)}</span></div>
      <div><p className="product-detail-brand">{product.brand} · {product.productType}</p><h1>{product.name}</h1></div>
      {familyVariants.length > 1 ? <div aria-label="Chọn quy cách mua" className="product-detail-variant-switch">{familyVariants.map((variant) => <Link aria-current={variant.sku === product.sku ? "page" : undefined} className={variant.sku === product.sku ? "is-active" : ""} href={`/products/${encodeURIComponent(variant.sku)}`} key={variant.sku}><span>{purchaseModeLabel(variant)}</span><small>{variant.packaging}</small></Link>)}</div> : null}
      <p className="product-detail-description">{product.description || `${product.brand} · ${product.name}`}</p>
      <dl className="product-spec-grid product-spec-grid-expanded">
        <div><dt>SKU</dt><dd>{product.sku}</dd></div><div><dt>Quy cách mua</dt><dd>{purchaseModeLabel(product)}</dd></div><div><dt>Quy cách</dt><dd>{product.packaging}</dd></div><div><dt>Thương hiệu</dt><dd>{product.brand}</dd></div><div><dt>Loại</dt><dd>{product.productType}</dd></div><div><dt>Vị</dt><dd>{product.flavor ?? "Không áp dụng"}</dd></div><div><dt>Size</dt><dd>{product.size || "—"}</dd></div>
      </dl>
      <div className="product-price-panel"><span>{product.purchaseMode === "case" ? "Giá thùng" : "Giá lẻ"}</span><strong className={product.price.status === "available" ? "" : "is-pending"}>{formatPrice(product)}</strong>{product.price.status !== "available" ? <small>Ứng dụng không tự suy đoán giá khi chưa có bảng giá khách hàng.</small> : null}{product.purchaseMode === "case" ? <small>Giá thùng là giá riêng theo SKU thùng, không lấy giá lẻ nhân số lượng.</small> : null}</div>
      <div className="product-order-panel"><div className="quantity-stepper" aria-label="Chọn số lượng"><button aria-label="Giảm số lượng" disabled={quantity <= 1} onClick={() => setQuantity((current) => Math.max(1, current - 1))} type="button"><Minus aria-hidden="true" size={18} /></button><output aria-live="polite">{quantity}</output><button aria-label="Tăng số lượng" disabled={quantity >= 99} onClick={() => setQuantity((current) => Math.min(99, current + 1))} type="button"><Plus aria-hidden="true" size={18} /></button></div><button className="product-add-primary" disabled={!canOrder} onClick={() => void addToCart()} type="button">{added ? <Check aria-hidden="true" size={19} /> : <ShoppingBag aria-hidden="true" size={19} />}{added ? "Đã thêm vào giỏ" : canOrder ? `Thêm ${product.unit} vào giỏ` : availabilityText(product)}</button></div>
    </div>
  </article>;
}
