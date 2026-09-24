import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CompanyContactCta } from "@/components/company-contact-cta";
import { categories } from "@/data/site";
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
              <Link className="button button-primary" href="/lien-he">Liên hệ Công Ty</Link>
            </div>
          </div>
          <div className="page-hero-image">
            <Image src={category.image} alt={category.title} fill priority sizes="(max-width: 900px) 100vw, 40vw" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading company-section-heading">
            <p className="eyebrow">THÔNG TIN NGÀNH HÀNG</p>
            <h2 className="gradient-heading">{category.title}</h2>
            <p>{category.description}</p>
          </div>
        </div>
      </section>

      <CompanyContactCta />
    </main>
  );
}
