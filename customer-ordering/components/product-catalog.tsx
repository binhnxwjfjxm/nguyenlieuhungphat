"use client";

import Link from "next/link";
import {
  ArrowRight,
  PackageSearch,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { announceCartUpdated } from "@/lib/cart-events";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { Category, Product } from "@/lib/contracts";
import { ProductVisual } from "@/components/product-visual";

function formatPrice(product: Product): string {
  if (product.price.status !== "available" || product.price.amount === null) {
    return "Liên hệ để nhận giá";
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: product.price.currency,
    maximumFractionDigits: 0,
  }).format(product.price.amount);
}

function availabilityLabel(product: Product): string {
  if (product.availability === "out_of_stock") return "Tạm hết hàng";
  if (product.availability === "paused") return "Tạm ngưng";
  return "Đang bán";
}

export function ProductCatalog() {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [loadedQueryKey, setLoadedQueryKey] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const queryKey = `${activeCategory ?? "all"}:${deferredQuery}`;
  const loading = loadedQueryKey !== queryKey;

  useEffect(() => {
    let cancelled = false;
    void service
      .listCategories()
      .then((items) => {
        if (!cancelled) setCategories(items);
      })
      .catch(() => {
        if (!cancelled) setCatalogError("Không tải được danh mục sản phẩm.");
      });
    return () => {
      cancelled = true;
    };
  }, [service]);

  useEffect(() => {
    let cancelled = false;
    const requestKey = queryKey;
    void service
      .listProducts({ categoryId: activeCategory, query: deferredQuery })
      .then((items) => {
        if (!cancelled) {
          setProducts(items);
          setCatalogError("");
          setLoadedQueryKey(requestKey);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogError("Không tải được sản phẩm. Vui lòng thử lại.");
          setLoadedQueryKey(requestKey);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeCategory, deferredQuery, queryKey, service]);

  async function addOne(product: Product) {
    if (product.availability !== "available") return;
    const cart = await service.getCart();
    const existing = cart.lines.find((line) => line.productId === product.id);
    const lines = existing
      ? cart.lines.map((line) =>
          line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        )
      : [...cart.lines, { productId: product.id, quantity: 1 }];
    await service.saveCart({ lines, updatedAt: new Date().toISOString() });
    announceCartUpdated();
    setAddedProductId(product.id);
    window.setTimeout(() => setAddedProductId((current) => (current === product.id ? null : current)), 1600);
  }

  return (
    <section className="catalog-screen">
      <div className="catalog-intro">
        <div>
          <p className="eyebrow">Nguyên liệu Hưng Phát</p>
          <h1>Danh mục sản phẩm</h1>
          <p>Tìm nhanh theo tên, mã hàng hoặc tên gọi quen thuộc.</p>
        </div>
        <span className="catalog-count">{products.length} sản phẩm</span>
      </div>

      <label className="catalog-search">
        <Search aria-hidden="true" size={19} />
        <span className="sr-only">Tìm sản phẩm</span>
        <input
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ví dụ: bột số 13, HP-BOT-002..."
          type="search"
          value={query}
        />
        {query ? (
          <button aria-label="Xóa nội dung tìm kiếm" onClick={() => setQuery("")} type="button">
            <RotateCcw aria-hidden="true" size={17} />
          </button>
        ) : null}
      </label>

      <div aria-label="Lọc theo danh mục" className="catalog-category-row" role="tablist">
        <button
          aria-selected={activeCategory === null}
          className={activeCategory === null ? "is-active" : ""}
          onClick={() => setActiveCategory(null)}
          role="tab"
          type="button"
        >
          Tất cả
        </button>
        {categories.map((category) => (
          <button
            aria-selected={activeCategory === category.id}
            className={activeCategory === category.id ? "is-active" : ""}
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            role="tab"
            type="button"
          >
            {category.shortName}
          </button>
        ))}
      </div>

      {catalogError ? (
        <div className="catalog-state-card is-error" role="alert">
          <PackageSearch aria-hidden="true" size={28} />
          <strong>Chưa tải được sản phẩm</strong>
          <span>{catalogError}</span>
        </div>
      ) : loading ? (
        <div aria-label="Đang tải sản phẩm" className="catalog-grid">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="catalog-product-card is-skeleton" key={index}>
              <span />
              <span />
              <span />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="catalog-state-card">
          <PackageSearch aria-hidden="true" size={30} />
          <strong>Không tìm thấy sản phẩm</strong>
          <span>Thử đổi từ khóa hoặc chọn danh mục khác.</span>
        </div>
      ) : (
        <div className="catalog-grid">
          {products.map((product) => {
            const canOrder = product.availability === "available";
            return (
              <article className="catalog-product-card" key={product.id}>
                <Link className="catalog-product-link" href={`/products/${product.id}`}>
                  <ProductVisual product={product} />
                  <div className="catalog-product-copy">
                    <div className="catalog-product-meta">
                      <span>{product.code}</span>
                      <span className={`availability-${product.availability}`}>
                        {availabilityLabel(product)}
                      </span>
                    </div>
                    <h2>{product.name}</h2>
                    <p>{product.packaging}</p>
                    <strong className={product.price.status === "available" ? "" : "is-pending"}>
                      {formatPrice(product)}
                    </strong>
                    <span className="catalog-detail-link">
                      Xem chi tiết <ArrowRight aria-hidden="true" size={15} />
                    </span>
                  </div>
                </Link>
                <button
                  aria-label={`Thêm một ${product.unit} ${product.name} vào giỏ`}
                  className="catalog-add-button"
                  disabled={!canOrder}
                  onClick={() => void addOne(product)}
                  type="button"
                >
                  <Plus aria-hidden="true" size={18} />
                  {addedProductId === product.id ? "Đã thêm" : canOrder ? "Thêm giỏ" : availabilityLabel(product)}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
