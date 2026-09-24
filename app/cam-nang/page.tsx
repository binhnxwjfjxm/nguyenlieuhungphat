import type { Metadata } from "next";
import Image from "next/image";
import { CompanyContactCta } from "@/components/company-contact-cta";
import { getAbsoluteUrl } from "@/lib/site";
import { siteAssets } from "@/lib/site-assets";

export const metadata: Metadata = {
  title: "Cẩm nang",
  description: "Trang nội dung Cẩm nang của Hưng Phát.",
  alternates: { canonical: "/cam-nang" },
  openGraph: {
    title: "Cẩm nang | Hưng Phát",
    description: "Trang nội dung Cẩm nang của Hưng Phát.",
    url: getAbsoluteUrl("/cam-nang"),
  },
};

export default function CamNangPage() {
  return (
    <main className="content-page content-page-v2 news-page">
      <section className="page-hero">
        <div className="container page-hero-inner page-hero-with-image">
          <div>
            <p className="eyebrow">CẨM NANG</p>
            <h1 className="gradient-heading">Cẩm nang Hưng Phát</h1>
            <p>Nội dung hướng dẫn được đăng tại đây sau khi được Công Ty hoàn thiện.</p>
          </div>
          <div className="page-hero-image">
            <Image src={siteAssets.pageHero.nganhHang} alt="Cẩm nang Hưng Phát" fill priority sizes="(max-width: 900px) 100vw, 40vw" />
          </div>
        </div>
      </section>

      <CompanyContactCta />
    </main>
  );
}
