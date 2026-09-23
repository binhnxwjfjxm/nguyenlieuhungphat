import type { Metadata } from "next";
import Image from "next/image";
import { ProductCatalog } from "@/components/product-catalog";
import { QuoteCta } from "@/components/quote-cta";
import { productApplications, productCategories, productOrigins, products } from "@/data/products";
import { getAbsoluteUrl } from "@/lib/site";
import { siteAssets } from "@/lib/site-assets";

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
        <div className="container catalog-hero-inner page-hero-with-image">
          <div>
            <p className="eyebrow">DANH MỤC SẢN PHẨM</p>
            <h1 className="gradient-heading">Tìm nguyên liệu phù hợp</h1>
            <p>Tìm theo tên, nhóm hàng hoặc nhu cầu để vào đúng danh mục nhanh hơn.</p>
          </div>
          <div className="page-hero-image">
            <Image
              src={siteAssets.pageHero.sanPham}
              alt="Danh mục sản phẩm Hưng Phát"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 40vw"
            />
          </div>
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
