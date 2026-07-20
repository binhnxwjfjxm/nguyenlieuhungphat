import type { Metadata } from "next";
import { ProductCatalog } from "@/components/product-catalog";
import { QuoteCta } from "@/components/quote-cta";
import { productApplications, productCategories, productOrigins, products } from "@/data/products";
import { getAbsoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Ngành hàng",
  description:
    "Ba ngành hàng chính của Hưng Phát: nguyên liệu pha chế, nguyên liệu mì cay và hàng đông lạnh.",
  alternates: { canonical: "/san-pham" },
  openGraph: {
    title: "Ngành hàng Hưng Phát",
    description: "Ba ngành hàng chính của Hưng Phát.",
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
          <h1 className="gradient-heading">Tìm đúng nhóm hàng</h1>
          <p>Tìm theo tên ngành hàng hoặc nhu cầu để vào đúng nhóm nhanh hơn.</p>
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
