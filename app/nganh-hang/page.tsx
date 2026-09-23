import type { Metadata } from "next";
import Image from "next/image";
import { BookOpen, CheckCircle2, Clock3, PackageCheck } from "lucide-react";
import { QuoteCta } from "@/components/quote-cta";
import { Reveal } from "@/components/reveal";
import { guideItems } from "@/data/guides";
import { getAbsoluteUrl } from "@/lib/site";
import { siteAssets } from "@/lib/site-assets";

export const metadata: Metadata = {
  title: "Cẩm nang nguyên liệu F&B",
  description: "Hướng dẫn chọn nguyên liệu, bảo quản và quản lý nhập hàng dành cho quán, cửa hàng và đại lý.",
  alternates: { canonical: "/nganh-hang" },
  openGraph: {
    title: "Cẩm nang nguyên liệu F&B | Hưng Phát",
    description: "Các hướng dẫn ngắn, dễ áp dụng cho khách hàng kinh doanh F&B.",
    url: getAbsoluteUrl("/nganh-hang"),
  },
};

export default function NganhHangPage() {
  const featured = guideItems[0];
  const stackItems = guideItems.slice(1);

  return (
    <main className="content-page news-page">
      <section className="page-hero">
        <div className="container page-hero-inner page-hero-with-image">
          <div>
            <p className="eyebrow">CẨM NANG HƯNG PHÁT</p>
            <h1 className="gradient-heading">Thông tin hữu ích cho quán</h1>
            <p>Hướng dẫn ngắn về chọn nguyên liệu, bảo quản và lên kế hoạch nhập hàng.</p>
            <div className="page-hero-points news-hero-points">
              <span><CheckCircle2 size={14} /> Dễ áp dụng</span>
              <span><PackageCheck size={14} /> Giảm hao hụt</span>
              <span><BookOpen size={14} /> Đọc nhanh</span>
            </div>
          </div>
          <div className="page-hero-image">
            <Image
              src={siteAssets.pageHero.nganhHang}
              alt="Cẩm nang nguyên liệu F&B Hưng Phát"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 40vw"
            />
          </div>
        </div>
      </section>

      <section className="section news-section">
        <div className="container">
          <Reveal>
            <div className="section-heading split-heading">
              <div>
                <p className="eyebrow">BÍ QUYẾT CHO KHÁCH HÀNG</p>
                <h2 className="gradient-heading">Vận hành gọn, nhập hàng đúng</h2>
                <p>Các hướng dẫn tập trung vào những việc quán và đại lý có thể áp dụng ngay.</p>
              </div>
              <span className="section-kicker">4 hướng dẫn</span>
            </div>
          </Reveal>

          <div className="news-layout">
            <Reveal>
              <article className="news-feature-card">
                <div className="news-image-wrap news-image-wrap-large">
                  <Image
                    src={featured.image}
                    alt={featured.title}
                    fill
                    priority
                    sizes="(max-width: 900px) 100vw, 55vw"
                    className="news-image"
                  />
                </div>
                <div className="news-feature-topline">
                  <span className="news-badge">{featured.badge}</span>
                  <span className="news-meta"><Clock3 size={14} /> {featured.readingTime}</span>
                </div>
                <h3>{featured.title}</h3>
                <p>{featured.summary}</p>
                <ul className="news-points">
                  {featured.highlights.map((point) => <li key={point}>{point}</li>)}
                </ul>
                <div className="news-feature-footer">
                  <span className="news-source">Hướng dẫn Hưng Phát</span>
                </div>
              </article>
            </Reveal>

            <div className="news-stack">
              {stackItems.map((item, index) => (
                <Reveal key={item.title} delay={index * 0.05}>
                  <article className="news-card">
                    <div className="news-image-wrap">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 900px) 100vw, 30vw"
                        className="news-image"
                      />
                    </div>
                    <div className="news-card-topline">
                      <span className="news-badge">{item.badge}</span>
                      <span className="news-meta"><Clock3 size={14} /> {item.readingTime}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <ul className="news-points news-points-compact">
                      {item.highlights.map((point) => <li key={point}>{point}</li>)}
                    </ul>
                    <div className="news-card-footer">
                      <span className="news-source">Hướng dẫn Hưng Phát</span>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
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
