import type { Metadata } from "next";
import Image from "next/image";
import { CompanyContactCta } from "@/components/company-contact-cta";
import { ProductCatalog } from "@/components/product-catalog";
import { productApplications, productCategories, productOrigins, products } from "@/data/products";
import { getAbsoluteUrl } from "@/lib/site";
import { siteAssets } from "@/lib/site-assets";

export const metadata: Metadata = {
  title: "Danh mục giới thiệu",
  description: "Danh mục giới thiệu các nhóm nguyên liệu, thực phẩm, bao bì và gia vị Hưng Phát đang kinh doanh.",
  alternates: { canonical: "/san-pham" },
  openGraph: {
    title: "Danh mục giới thiệu | Hưng Phát",
    description: "Khám phá các dòng sản phẩm theo ngành hàng, nhóm hàng và nhãn hàng trong danh mục Hưng Phát.",
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
    <main className="catalog-page presentation-catalog-page">
      <section className="catalog-hero">
        <div className="container catalog-hero-inner page-hero-with-image">
          <div>
            <p className="eyebrow">DANH MỤC GIỚI THIỆU</p>
            <h1 className="gradient-heading">Khám phá các dòng sản phẩm</h1>
            <p>Tìm theo tên, ngành hàng hoặc nhãn hàng để xem thông tin sản phẩm Hưng Phát đang giới thiệu.</p>
          </div>
          <div className="page-hero-image">
            <Image src={siteAssets.pageHero.sanPham} alt="Danh mục giới thiệu Hưng Phát" fill priority sizes="(max-width: 900px) 100vw, 40vw" />
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
        </div>
      </section>

      <CompanyContactCta />
    </main>
  );
}
