import type { Metadata } from "next";
import Image from "next/image";
import { BookOpen, CheckCircle2, Clock3, PackageCheck } from "lucide-react";
import { QuoteCta } from "@/components/quote-cta";
import { Reveal } from "@/components/reveal";
import { getAbsoluteUrl } from "@/lib/site";
import { siteAssets } from "@/lib/site-assets";

const guideItems = [
  {
    badge: "Chọn nguyên liệu",
    title: "5 bước chọn nguyên liệu pha chế cho menu mới",
    summary:
      "Bắt đầu từ nhóm món chủ lực, mức giá bán và sản lượng dự kiến để chọn nguyên liệu vừa vị, dễ vận hành và phù hợp chi phí.",
    image: siteAssets.categories.phaChe,
    readingTime: "4 phút đọc",
    highlights: [
      "Chốt nhóm món bán chính trước khi mở rộng menu.",
      "Ưu tiên nguyên liệu dùng được cho nhiều công thức.",
      "Thử định lượng thực tế để tính đúng giá vốn mỗi ly.",
    ],
  },
  {
    badge: "Quản lý tồn kho",
    title: "Tính lượng nhập hàng để hạn chế tồn kho",
    summary:
      "Một cách đơn giản để ước lượng lượng hàng cần nhập theo số món bán mỗi ngày, định lượng sử dụng và chu kỳ giao hàng.",
    image: siteAssets.categories.miCay,
    readingTime: "3 phút đọc",
    highlights: [
      "Ghi nhận sản lượng bán trung bình theo tuần.",
      "Tách hàng bán nhanh, bán chậm và hàng dự phòng.",
      "Đặt ngưỡng nhập lại trước khi nguyên liệu chạm mức tối thiểu.",
    ],
  },
  {
    badge: "Bảo quản",
    title: "Bảo quản syrup, bột và topping sau khi mở",
    summary:
      "Giữ chất lượng nguyên liệu bằng cách ghi ngày mở, dùng dụng cụ sạch và sắp xếp theo nguyên tắc nhập trước dùng trước.",
    image: siteAssets.categories.food,
    readingTime: "3 phút đọc",
    highlights: [
      "Đậy kín và tuân thủ điều kiện bảo quản trên bao bì.",
      "Không dùng chung dụng cụ lấy nguyên liệu giữa các hũ.",
      "Kiểm tra mùi, màu và trạng thái trước mỗi ca bán.",
    ],
  },
  {
    badge: "Hàng đông lạnh",
    title: "Nhận và bảo quản hàng đông lạnh đúng cách",
    summary:
      "Kiểm tra nhanh bao bì, trạng thái sản phẩm và nhiệt độ bảo quản ngay khi nhận hàng để giảm rủi ro hao hụt.",
    image: siteAssets.categories.dongLanh,
    readingTime: "4 phút đọc",
    highlights: [
      "Đưa hàng vào tủ đông ngay sau khi kiểm tra.",
      "Chia khu vực theo nhóm sản phẩm và ngày nhập.",
      "Hạn chế rã đông rồi cấp đông lại.",
    ],
  },
] as const;

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
              <span>
                <CheckCircle2 size={14} /> Dễ áp dụng
              </span>
              <span>
                <PackageCheck size={14} /> Giảm hao hụt
              </span>
              <span>
                <BookOpen size={14} /> Đọc nhanh
              </span>
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
                  <span className="news-meta">
                    <Clock3 size={14} /> {featured.readingTime}
                  </span>
                </div>
                <h3>{featured.title}</h3>
                <p>{featured.summary}</p>
                <ul className="news-points">
                  {featured.highlights.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
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
                      <span className="news-meta">
                        <Clock3 size={14} /> {item.readingTime}
                      </span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <ul className="news-points news-points-compact">
                      {item.highlights.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
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
