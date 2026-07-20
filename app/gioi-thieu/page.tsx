import type { Metadata } from "next";
import { Building2, ShieldCheck, Truck } from "lucide-react";
import { CompanyCapabilitySection } from "@/components/company-capability-section";
import { QuoteCta } from "@/components/quote-cta";
import { TrustSection } from "@/components/trust-section";
import { getAbsoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description:
    "Giới thiệu Hưng Phát - công ty thương mại và phân phối nguyên liệu pha chế, nguyên liệu mì cay và hàng đông lạnh.",
  alternates: { canonical: "/gioi-thieu" },
  openGraph: {
    title: "Giới thiệu | Hưng Phát",
    description:
      "Giới thiệu Hưng Phát - công ty thương mại và phân phối nguyên liệu pha chế, nguyên liệu mì cay và hàng đông lạnh.",
    url: getAbsoluteUrl("/gioi-thieu"),
  },
};

export default function GioiThieuPage() {
  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="container page-hero-inner">
          <p className="eyebrow">GIỚI THIỆU</p>
          <h1>Công ty thương mại và phân phối cho nhu cầu kinh doanh thực tế</h1>
          <p>
            Hưng Phát tập trung vào ba ngành hàng chính: nguyên liệu pha chế, nguyên liệu mì cay và hàng đông lạnh. Trang này giới thiệu
            ngắn gọn về định hướng, cách phục vụ và cách chúng tôi hỗ trợ khách hàng doanh nghiệp.
          </p>
          <div className="page-hero-points">
            <span>
              <Building2 size={18} /> Thương mại và phân phối
            </span>
            <span>
              <ShieldCheck size={18} /> Tập trung vào danh mục đúng nhu cầu
            </span>
            <span>
              <Truck size={18} /> Báo giá và giao nhận linh hoạt
            </span>
          </div>
        </div>
      </section>

      <TrustSection />
      <CompanyCapabilitySection />

      <section className="section section-tight">
        <div className="container">
          <QuoteCta />
        </div>
      </section>
    </main>
  );
}
