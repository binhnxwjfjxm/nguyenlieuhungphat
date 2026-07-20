import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { categories } from "@/data/site";
import { getAbsoluteUrl } from "@/lib/site";
import { HapticLink } from "@/components/haptic-link";
import { QuoteCta } from "@/components/quote-cta";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Ngành hàng",
  description:
    "Khám phá 3 ngành hàng chính của Hưng Phát: nguyên liệu pha chế, nguyên liệu mì cay và hàng đông lạnh.",
  alternates: { canonical: "/nganh-hang" },
  openGraph: {
    title: "Ngành hàng | Hưng Phát",
    description:
      "Khám phá 3 ngành hàng chính của Hưng Phát: nguyên liệu pha chế, nguyên liệu mì cay và hàng đông lạnh.",
    url: getAbsoluteUrl("/nganh-hang"),
  },
};

export default function NganhHangPage() {
  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="container page-hero-inner">
          <p className="eyebrow">NGÀNH HÀNG</p>
          <h1>Ba nhóm hàng chính cho nhu cầu kinh doanh thực tế</h1>
          <p>
            Mỗi nhóm bên dưới dẫn tới trang riêng. Khi cần đối chiếu nhanh theo mục tiêu nhập hàng, anh có thể đi thẳng vào đúng nhóm thay
            vì lọc ở một trang tổng hợp.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="category-scroller">
            {categories.map((category, index) => {
              const Icon = category.icon;

              return (
                <Reveal key={category.slug} delay={index * 0.06}>
                  <HapticLink className="category-card" href={`/nganh-hang/${category.slug}`}>
                    <div className="category-content" style={{ minHeight: "100%" }}>
                      <span className="category-icon">
                        <Icon size={19} />
                      </span>
                      <h3>{category.title}</h3>
                      <p>{category.description}</p>
                      <small>
                        Xem chi tiết <ArrowUpRight size={14} />
                      </small>
                    </div>
                  </HapticLink>
                </Reveal>
              );
            })}
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
