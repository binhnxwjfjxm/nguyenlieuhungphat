import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Layers3, Package, Tag } from "lucide-react";
import { notFound } from "next/navigation";
import { CompanyContactCta } from "@/components/company-contact-cta";
import { ProductCard } from "@/components/product-card";
import familyStyles from "@/components/product-family.module.css";
import {
  getProductBySlug,
  getProductFamily,
  getRelatedProducts,
  productVariantLabel,
  products,
} from "@/data/products";
import { getAbsoluteUrl } from "@/lib/site";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: `/san-pham/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} | Hưng Phát`,
      description: product.shortDescription,
      url: getAbsoluteUrl(`/san-pham/${product.slug}`),
      images: [{ url: getAbsoluteUrl(product.image), alt: product.name }],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const family = getProductFamily(product);
  const familyVariants = family?.variants ?? [product];
  const relatedProducts = getRelatedProducts(product);
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [getAbsoluteUrl(product.image)],
    description: product.shortDescription,
    category: product.category,
    brand: { "@type": "Brand", name: product.brand || "Hưng Phát" },
  };

  return (
    <main className="product-detail-page presentation-product-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />

      <section className="product-detail-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Đường dẫn">
            <Link href="/">Trang chủ</Link><span>/</span>
            <Link href="/san-pham">Danh mục giới thiệu</Link><span>/</span>
            <span>{product.name}</span>
          </nav>

          <div className="product-detail-grid">
            <div className="product-detail-image">
              <Image src={product.image} alt={product.name} fill priority sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
            <div className="product-detail-copy">
              <p className="eyebrow">{product.category}</p>
              <h1 className="gradient-heading">{product.name}</h1>
              {product.brand ? <p className="product-detail-brand">{product.brand}</p> : null}
              <p className="product-detail-lead">{product.shortDescription}</p>

              {family && familyVariants.length > 1 ? (
                <div className={familyStyles.detailFamily}>
                  <div>
                    <strong>{family.name}</strong>
                    <span>{familyVariants.length} lựa chọn vị / quy cách</span>
                  </div>
                  <div className={familyStyles.detailVariants} aria-label="Các lựa chọn vị hoặc quy cách">
                    {familyVariants.map((variant) => (
                      <Link
                        className={`${familyStyles.detailVariant}${variant.slug === product.slug ? ` ${familyStyles.active}` : ""}`}
                        href={`/san-pham/${variant.slug}`}
                        key={variant.slug}
                        aria-current={variant.slug === product.slug ? "page" : undefined}
                      >
                        {productVariantLabel(variant, family)}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="product-meta-grid">
                <div><Layers3 size={19} /><span>Ngành hàng<strong>{product.origin}</strong></span></div>
                <div><Package size={19} /><span>Nhóm hàng<strong>{product.category}</strong></span></div>
                {product.brand ? <div><Tag size={19} /><span>Nhãn hàng<strong>{product.brand}</strong></span></div> : null}
              </div>

              <div className="product-detail-actions">
                <Link className="button button-primary" href="/lien-he">Liên hệ Công Ty</Link>
                <Link className="button button-secondary" href={`/nganh-hang/${product.categorySlug}`}>Xem ngành hàng</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section product-info-section">
        <div className="container product-info-grid">
          <article className="product-copy-card">
            <p className="eyebrow">THÔNG TIN SẢN PHẨM</p>
            <h2 className="gradient-heading">Đặc điểm &amp; ứng dụng</h2>
            <p>{product.description}</p>
            <div className="feature-grid">
              {product.features.map((feature) => <div key={feature}><Check size={17} />{feature}</div>)}
            </div>
          </article>

          <aside className="specification-card">
            <h2 className="gradient-heading">Thông tin tham khảo</h2>
            <dl>
              {product.specifications.map((specification) => (
                <div key={specification.label}>
                  <dt>{specification.label}</dt>
                  <dd>{specification.value}</dd>
                </div>
              ))}
            </dl>
            <small>Thông tin được trình bày theo dữ liệu danh mục hiện có và có thể được cập nhật khi nguồn dữ liệu thay đổi.</small>
          </aside>
        </div>
      </section>

      <section className="section-tight application-section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">ỨNG DỤNG</p>
            <h2 className="gradient-heading">Phạm vi tham khảo</h2>
          </div>
          <div className="application-list">
            {product.applications.map((application) => <span key={application}>{application}</span>)}
          </div>
        </div>
      </section>

      {relatedProducts.length ? (
        <section className="section related-products-section">
          <div className="container">
            <div className="section-heading split-heading">
              <div><p className="eyebrow">GỢI Ý THÊM</p><h2 className="gradient-heading">Sản phẩm cùng nhóm</h2></div>
              <Link className="text-link" href="/san-pham"><ArrowLeft size={16} /> Xem toàn bộ danh mục</Link>
            </div>
            <div className="product-grid">
              {relatedProducts.map((item) => <ProductCard product={item} compact key={item.slug} />)}
            </div>
          </div>
        </section>
      ) : null}

      <CompanyContactCta />
    </main>
  );
}
