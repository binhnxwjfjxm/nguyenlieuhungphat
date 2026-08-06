"use client";

import Link from "next/link";
import {
  ArrowRight,
  Minus,
  PackageOpen,
  Plus,
  ShoppingBasket,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { announceCartUpdated } from "@/lib/cart-events";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { Cart, CartLine, Product } from "@/lib/contracts";

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CartScreen() {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [cart, setCart] = useState<Cart | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void Promise.all([service.getCart(), service.listProducts()])
      .then(([nextCart, nextProducts]) => {
        if (!cancelled) {
          setCart(nextCart);
          setProducts(nextProducts);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Không tải được giỏ hàng.");
      });
    return () => {
      cancelled = true;
    };
  }, [service]);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const displayLines = cart?.lines.map((line) => ({ line, product: productMap.get(line.productId) ?? null })) ?? [];
  const pricedSubtotal = displayLines.reduce((total, item) => {
    const amount =
      item.product?.price.status === "available" ? item.product.price.amount : null;
    return total + (amount === null || amount === undefined ? 0 : amount * item.line.quantity);
  }, 0);
  const pendingPriceCount = displayLines.filter(
    (item) => item.product?.price.status !== "available" || item.product.price.amount === null,
  ).length;
  const totalQuantity = displayLines.reduce((total, item) => total + item.line.quantity, 0);

  async function persist(lines: CartLine[]) {
    const nextCart: Cart = { lines, updatedAt: new Date().toISOString() };
    setCart(nextCart);
    await service.saveCart(nextCart);
    announceCartUpdated();
  }

  function updateLocalNote(productId: string, note: string) {
    setCart((current) =>
      current
        ? {
            ...current,
            lines: current.lines.map((line) =>
              line.productId === productId ? { ...line, note } : line,
            ),
          }
        : current,
    );
  }

  async function persistCurrentCart() {
    if (cart) await service.saveCart({ ...cart, updatedAt: new Date().toISOString() });
  }

  if (error) {
    return (
      <section className="catalog-state-card cart-state-card is-error" role="alert">
        <PackageOpen aria-hidden="true" size={30} />
        <strong>Chưa tải được giỏ hàng</strong>
        <span>{error}</span>
      </section>
    );
  }

  if (!cart) {
    return (
      <section aria-label="Đang tải giỏ hàng" className="cart-screen">
        <div className="cart-line-card is-skeleton" />
        <div className="cart-line-card is-skeleton" />
      </section>
    );
  }

  if (displayLines.length === 0) {
    return (
      <section className="cart-empty-screen">
        <span className="cart-empty-icon">
          <ShoppingBasket aria-hidden="true" size={34} />
        </span>
        <p className="eyebrow">Giỏ hàng</p>
        <h1>Chưa có sản phẩm</h1>
        <p>Chọn từ danh mục hoặc dùng màn Đặt nhanh để nhập nhiều mặt hàng.</p>
        <div className="cart-empty-actions">
          <Link className="primary-link-button" href="/quick-order">
            Đặt hàng nhanh
          </Link>
          <Link className="secondary-link-button" href="/products">
            Xem sản phẩm
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-screen">
      <div className="cart-heading">
        <div>
          <p className="eyebrow">Kiểm tra trước khi đặt</p>
          <h1>Giỏ hàng của bạn</h1>
          <p>{displayLines.length} dòng · {totalQuantity} sản phẩm</p>
        </div>
        <button
          className="cart-clear-button"
          onClick={() => void persist([])}
          type="button"
        >
          <Trash2 aria-hidden="true" size={16} />
          Xóa tất cả
        </button>
      </div>

      <div className="cart-line-list">
        {displayLines.map(({ line, product }) => {
          const unitPrice =
            product?.price.status === "available" ? product.price.amount : null;
          return (
            <article className="cart-line-card" key={line.productId}>
              <div className="cart-line-top">
                <Link className="cart-product-copy" href={`/products/${line.productId}`}>
                  <span>{product?.code ?? "Sản phẩm không còn"}</span>
                  <h2>{product?.name ?? line.productId}</h2>
                  <p>{product ? `${product.packaging} · ${product.unit}` : "Không tìm thấy thông tin sản phẩm"}</p>
                </Link>
                <button
                  aria-label={`Xóa ${product?.name ?? line.productId}`}
                  className="cart-remove-button"
                  onClick={() =>
                    void persist(cart.lines.filter((item) => item.productId !== line.productId))
                  }
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={17} />
                </button>
              </div>

              <div className="cart-line-controls">
                <div className="quantity-stepper cart-quantity-stepper" aria-label={`Số lượng ${product?.name ?? line.productId}`}>
                  <button
                    aria-label="Giảm số lượng"
                    disabled={line.quantity <= 1}
                    onClick={() =>
                      void persist(
                        cart.lines.map((item) =>
                          item.productId === line.productId
                            ? { ...item, quantity: Math.max(1, item.quantity - 1) }
                            : item,
                        ),
                      )
                    }
                    type="button"
                  >
                    <Minus aria-hidden="true" size={16} />
                  </button>
                  <input
                    aria-label={`Nhập số lượng ${product?.name ?? line.productId}`}
                    inputMode="numeric"
                    max={999}
                    min={1}
                    onChange={(event) => {
                      const next = Math.min(999, Math.max(1, Number(event.target.value) || 1));
                      void persist(
                        cart.lines.map((item) =>
                          item.productId === line.productId
                            ? { ...item, quantity: next }
                            : item,
                        ),
                      );
                    }}
                    onFocus={(event) => event.currentTarget.select()}
                    type="number"
                    value={line.quantity}
                  />
                  <button
                    aria-label="Tăng số lượng"
                    disabled={line.quantity >= 999}
                    onClick={() =>
                      void persist(
                        cart.lines.map((item) =>
                          item.productId === line.productId
                            ? { ...item, quantity: Math.min(999, item.quantity + 1) }
                            : item,
                        ),
                      )
                    }
                    type="button"
                  >
                    <Plus aria-hidden="true" size={16} />
                  </button>
                </div>

                <div className="cart-line-price">
                  <span>{unitPrice === null ? "Chờ xác nhận giá" : `${formatMoney(unitPrice)} / ${product?.unit ?? "đơn vị"}`}</span>
                  <strong>{unitPrice === null ? "—" : formatMoney(unitPrice * line.quantity)}</strong>
                </div>
              </div>

              <label className="cart-line-note">
                <span>Ghi chú mặt hàng</span>
                <input
                  maxLength={180}
                  onBlur={() => void persistCurrentCart()}
                  onChange={(event) => updateLocalNote(line.productId, event.target.value)}
                  placeholder="Ví dụ: giao nguyên bao, gọi trước..."
                  value={line.note ?? ""}
                />
              </label>
            </article>
          );
        })}
      </div>

      <div className="cart-summary-card">
        <div>
          <span>Tạm tính các dòng có giá</span>
          <strong>{formatMoney(pricedSubtotal)}</strong>
        </div>
        {pendingPriceCount > 0 ? (
          <p>{pendingPriceCount} dòng chưa có giá sẽ được Hưng Phát xác nhận sau.</p>
        ) : (
          <p>Giá hiển thị hiện là giá dự kiến trong dữ liệu mock.</p>
        )}
        <Link className="cart-checkout-button" href="/checkout">
          Tiếp tục xác nhận đơn
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </div>
    </section>
  );
}
