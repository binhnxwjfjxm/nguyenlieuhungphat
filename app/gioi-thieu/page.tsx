import type { Metadata } from "next";
import Image from "next/image";
import { Building2, Layers3, Route } from "lucide-react";
import { CompanyCapabilitySection } from "@/components/company-capability-section";
import { CompanyContactCta } from "@/components/company-contact-cta";
import { getAbsoluteUrl } from "@/lib/site";
import { siteAssets } from "@/lib/site-assets";

const description =
  "Giới thiệu Hưng Phát - công ty thương mại và phân phối các nhóm nguyên liệu, thực phẩm, bao bì và gia vị phục vụ đối tác F&B.";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description,
  alternates: { canonical: "/gioi-thieu" },
  openGraph: {
    title: "Giới thiệu | Hưng Phát",
    description,
    url: getAbsoluteUrl("/gioi-thieu"),
  },
};

export default function GioiThieuPage() {
  return (
    <main className="content-page content-page-v2">
      <section className="page-hero">
        <div className="container page-hero-inner page-hero-with-image">
          <div>
            <p className="eyebrow">GIỚI THIỆU</p>
            <h1 className="gradient-heading">Hưng Phát và hệ thống ngành hàng F&amp;B</h1>
            <p>
              Hưng Phát hoạt động từ năm 2016, tập trung giới thiệu và phân phối sáu ngành hàng phục vụ
              cửa hàng, đại lý và đối tác kinh doanh.
            </p>
          </div>
          <div className="page-hero-image">
            <Image src={siteAssets.pageHero.gioiThieu} alt="Giới thiệu Hưng Phát" fill priority sizes="(max-width: 900px) 100vw, 40vw" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container company-story-grid">
          <article className="company-story-card">
            <span><Building2 size={18} /></span>
            <h2>Từ năm 2016</h2>
            <p>Mốc thành lập được sử dụng xuyên suốt website như thông tin nền về quá trình hoạt động của Công Ty.</p>
          </article>
          <article className="company-story-card">
            <span><Layers3 size={18} /></span>
            <h2>Sáu ngành hàng ưu tiên</h2>
            <p>Trà sữa &amp; pha chế, mì cay, đông lạnh, ăn vặt, bao bì và gia vị &amp; sốt.</p>
          </article>
          <article className="company-story-card">
            <span><Route size={18} /></span>
            <h2>Phục vụ đối tác B2B</h2>
            <p>Website tập trung giới thiệu danh mục và năng lực để cửa hàng, đại lý và đối tác dễ tìm hiểu thông tin.</p>
          </article>
        </div>
      </section>

      <CompanyCapabilitySection />
      <CompanyContactCta />
    </main>
  );
}
