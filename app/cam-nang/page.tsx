import type { Metadata } from "next";
import Image from "next/image";
import { BookOpen, CheckCircle2, Clock3, PackageCheck } from "lucide-react";
import { CompanyContactCta } from "@/components/company-contact-cta";
import { Reveal } from "@/components/reveal";
import { guideItems } from "@/data/guides";
import { getAbsoluteUrl } from "@/lib/site";
import { siteAssets } from "@/lib/site-assets";

export const metadata: Metadata = {
  title: "Cẩm nang F&B",
  description: "Hướng dẫn ngắn về chọn nguyên liệu, bảo quản và quản lý nhập hàng dành cho cửa hàng và đối tác F&B.",
  alternates: { canonical: "/cam-nang" },
  openGraph: {
    title: "Cẩm nang F&B | Hưng Phát",
    description: "Các nội dung tham khảo ngắn, dễ áp dụng cho hoạt động F&B.",
    url: getAbsoluteUrl("/cam-nang"),
  },
};

export default function CamNangPage() {
  const featured = guideItems[0];
  const stackItems = guideItems.slice(1);

  return (
    <main className="content-page content-page-v2 news-page">
      <section className="page-hero">
        <div className="container page-hero-inner page-hero-with-image">
          <div>
            <p className="eyebrow">CẨM NANG HƯNG PHÁT</p>
            <h1 className="gradient-heading">Thông tin hữu ích cho hoạt động F&amp;B</h1>
            <p>Hướng dẫn ngắn về chọn nguyên liệu, bảo quản và quản lý hàng hóa trong quá trình vận hành.</p>
            <div className="page-hero-points news-hero-points">
              <span><CheckCircle2 size={14} /> Dễ tham khảo</span>
              <span><PackageCheck size={14} /> Tập trung vận hành</span>
              <span><BookOpen size={14} /> Đọc nhanh</span>
            </div>
          </div>
          <div className="page-hero-image">
            <Image src={siteAssets.pageHero.nganhHang} alt="Cẩm nang F&B Hưng Phát" fill priority sizes="(max-width: 900px) 100vw, 40vw" />
          </div>
        </div>
      </section>

      <section className="section news-section">
        <div className="container">
          <Reveal>
            <div className="section-heading split-heading company-section-heading">
              <div>
                <p className="eyebrow">NỘI DUNG THAM KHẢO</p>
                <h2 className="gradient-heading">Vận hành gọn và chủ động hơn</h2>
                <p>Các hướng dẫn tập trung vào những việc cửa hàng và đại lý có thể áp dụng trong thực tế.</p>
              </div>
              <span className="section-kicker">{guideItems.length} hướng dẫn</span>
            </div>
          </Reveal>

          <div className="news-layout">
            <Reveal>
              <article className="news-feature-card">
                <div className="news-image-wrap news-image-wrap-large">
                  <Image src={featured.image} alt={featured.title} fill priority sizes="(max-width: 900px) 100vw, 55vw" className="news-image" />
                </div>
                <div className="news-feature-topline">
                  <span className="news-badge">{featured.badge}</span>
                  <span className="news-meta"><Clock3 size={14} /> {featured.readingTime}</span>
                </div>
                <h3>{featured.title}</h3>
                <p>{featured.summary}</p>
                <ul className="news-points">{featured.highlights.map((point) => <li key={point}>{point}</li>)}</ul>
                <div className="news-feature-footer"><span className="news-source">Hướng dẫn Hưng Phát</span></div>
              </article>
            </Reveal>

            <div className="news-stack">
              {stackItems.map((item, index) => (
                <Reveal key={item.title} delay={index * 0.05}>
                  <article className="news-card">
                    <div className="news-image-wrap">
                      <Image src={item.image} alt={item.title} fill sizes="(max-width: 900px) 100vw, 30vw" className="news-image" />
                    </div>
                    <div className="news-card-topline">
                      <span className="news-badge">{item.badge}</span>
                      <span className="news-meta"><Clock3 size={14} /> {item.readingTime}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <ul className="news-points news-points-compact">{item.highlights.map((point) => <li key={point}>{point}</li>)}</ul>
                    <div className="news-card-footer"><span className="news-source">Hướng dẫn Hưng Phát</span></div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CompanyContactCta />
    </main>
  );
}
