"use client";

import Image from "next/image";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Product, ProductCategory } from "@/data/products";
import { normalizeSearchText } from "@/lib/search";
import { HapticLink } from "./haptic-link";
import { ProductCard } from "./product-card";
import { QuoteButton } from "./quote-trigger";

export function ProductCatalog({
  products,
  categories,
  origins,
  applications,
  initialCategory = "",
  initialQuery = "",
}: {
  products: Product[];
  categories: ProductCategory[];
  origins: string[];
  applications: string[];
  initialCategory?: string;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [origin, setOrigin] = useState("");
  const [application, setApplication] = useState("");
  const [sort, setSort] = useState("featured");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    if (origin) params.set("origin", origin);
    if (application) params.set("application", application);
    if (sort !== "featured") params.set("sort", sort);
    const nextUrl = `${window.location.pathname}${params.size ? `?${params.toString()}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [query, category, origin, application, sort]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    const result = products.filter((product) => {
      const searchable = normalizeSearchText(
        [
          product.name,
          product.brand ?? "",
          product.category,
          product.origin,
          product.packaging,
          product.shortDescription,
          ...product.applications,
          ...product.features,
          ...product.specifications.map((specification) => `${specification.label} ${specification.value}`),
        ].join(" "),
      );
      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (!category || product.categorySlug === category) &&
        (!origin || product.origin === origin) &&
        (!application || product.applications.includes(application))
      );
    });

    return [...result].sort((a, b) => {
      if (sort === "name-asc") return a.name.localeCompare(b.name, "vi");
      if (sort === "name-desc") return b.name.localeCompare(a.name, "vi");
      return Number(b.featured) - Number(a.featured);
    });
  }, [application, category, origin, products, query, sort]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const selectedPreview = useMemo(() => {
    if (!selectedProduct) return null;
    return filteredProducts.some((product) => product.slug === selectedProduct.slug) ? selectedProduct : null;
  }, [filteredProducts, selectedProduct]);
  const hasFilters = Boolean(query || category || origin || application || sort !== "featured");
  const isEmptyCatalog = products.length === 0;

  function resetFilters() {
    setQuery("");
    setCategory("");
    setOrigin("");
    setApplication("");
    setSort("featured");
    setVisibleCount(24);
  }

  function updateQuery(value: string) {
    setQuery(value);
    setVisibleCount(24);
  }

  function updateCategory(value: string) {
    setCategory(value);
    setVisibleCount(24);
  }

  function updateOrigin(value: string) {
    setOrigin(value);
    setVisibleCount(24);
  }

  function updateApplication(value: string) {
    setApplication(value);
    setVisibleCount(24);
  }

  function updateSort(value: string) {
    setSort(value);
    setVisibleCount(24);
  }

  function closePreview() {
    setSelectedProduct(null);
  }

  useEffect(() => {
    if (!selectedPreview) return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePreview();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedPreview]);

  return (
    <div className="catalog-layout">
      <div className="catalog-toolbar">
        <label className="catalog-search">
          <Search size={19} />
          <input
            type="search"
            placeholder="Tìm sản phẩm, nhu cầu..."
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
          />
          {query ? (
            <button type="button" aria-label="Xóa từ khóa" onClick={() => updateQuery("")}>
              <X size={17} />
            </button>
          ) : null}
        </label>
        <button className="button button-ghost catalog-filter-toggle" type="button" onClick={() => setMobileFiltersOpen((value) => !value)}>
          <SlidersHorizontal size={17} /> Bộ lọc
        </button>
      </div>

      <div className="catalog-category-row" aria-label="Lọc theo danh mục">
        <button className={`filter-chip${category === "" ? " active" : ""}`} type="button" onClick={() => updateCategory("")}>
          Tất cả
        </button>
        {categories.map((item) => (
          <button
            className={`filter-chip${category === item.slug ? " active" : ""}`}
            type="button"
            onClick={() => updateCategory(item.slug)}
            key={item.slug}
          >
            {item.title}
          </button>
        ))}
      </div>

      <div className={`catalog-body${mobileFiltersOpen ? " filters-open" : ""}`}>
        <aside className="catalog-sidebar" aria-label="Bộ lọc sản phẩm">
          <div className="catalog-sidebar-header">
            <strong>Bộ lọc</strong>
            {hasFilters ? <button type="button" onClick={resetFilters}>Đặt lại</button> : null}
          </div>

          <label className="filter-field">
            <span>Xuất xứ</span>
            <select value={origin} onChange={(event) => updateOrigin(event.target.value)}>
              <option value="">Tất cả xuất xứ</option>
              {origins.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Ứng dụng</span>
            <select value={application} onChange={(event) => updateApplication(event.target.value)}>
              <option value="">Tất cả ứng dụng</option>
              {applications.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Sắp xếp</span>
            <select value={sort} onChange={(event) => updateSort(event.target.value)}>
              <option value="featured">Nổi bật trước</option>
              <option value="name-asc">Tên A-Z</option>
              <option value="name-desc">Tên Z-A</option>
            </select>
          </label>
        </aside>

        <section className="catalog-results">
          <div className="catalog-result-header">
            <p>
              <strong>{filteredProducts.length}</strong> sản phẩm phù hợp
            </p>
            {hasFilters ? <button type="button" onClick={resetFilters}>Xóa bộ lọc</button> : null}
          </div>

          {isEmptyCatalog ? (
            <div className="catalog-empty">
              <Search size={34} />
              <h2 className="gradient-heading">Danh mục đang cập nhật</h2>
              <p>Gửi nhu cầu để nhận tư vấn đúng nhóm hàng.</p>
            </div>
          ) : filteredProducts.length ? (
            <>
              <div className="product-grid catalog-grid">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.slug} product={product} onOpen={setSelectedProduct} />
                ))}
              </div>

              {filteredProducts.length > visibleCount ? (
                <div className="catalog-more-row">
                  <button className="button button-ghost catalog-more-button" type="button" onClick={() => setVisibleCount((value) => value + 24)}>
                    Xem thêm {Math.min(24, filteredProducts.length - visibleCount)} sản phẩm
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="catalog-empty">
              <Search size={34} />
              <h2 className="gradient-heading">Chưa tìm thấy sản phẩm phù hợp</h2>
              <p>Thử đổi từ khóa hoặc bỏ bớt bộ lọc.</p>
              <button className="button button-primary" type="button" onClick={resetFilters}>
                Xem tất cả sản phẩm
              </button>
            </div>
          )}
        </section>
      </div>

      {selectedPreview ? (
        <div className="product-modal-overlay" role="presentation" onMouseDown={closePreview}>
          <div
            className="product-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-preview-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="icon-button product-modal-close" type="button" aria-label="Đóng xem nhanh" onClick={closePreview}>
              <X size={18} />
            </button>

            <div className="product-modal-layout">
              <div className="product-modal-media">
                <Image
                  src={selectedPreview.image}
                  alt={selectedPreview.name}
                  fill
                  sizes="(max-width: 900px) 100vw, 44vw"
                />
                <span className="product-tag">{selectedPreview.category}</span>
              </div>

              <div className="product-modal-copy">
                <p className="eyebrow">{selectedPreview.origin}</p>
                <h2 id="product-preview-title">{selectedPreview.name}</h2>
                <p className="product-modal-code">{selectedPreview.brand ?? selectedPreview.origin}</p>
                <p className="product-modal-summary">{selectedPreview.shortDescription}</p>

                <div className="product-modal-meta">
                  <div>
                    <span>Ngành hàng</span>
                    <strong>{selectedPreview.origin}</strong>
                  </div>
                  <div>
                    <span>Nhóm hàng</span>
                    <strong>{selectedPreview.category}</strong>
                  </div>
                  <div>
                    <span>Thương hiệu</span>
                    <strong>{selectedPreview.brand ?? "Hưng Phát"}</strong>
                  </div>
                </div>

                <div className="product-modal-specs">
                  {selectedPreview.specifications.map((specification) => (
                    <div key={specification.label}>
                      <span>{specification.label}</span>
                      <strong>{specification.value}</strong>
                    </div>
                  ))}
                </div>

                <div className="product-modal-actions">
                  <HapticLink className="button button-ghost" href={`/san-pham/${selectedPreview.slug}`}>
                    Mở trang chi tiết
                  </HapticLink>
                  <QuoteButton
                    className="button button-primary"
                    seed={{ product: selectedPreview.name, source: "product-modal", pathname: `/san-pham/${selectedPreview.slug}` }}
                  >
                    Nhận báo giá
                  </QuoteButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
