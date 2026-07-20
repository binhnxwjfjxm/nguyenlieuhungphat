import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PackageSearch } from "lucide-react";
import { QuoteCta } from "@/components/quote-cta";
import { Reveal } from "@/components/reveal";
import { categories } from "@/data/site";
import { products } from "@/data/products";
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

  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="container page-hero-inner page-hero-with-image">
          <div>
            <p className="eyebrow">NGÀNH HÀNG</p>
            <h1 className="gradient-heading">{category.title}</h1>
            <p>{category.description}</p>
            <Link className="text-link" href="/nganh-hang">
              <ArrowLeft size={17} /> Quay lại danh mục
            </Link>
          </div>
          <div className="page-hero-image">
            <Image src={category.image} alt={category.title} fill priority sizes="(max-width: 900px) 100vw, 40vw" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="catalog-empty">
              <PackageSearch size={34} />
              <h2 className="gradient-heading">Danh mục đang cập nhật</h2>
              <p>Gửi nhu cầu để nhận tư vấn. Khi có sản phẩm phù hợp, chúng tôi sẽ cập nhật vào trang này.</p>
            </div>
          </Reveal>
          {categoryProducts.length ? (
            <div className="product-grid" style={{ marginTop: "24px" }}>
              {categoryProducts.map((product) => (
                <article key={product.slug}>{product.name}</article>
              ))}
            </div>
          ) : null}
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
