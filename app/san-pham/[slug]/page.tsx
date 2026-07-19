import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, MapPin, Package, PhoneCall } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { QuoteCta } from "@/components/quote-cta";
import { QuoteForm } from "@/components/quote-form";
import { QuoteButton } from "@/components/quote-trigger";
import { getAbsoluteUrl } from "@/lib/site";
import { getProductBySlug, getRelatedProducts, products } from "@/data/products";

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

  const relatedProducts = getRelatedProducts(product);
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    alternateName: product.englishName,
    image: [getAbsoluteUrl(product.image)],
    description: product.shortDescription,
    category: product.category,
    brand: { "@type": "Brand", name: "Hưng Phát" },
  };

  return (
    <main className="product-detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />

      <section className="product-detail-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Đường dẫn">
            <Link href="/">Trang chủ</Link>
            <span>/</span>
            <Link href="/san-pham">Ngành hàng</Link>
            <span>/</span>
            <span>{product.name}</span>
          </nav>

          <div className="product-detail-grid">
            <div className="product-detail-image">
              <Image src={product.image} alt={product.name} fill priority sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
            <div className="product-detail-copy">
              <p className="eyebrow">{product.category}</p>
              <h1>{product.name}</h1>
              <p className="product-detail-english">{product.englishName}</p>
              <p className="product-detail-lead">{product.shortDescription}</p>

              <div className="product-meta-grid">
                <div>
                  <MapPin size={20} />
                  <span>
                    Xuất xứ<strong>{product.origin}</strong>
                  </span>
                </div>
                <div>
                  <Package size={20} />
                  <span>
                    Đóng gói<strong>{product.packaging}</strong>
                  </span>
                </div>
              </div>

              <div className="product-detail-actions">
                <QuoteButton
                  className="button button-primary button-large"
                  seed={{ product: product.name, usage: product.name, source: "product-detail", pathname: `/san-pham/${product.slug}` }}
                >
                  Nhận báo giá
                </QuoteButton>
                <a className="button button-ghost button-large" href="tel:0900123456">
                  <PhoneCall size={18} /> Gọi tư vấn
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section product-info-section">
        <div className="container product-info-grid">
          <article className="product-copy-card">
            <p className="eyebrow">THÔNG TIN SẢN PHẨM</p>
            <h2>Đặc điểm và khả năng ứng dụng</h2>
            <p>{product.description}</p>
            <div className="feature-grid">
              {product.features.map((feature) => (
                <div key={feature}>
                  <Check size={17} />
                  {feature}
                </div>
              ))}
            </div>
          </article>

          <aside className="specification-card">
            <h2>Thông số tham khảo</h2>
            <dl>
              {product.specifications.map((specification) => (
                <div key={specification.label}>
                  <dt>{specification.label}</dt>
                  <dd>{specification.value}</dd>
                </div>
              ))}
            </dl>
            <small>Thông số cụ thể được xác nhận theo lô hàng và nhu cầu sử dụng.</small>
          </aside>
        </div>
      </section>

      <section className="section-tight application-section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">ỨNG DỤNG</p>
            <h2>Phù hợp cho nhiều nhu cầu kinh doanh</h2>
          </div>
          <div className="application-list">
            {product.applications.map((application) => (
              <span key={application}>{application}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section product-inline-quote">
        <div className="container">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">BÁO GIÁ NHANH</p>
              <h2>Điền sẵn thông tin ngành hàng này</h2>
            </div>
            <QuoteButton className="button button-secondary" seed={{ product: product.name, usage: product.name, source: "product-inline" }}>
              Mở form báo giá
            </QuoteButton>
          </div>

          <QuoteForm
            inline
            initialValues={{
              product: product.name,
              usage: product.name,
              source: "product-inline",
              pathname: `/san-pham/${product.slug}`,
            }}
          />
        </div>
      </section>

      {relatedProducts.length ? (
        <section className="section related-products-section">
          <div className="container">
            <div className="section-heading split-heading">
              <div>
                <p className="eyebrow">GỢI Ý THÊM</p>
                <h2>Sản phẩm cùng nhóm</h2>
              </div>
              <Link className="text-link" href="/san-pham">
                <ArrowLeft size={17} /> Xem toàn bộ
              </Link>
            </div>
            <div className="product-grid">
              {relatedProducts.map((item) => (
                <ProductCard product={item} compact key={item.slug} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section product-quote-section">
        <div className="container">
          <QuoteCta productName={product.name} />
        </div>
      </section>
    </main>
  );
}
