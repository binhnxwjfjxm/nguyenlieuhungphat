import type { Metadata } from "next";
import Image from "next/image";
import { CategorySection } from "@/components/category-section";
import { CompanyContactCta } from "@/components/company-contact-cta";
import { getAbsoluteUrl } from "@/lib/site";
import { siteAssets } from "@/lib/site-assets";

export const metadata: Metadata = {
  title: "Ngành hàng",
  description:
    "Các ngành hàng Hưng Phát đang giới thiệu gồm nguyên liệu pha chế, thực phẩm, gia vị, bao bì và vật tư phục vụ F&B.",
  alternates: { canonical: "/nganh-hang" },
  openGraph: {
    title: "Ngành hàng | Hưng Phát",
    description: "Khám phá các ngành hàng nguyên liệu, thực phẩm và vật tư trong danh mục Hưng Phát.",
    url: getAbsoluteUrl("/nganh-hang"),
  },
};

export default function NganhHangPage() {
  return (
    <main className="content-page content-page-v2">
      <section className="page-hero">
        <div className="container page-hero-inner page-hero-with-image">
          <div>
            <p className="eyebrow">NGÀNH HÀNG</p>
            <h1 className="gradient-heading">Ngành hàng Hưng Phát</h1>
            <p>Các nhóm nguyên liệu, thực phẩm, bao bì và vật tư phục vụ hoạt động F&amp;B.</p>
          </div>
          <div className="page-hero-image">
            <Image src={siteAssets.pageHero.nganhHang} alt="Ngành hàng Hưng Phát" fill priority sizes="(max-width: 900px) 100vw, 40vw" />
          </div>
        </div>
      </section>

      <CategorySection />
      <CompanyContactCta />
    </main>
  );
}
