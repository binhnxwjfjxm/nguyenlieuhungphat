"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Product, ProductCategory } from "@/data/products";
import { normalizeSearchText } from "@/lib/search";
import { ProductCard } from "./product-card";

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
          product.englishName,
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

  const hasFilters = Boolean(query || category || origin || application || sort !== "featured");
  const isEmptyCatalog = products.length === 0;

  function resetFilters() {
    setQuery("");
    setCategory("");
    setOrigin("");
    setApplication("");
    setSort("featured");
  }

  return (
    <div className="catalog-layout">
      <div className="catalog-toolbar">
        <label className="catalog-search">
          <Search size={19} />
          <input
            type="search"
            placeholder="Tìm ngành hàng, nhu cầu..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <button type="button" aria-label="Xóa từ khóa" onClick={() => setQuery("")}>
              <X size={17} />
            </button>
          ) : null}
        </label>
        <button className="button button-ghost catalog-filter-toggle" type="button" onClick={() => setMobileFiltersOpen((value) => !value)}>
          <SlidersHorizontal size={17} /> Bộ lọc
        </button>
      </div>

      <div className="catalog-category-row" aria-label="Lọc theo danh mục">
        <button className={`filter-chip${category === "" ? " active" : ""}`} type="button" onClick={() => setCategory("")}>
          Tất cả
        </button>
        {categories.map((item) => (
          <button
            className={`filter-chip${category === item.slug ? " active" : ""}`}
            type="button"
            onClick={() => setCategory(item.slug)}
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
            <select value={origin} onChange={(event) => setOrigin(event.target.value)}>
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
            <select value={application} onChange={(event) => setApplication(event.target.value)}>
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
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
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
            <div className="product-grid catalog-grid">
              {filteredProducts.map((product) => (
                <ProductCard product={product} key={product.slug} />
              ))}
            </div>
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
    </div>
  );
}
