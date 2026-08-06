"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Minus,
  PackageSearch,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { announceCartUpdated } from "@/lib/cart-events";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { Product } from "@/lib/contracts";
import { ProductVisual } from "@/components/product-visual";

function formatPrice(product: Product): string {
  if (product.price.status !== "available" || product.price.amount === null) {
    return "Giá dành cho điểm bán sẽ được xác nhận sau";
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: product.price.currency,
    maximumFractionDigits: 0,
  }).format(product.price.amount);
}

function availabilityText(product: Product): string {
  if (product.availability === "out_of_stock") return "Sản phẩm đang tạm hết hàng";
  if (product.availability === "paused") return "Sản phẩm đang tạm ngưng nhận đơn";
  return "Có thể thêm vào giỏ";
}

export function ProductDetail({ productId }: Readonly<{ productId: string }>) {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [product, setProduct] = useState<Product | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void service.getProductById(productId).then((item) => {
      if (!cancelled) {
        setProduct(item);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [productId, service]);

  async function addToCart() {
    if (!product || product.availability !== "available") return;
    const cart = await service.getCart();
    const existing = cart.lines.find((line) => line.productId === product.id);
    const lines = existing
      ? cart.lines.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        )
      : [...cart.lines, { productId: product.id, quantity }];
    await service.saveCart({ lines, updatedAt: new Date().toISOString() });
    announceCartUpdated();
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  if (!loaded) {
    return (
      <section aria-label="Đang tải chi tiết sản phẩm" className="product-detail-screen is-loading">
        <div className="product-detail-visual-skeleton" />
        <div className="product-detail-copy-skeleton" />
      </section>
    );
  }

  if (!product) {
    return (
      <section className="catalog-state-card product-not-found">
        <PackageSearch aria-hidden="true" size={32} />
        <strong>Không tìm thấy sản phẩm</strong>
        <span>Sản phẩm có thể đã được đổi mã hoặc tạm ẩn.</span>
        <Link className="secondary-link-button" href="/products">
          <ArrowLeft aria-hidden="true" size={17} /> Về danh mục
        </Link>
      </section>
    );
  }

  const canOrder = product.availability === "available";

  return (
    <article className="product-detail-screen">
      <Link className="product-back-link" href="/products">
        <ArrowLeft aria-hidden="true" size={17} />
        Danh mục sản phẩm
      </Link>

      <ProductVisual product={product} />

      <div className="product-detail-copy">
        <div className="catalog-product-meta">
          <span>{product.code}</span>
          <span className={`availability-${product.availability}`}>
            {availabilityText(product)}
          </span>
        </div>
        <h1>{product.name}</h1>
        <p className="product-detail-description">{product.description}</p>

        <dl className="product-spec-grid">
          <div>
            <dt>Quy cách</dt>
            <dd>{product.packaging}</dd>
          </div>
          <div>
            <dt>Đơn vị đặt</dt>
            <dd>{product.unit}</dd>
          </div>
        </dl>

        <div className="product-price-panel">
          <span>Giá tham khảo</span>
          <strong className={product.price.status === "available" ? "" : "is-pending"}>
            {formatPrice(product)}
          </strong>
          {product.price.status !== "available" ? (
            <small>Ứng dụng không tự suy đoán giá khi chưa có bảng giá khách hàng.</small>
          ) : null}
        </div>

        <div className="product-order-panel">
          <div className="quantity-stepper" aria-label="Chọn số lượng">
            <button
              aria-label="Giảm số lượng"
              disabled={quantity <= 1}
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              type="button"
            >
              <Minus aria-hidden="true" size={18} />
            </button>
            <output aria-live="polite">{quantity}</output>
            <button
              aria-label="Tăng số lượng"
              disabled={quantity >= 99}
              onClick={() => setQuantity((current) => Math.min(99, current + 1))}
              type="button"
            >
              <Plus aria-hidden="true" size={18} />
            </button>
          </div>

          <button
            className="product-add-primary"
            disabled={!canOrder}
            onClick={() => void addToCart()}
            type="button"
          >
            {added ? <Check aria-hidden="true" size={19} /> : <ShoppingBag aria-hidden="true" size={19} />}
            {added ? "Đã thêm vào giỏ" : canOrder ? "Thêm vào giỏ" : availabilityText(product)}
          </button>
        </div>
      </div>
    </article>
  );
}
