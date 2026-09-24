import type { Metadata } from "next";
import Image from "next/image";
import { Layers3, PackageCheck, Route } from "lucide-react";
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
              Hưng Phát tập trung giới thiệu và phân phối các nhóm nguyên liệu, thực phẩm,
              bao bì và vật tư phục vụ cửa hàng, đại lý và đối tác kinh doanh.
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
            <span><Layers3 size={18} /></span>
            <h2>Nguyên liệu pha chế</h2>
            <p>Trà, bột, siro, topping và các nhóm nguyên liệu phục vụ đồ uống.</p>
          </article>
          <article className="company-story-card">
            <span><PackageCheck size={18} /></span>
            <h2>Thực phẩm &amp; gia vị</h2>
            <p>Thực phẩm đông lạnh, ăn vặt, gia vị và sốt phục vụ hoạt động F&amp;B.</p>
          </article>
          <article className="company-story-card">
            <span><Route size={18} /></span>
            <h2>Bao bì &amp; vận hành</h2>
            <p>Ly, nắp, hộp, túi và vật tư phục vụ đóng gói, bán hàng và giao nhận.</p>
          </article>
        </div>
      </section>

      <CompanyCapabilitySection />
      <CompanyContactCta />
    </main>
  );
}
