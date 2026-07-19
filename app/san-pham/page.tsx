import type { Metadata } from "next";
import { ProductCatalog } from "@/components/product-catalog";
import { QuoteCta } from "@/components/quote-cta";
import {
  productApplications,
  productCategories,
  productOrigins,
  products,
} from "@/data/products";

export const metadata: Metadata = {
  title: "Danh mục sản phẩm",
  description: "Khám phá danh mục nguyên liệu công nghiệp, thực phẩm, hóa chất và phụ gia do Hưng Phát cung ứng.",
  alternates: { canonical: "/san-pham" },
  openGraph: {
    title: "Danh mục sản phẩm Hưng Phát",
    description: "Tìm kiếm và lọc nguồn nguyên liệu phù hợp với nhu cầu sản xuất.",
    url: "/san-pham",
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
          <h1>Tìm đúng nguyên liệu cho nhu cầu sản xuất</h1>
          <p>Tìm kiếm theo tên, nhóm sản phẩm, xuất xứ hoặc ứng dụng. Thông tin hiện tại là dữ liệu giới thiệu và sẽ được cập nhật theo nguồn hàng thực tế.</p>
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
