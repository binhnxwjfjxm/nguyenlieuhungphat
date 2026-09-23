import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PackageSearch } from "lucide-react";
import { CompanyContactCta } from "@/components/company-contact-cta";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { categories } from "@/data/site";
import { groupProductFamilies, productVariantLabel, products } from "@/data/products";
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
  const families = groupProductFamilies(categoryProducts);

  return (
    <main className="content-page content-page-v2">
      <section className="page-hero">
        <div className="container page-hero-inner page-hero-with-image">
          <div>
            <p className="eyebrow">NGÀNH HÀNG</p>
            <h1 className="gradient-heading">{category.title}</h1>
            <p>{category.description}</p>
            <div className="hero-actions">
              <Link className="button button-secondary" href="/nganh-hang"><ArrowLeft size={16} /> Tất cả ngành hàng</Link>
              <Link className="button button-primary" href={`/san-pham?category=${category.slug}`}>Xem danh mục giới thiệu</Link>
            </div>
          </div>
          <div className="page-hero-image">
            <Image src={category.image} alt={category.title} fill priority sizes="(max-width: 900px) 100vw, 40vw" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {families.length ? (
            <div className="section-spaced">
              <div className="section-heading split-heading company-section-heading">
                <div>
                  <p className="eyebrow">DÒNG SẢN PHẨM</p>
                  <h2 className="gradient-heading">Nội dung đang có trong ngành hàng</h2>
                  <p>Các biến thể cùng dòng được gom lại để danh mục gọn và dễ tham khảo hơn.</p>
                </div>
                <span className="section-kicker">{families.length} dòng sản phẩm</span>
              </div>
              <div className="product-grid product-grid-tight">
                {families.map((family, index) => (
                  <Reveal key={family.key} delay={index * 0.025}>
                    <ProductCard
                      compact
                      product={family.primary}
                      displayName={family.name}
                      variantCount={family.variants.length}
                      variantLabels={family.variants.map((product) => productVariantLabel(product, family))}
                    />
                  </Reveal>
                ))}
              </div>
            </div>
          ) : (
            <Reveal>
              <div className="catalog-empty">
                <PackageSearch size={32} />
                <h2 className="gradient-heading">Danh mục đang cập nhật</h2>
                <p>Hưng Phát đang tiếp tục bổ sung thông tin cho ngành hàng này.</p>
                <Link className="button button-primary" href="/lien-he">Liên hệ Công Ty</Link>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <CompanyContactCta />
    </main>
  );
}
