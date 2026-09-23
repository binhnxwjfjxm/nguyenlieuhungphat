import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { CompanyContactCta } from "@/components/company-contact-cta";
import { HapticLink } from "@/components/haptic-link";
import { Reveal } from "@/components/reveal";
import { brands, brandInitials } from "@/data/brands";
import { getAbsoluteUrl } from "@/lib/site";
import { siteAssets } from "@/lib/site-assets";

export const metadata: Metadata = {
  title: "Nhãn hàng",
  description: "Danh sách nhãn hàng được tổng hợp từ dữ liệu sản phẩm hiện có trong danh mục Hưng Phát.",
  alternates: { canonical: "/nhan-hang" },
  openGraph: {
    title: "Nhãn hàng | Hưng Phát",
    description: "Khám phá các nhãn hàng đang xuất hiện trong danh mục sản phẩm Hưng Phát.",
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
            <h1 className="gradient-heading">Các nhãn hàng trong danh mục Hưng Phát</h1>
            <p>Danh sách được sinh từ dữ liệu sản phẩm thực tế trong website và tự cập nhật khi danh mục nguồn thay đổi.</p>
          </div>
          <div className="page-hero-image">
            <Image src={siteAssets.pageHero.sanPham} alt="Nhãn hàng trong danh mục Hưng Phát" fill priority sizes="(max-width: 900px) 100vw, 40vw" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading company-section-heading">
            <p className="eyebrow">DANH SÁCH NHÃN HÀNG</p>
            <h2 className="gradient-heading">{brands.length} nhãn hàng đang có dữ liệu</h2>
            <p>Mỗi nhãn hàng dẫn đến các dòng sản phẩm tương ứng trong danh mục giới thiệu.</p>
          </div>

          <div className="brand-directory-grid">
            {brands.map((brand, index) => (
              <Reveal key={brand.name} delay={index * 0.015}>
                <HapticLink className="brand-directory-card" href={`/san-pham?q=${encodeURIComponent(brand.name)}`}>
                  <span className="brand-directory-mark">{brandInitials(brand.name)}</span>
                  <div className="brand-directory-copy">
                    <h3>{brand.name}</h3>
                    <p>{brand.familyCount} dòng sản phẩm · {brand.categoryCount} ngành hàng</p>
                    {brand.sampleFamilies.length ? <small>{brand.sampleFamilies.join(" · ")}</small> : null}
                  </div>
                  <ArrowUpRight size={16} />
                </HapticLink>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CompanyContactCta />
    </main>
  );
}
