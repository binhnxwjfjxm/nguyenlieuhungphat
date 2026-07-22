import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { QuoteForm } from "@/components/quote-form";
import { QuoteCta } from "@/components/quote-cta";
import { getAbsoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Liên hệ",
  description:
    "Liên hệ Hưng Phát để nhận tư vấn ngành hàng, báo giá và hỗ trợ nhập hàng cho cửa hàng, đại lý và đối tác kinh doanh.",
  alternates: { canonical: "/lien-he" },
  openGraph: {
    title: "Liên hệ | Hưng Phát",
    description:
      "Liên hệ Hưng Phát để nhận tư vấn ngành hàng, báo giá và hỗ trợ nhập hàng cho cửa hàng, đại lý và đối tác kinh doanh.",
    url: getAbsoluteUrl("/lien-he"),
  },
};

export default function LienHePage() {
  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="container page-hero-inner">
          <p className="eyebrow">LIÊN HỆ</p>
          <h1 className="gradient-heading">Gửi nhu cầu để nhận tư vấn</h1>
          <p>Để lại ngành hàng, sản phẩm, số lượng và khu vực giao hàng.</p>
        </div>
      </section>

      <section className="section">
        <div className="container contact-grid">
          <div className="contact-card">
            <p className="eyebrow">THÔNG TIN LIÊN HỆ</p>
            <h2 className="gradient-heading">Công ty TNHH TM Nguyên Liệu Hưng Phát</h2>
            <a href="tel:0900123456">
              <Phone size={18} /> 0900 123 456
            </a>
            <a href="mailto:baogia@nguyenlieuhungphat.com">
              <Mail size={18} /> baogia@nguyenlieuhungphat.com
            </a>
            <p>
              <MapPin size={18} /> TP. Hồ Chí Minh, Việt Nam
            </p>
          </div>

          <div className="contact-card contact-form-card">
            <p className="eyebrow">BÁO GIÁ</p>
            <h2 className="gradient-heading">Điền form để gửi yêu cầu</h2>
            <QuoteForm inline initialValues={{ source: "lien-he", pathname: "/lien-he" }} />
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
