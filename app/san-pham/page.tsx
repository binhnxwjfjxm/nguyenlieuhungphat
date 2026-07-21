import type { Metadata } from "next";
import { ProductCatalog } from "@/components/product-catalog";
import { QuoteCta } from "@/components/quote-cta";
import { productApplications, productCategories, productOrigins, products } from "@/data/products";
import { getAbsoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Danh mục sản phẩm",
  description:
    "Danh mục sản phẩm Hưng Phát dành cho khách mua sỉ, quán, cửa hàng và đại lý.",
  alternates: { canonical: "/san-pham" },
  openGraph: {
    title: "Danh mục sản phẩm Hưng Phát",
    description: "Danh mục sản phẩm Hưng Phát dành cho khách mua sỉ, quán, cửa hàng và đại lý.",
    url: getAbsoluteUrl("/san-pham"),
  },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="catalog-page">
      <section className="catalog-hero">
        <div className="container catalog-hero-inner">
          <p className="eyebrow">DANH MỤC SẢN PHẨM</p>
          <h1 className="gradient-heading">Tìm nguyên liệu phù hợp</h1>
          <p>Tìm theo tên, nhóm hàng hoặc nhu cầu để vào đúng danh mục nhanh hơn cho quán, cửa hàng và đại lý.</p>
        </div>
      </section>

      <section className="section catalog-section">
        <div className="container">
          <ProductCatalog
            products={products}
            categories={productCategories}
            origins={productOrigins}
            applications={productApplications}
            initialCategory={params.category ?? ""}
            initialQuery={params.q ?? ""}
          />
          <QuoteCta />
        </div>
      </section>
    </main>
  );
}
