import type { Metadata } from "next";
import { ArrowUpRight, CalendarDays, Sparkles, TrendingUp } from "lucide-react";
import { getAbsoluteUrl } from "@/lib/site";
import { QuoteCta } from "@/components/quote-cta";
import { Reveal } from "@/components/reveal";

const newsItems = [
  {
    badge: "Xu hướng",
    title: "AI trở thành 'gia vị' mới trong F&B Việt Nam",
    summary:
      "VietnamPlus cho thấy doanh nghiệp đang ưu tiên các dự án ngắn hạn như kiểm soát chất lượng, dự báo nhu cầu và chatbot chăm sóc khách hàng.",
    source: "VietnamPlus",
    date: "22/04/2026",
    href: "https://en.vietnamplus.vn/ai-emerges-as-key-driver-for-vietnams-fb-sector-breakthrough-post341587.vnp",
  },
  {
    badge: "Báo cáo",
    title: "Thị trường F&B chuyển sang tăng trưởng bền vững",
    summary:
      "Báo cáo của VietnamPlus ghi nhận thị trường vẫn mở rộng, nhưng biên lợi nhuận mỏng hơn và người tiêu dùng chọn giá trị thực thay vì chạy theo trào lưu.",
    source: "VietnamPlus",
    date: "19/03/2025",
    href: "https://en.vietnamplus.vn/vietnams-fb-market-focuses-on-sustainable-growth-post311854.vnp",
  },
  {
    badge: "Sự kiện",
    title: "Future Menus Hà Nội 2026 mở ra hướng đi mới",
    summary:
      "Thanh Niên nói về một sự kiện F&B hướng tới đầu bếp và nhà quản trị đang cần công thức thích nghi trong giai đoạn biến động.",
    source: "Thanh Niên",
    date: "17/07/2026",
    href: "https://thanhnien.vn/future-menus-ha-noi-2026-mo-ra-huong-di-moi-cho-nganh-fb-bien-dong-tags1853716.html",
  },
  {
    badge: "Case study",
    title: "Ngọc Phương Nam: ẩm thực gắn với trải nghiệm",
    summary:
      "Một case study về vận hành, chất lượng nguyên liệu và trải nghiệm khách hàng trong mô hình nhà hàng quy mô lớn tại Hạ Long.",
    source: "Thanh Niên",
    date: "17/07/2026",
    href: "https://thanhnien.vn/dau-an-ngoc-phuong-nam-khi-am-thuc-hoa-quyen-cung-trai-nghiem-giua-long-ky-quan-185260717162525844.htm",
  },
] as const;

export const metadata: Metadata = {
  title: "Tin tức & Sự kiện",
  description:
    "Tổng hợp nhanh tin tức, xu hướng và sự kiện đáng chú ý trong ngành F&B từ các nguồn cập nhật mới.",
  alternates: { canonical: "/nganh-hang" },
  openGraph: {
    title: "Tin tức & Sự kiện | Hưng Phát",
    description:
      "Tổng hợp nhanh tin tức, xu hướng và sự kiện đáng chú ý trong ngành F&B từ các nguồn cập nhật mới.",
    url: getAbsoluteUrl("/nganh-hang"),
  },
};

export default function NganhHangPage() {
  const featured = newsItems[0];
  const stackItems = newsItems.slice(1);

  return (
    <main className="content-page news-page">
      <section className="page-hero">
        <div className="container page-hero-inner">
          <p className="eyebrow">TIN TỨC &amp; SỰ KIỆN</p>
          <h1 className="gradient-heading">F&amp;B hôm nay</h1>
          <p>
            Tóm tắt nhanh xu hướng, báo cáo và sự kiện đáng chú ý để Sếp nắm bối cảnh thị trường mà không phải lướt quá
            nhiều nguồn rời rạc.
          </p>
          <div className="page-hero-points news-hero-points">
            <span>
              <TrendingUp size={14} /> Xu hướng
            </span>
            <span>
              <Sparkles size={14} /> Sự kiện
            </span>
            <span>
              <CalendarDays size={14} /> Cập nhật tuần này
            </span>
          </div>
        </div>
      </section>

      <section className="section news-section">
        <div className="container">
          <Reveal>
            <div className="section-heading split-heading">
              <div>
                <p className="eyebrow">ĐIỂM NHẤN</p>
                <h2 className="gradient-heading">Nguồn F&amp;B đang được chú ý</h2>
                <p>Các mẩu tin dưới đây được chọn từ nguồn cập nhật gần đây, ưu tiên chủ đề có liên quan trực tiếp tới F&amp;B.</p>
              </div>
              <span className="section-kicker">4 nguồn</span>
            </div>
          </Reveal>

          <div className="news-layout">
            <Reveal>
              <a
                className="news-feature-card"
                href={featured.href}
                rel="noreferrer"
                target="_blank"
              >
                <div className="news-feature-topline">
                  <span className="news-badge">{featured.badge}</span>
                  <span className="news-meta">
                    <CalendarDays size={14} />
                    {featured.date}
                  </span>
                </div>
                <h3>{featured.title}</h3>
                <p>{featured.summary}</p>
                <div className="news-feature-footer">
                  <span className="news-source">{featured.source}</span>
                  <span className="news-link">
                    Đọc nguồn <ArrowUpRight size={16} />
                  </span>
                </div>
              </a>
            </Reveal>

            <div className="news-stack">
              {stackItems.map((item, index) => (
                <Reveal key={item.title} delay={index * 0.05}>
                  <a className="news-card" href={item.href} rel="noreferrer" target="_blank">
                    <div className="news-card-topline">
                      <span className="news-badge">{item.badge}</span>
                      <span className="news-meta">
                        <CalendarDays size={14} />
                        {item.date}
                      </span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <div className="news-card-footer">
                      <span className="news-source">{item.source}</span>
                      <span className="news-link">
                        Mở nguồn <ArrowUpRight size={16} />
                      </span>
                    </div>
                  </a>
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
