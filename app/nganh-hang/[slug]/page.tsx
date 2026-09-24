import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Boxes, Building2, Route } from "lucide-react";
import { CompanyContactCta } from "@/components/company-contact-cta";
import { Reveal } from "@/components/reveal";
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
          <Reveal>
            <div className="section-heading company-section-heading">
              <p className="eyebrow">TỔNG QUAN NGÀNH HÀNG</p>
              <h2 className="gradient-heading">Giới thiệu chung về {category.title}</h2>
              <p>
                Hưng Phát trình bày ngành hàng này theo hướng giới thiệu tổng quan, tập trung vào phạm vi nhóm hàng
                và nhu cầu sử dụng thay vì dẫn sang từng sản phẩm chi tiết.
              </p>
              <p>Nội dung chuyên sâu sẽ tiếp tục được hoàn thiện riêng theo từng ngành hàng.</p>
            </div>
          </Reveal>
      
          <div className="company-story-grid">
            {([
              {
                title: "Phạm vi ngành hàng",
                description: category.description,
                icon: Boxes,
              },
              {
                title: "Thông tin để tham khảo",
                description: "Trang ngành hàng trình bày nội dung tổng quan để cửa hàng, đại lý và đối tác F&B dễ hình dung phạm vi nhóm hàng trước khi trao đổi nhu cầu.",
                icon: Building2,
              },
              {
                title: "Trao đổi theo nhu cầu",
                description: "Khi cần làm rõ nhóm hàng phù hợp, đối tác có thể gửi nội dung qua trang Liên hệ để Công Ty tiếp nhận và trao đổi.",
                icon: Route,
              },
            ] as const).map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={index * 0.035}>
                  <article className="company-story-card">
                    <span><Icon size={18} /></span>
                    <h2>{item.title}</h2>
                    <p>{item.description}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <CompanyContactCta />
    </main>
  );
}
