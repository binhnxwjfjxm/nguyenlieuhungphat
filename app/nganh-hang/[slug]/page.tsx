import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { QuoteCta } from "@/components/quote-cta";
import { Reveal } from "@/components/reveal";
import { categories } from "@/data/site";
import { products } from "@/data/products";
import { getCustomerOrderingCategoryUrl } from "@/lib/contact";
import { getAbsoluteUrl } from "@/lib/site";

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) return {};

  return {
    title: category.title,
    description: category.description,
    alternates: { canonical: `/nganh-hang/${category.slug}` },
    openGraph: {
      title: `${category.title} | Hưng Phát`,
      description: category.description,
      url: getAbsoluteUrl(`/nganh-hang/${category.slug}`),
      images: [{ url: getAbsoluteUrl(category.image), alt: category.title }],
    },
  };
}

export default async function NganhHangDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const categoryProducts = products.filter((product) => product.categorySlug === category.slug);
  const orderingUrl = getCustomerOrderingCategoryUrl(category.orderingCategoryId);

  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="container page-hero-inner page-hero-with-image">
          <div>
            <p className="eyebrow">NGÀNH HÀNG</p>
            <h1 className="gradient-heading">{category.title}</h1>
            <p>{category.description}</p>
            <div className="hero-actions">
              <Link className="button button-secondary" href="/nganh-hang">
                <ArrowLeft size={17} /> Quay lại cẩm nang
              </Link>
              <a className="button button-primary" href={orderingUrl}>
                Xem catalog &amp; đặt hàng
              </a>
            </div>
          </div>
          <div className="page-hero-image">
            <Image src={category.image} alt={category.title} fill priority sizes="(max-width: 900px) 100vw, 40vw" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {categoryProducts.length ? (
            <div className="section-spaced">
              <div className="section-heading split-heading">
                <div>
                  <p className="eyebrow">SẢN PHẨM CÙNG NHÓM</p>
                  <h2 className="gradient-heading">Danh sách phù hợp</h2>
                </div>
                <span className="section-kicker">{categoryProducts.length} sản phẩm</span>
              </div>
              <div className="product-grid product-grid-tight">
                {categoryProducts.map((product, index) => (
                  <Reveal key={product.slug} delay={index * 0.04}>
                    <ProductCard compact product={product} />
                  </Reveal>
                ))}
              </div>
            </div>
          ) : (
            <Reveal>
              <div className="catalog-empty">
                <PackageSearch size={34} />
                <h2 className="gradient-heading">Danh mục website đang cập nhật</h2>
                <p>Catalog đặt hàng đầy đủ vẫn có thể được xem theo đúng ngành hàng này.</p>
                <a className="button button-primary" href={orderingUrl}>
                  Xem catalog đầy đủ &amp; đặt hàng
                </a>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <QuoteCta />
        </div>
      </section>
    </main>
  );
}
