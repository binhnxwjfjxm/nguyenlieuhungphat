/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Image from "next/image";
import { CompanyContactCta } from "@/components/company-contact-cta";
import { Reveal } from "@/components/reveal";
import { brands } from "@/data/brands";
import { getAbsoluteUrl } from "@/lib/site";
import { siteAssets } from "@/lib/site-assets";

export const metadata: Metadata = {
  title: "Nhãn hàng",
  description: "Một số nhãn hàng tiêu biểu đang có trong danh mục Hưng Phát.",
  alternates: { canonical: "/nhan-hang" },
  openGraph: {
    title: "Nhãn hàng | Hưng Phát",
    description: "Khám phá các nhãn hàng tiêu biểu trong danh mục sản phẩm Hưng Phát.",
    url: getAbsoluteUrl("/nhan-hang"),
  },
};

export default function NhanHangPage() {
  return (
    <main className="content-page content-page-v2">
      <section className="page-hero">
        <div className="container page-hero-inner page-hero-with-image">
          <div>
            <p className="eyebrow">NHÃN HÀNG</p>
            <h1 className="gradient-heading">Nhãn hàng trong danh mục Hưng Phát</h1>
            <p>Logo nhãn hàng được hiển thị theo bộ nhận diện chính thức đã xác minh.</p>
          </div>
          <div className="page-hero-image">
            <Image
              src={siteAssets.pageHero.sanPham}
              alt="Nhãn hàng trong danh mục Hưng Phát"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 40vw"
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading company-section-heading">
            <p className="eyebrow">NHÃN HÀNG TIÊU BIỂU</p>
            <h2 className="gradient-heading">Nhận diện theo logo chính thức</h2>
            <p>Logo dùng để nhận diện nhãn hàng, không dẫn sang sản phẩm chi tiết.</p>
          </div>

          <div className="brand-logo-grid brand-logo-directory" aria-label="Danh sách logo nhãn hàng">
            {brands.map((brand, index) => (
              <Reveal key={brand.name} delay={index * 0.02}>
                <div className={`brand-logo-tile ${brand.logoTone === "dark" ? "is-dark" : "is-light"}`}>
                  <img
                    className="brand-logo-image"
                    src={brand.logoSrc}
                    alt={brand.name}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CompanyContactCta />
    </main>
  );
}
