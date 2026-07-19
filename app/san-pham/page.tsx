import type { Metadata } from "next";
import { ProductCatalog } from "@/components/product-catalog";
import { QuoteCta } from "@/components/quote-cta";
import { productApplications, productCategories, productOrigins, products } from "@/data/products";
import { getAbsoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Ngành hàng",
  description:
    "Khám phá các ngành hàng của Hưng Phát gồm nguyên liệu pha chế, nguyên liệu mì cay và hàng đông lạnh.",
  alternates: { canonical: "/san-pham" },
  openGraph: {
    title: "Ngành hàng Hưng Phát",
    description: "Tìm kiếm và lọc theo ngành hàng phù hợp với nhu cầu kinh doanh.",
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
          <p className="eyebrow">NGÀNH HÀNG</p>
          <h1>Tìm đúng ngành hàng cho nhu cầu kinh doanh</h1>
          <p>
            Tìm kiếm theo tên ngành hàng hoặc nhu cầu. Nếu danh mục chưa có dữ liệu thật phù hợp, vui lòng gửi yêu cầu để
            được tư vấn trực tiếp.
          </p>
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
