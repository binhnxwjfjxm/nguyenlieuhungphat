import type { Metadata } from "next";
import Image from "next/image";
import { Layers3, Route, Warehouse } from "lucide-react";
import { CompanyCapabilitySection } from "@/components/company-capability-section";
import { CompanyContactCta } from "@/components/company-contact-cta";
import { getAbsoluteUrl } from "@/lib/site";
import { siteAssets } from "@/lib/site-assets";

const capabilityPoints = [
  {
    icon: Layers3,
    title: "Danh mục theo ngành hàng",
    description: "Sáu ngành hàng được tổ chức rõ để đối tác tìm và đối chiếu thông tin nhanh hơn.",
  },
  {
    icon: Warehouse,
    title: "Kho và nguồn hàng",
    description: "Website sử dụng hình ảnh kho và danh mục hiện có để giới thiệu năng lực Công Ty.",
  },
  {
    icon: Route,
    title: "Phối hợp giao nhận",
    description: "Hưng Phát trao đổi phương án giao nhận theo nhu cầu thực tế của từng đối tác.",
  },
] as const;

export const metadata: Metadata = {
  title: "Năng lực phân phối",
  description: "Giới thiệu năng lực ngành hàng, kho và phối hợp giao nhận của Hưng Phát.",
  alternates: { canonical: "/nang-luc" },
  openGraph: {
    title: "Năng lực phân phối | Hưng Phát",
    description: "Thông tin về danh mục, kho và khả năng phối hợp phục vụ đối tác kinh doanh F&B.",
    url: getAbsoluteUrl("/nang-luc"),
  },
};

export default function NangLucPage() {
  return (
    <main className="content-page content-page-v2">
      <section className="page-hero">
        <div className="container page-hero-inner page-hero-with-image">
          <div>
            <p className="eyebrow">NĂNG LỰC PHÂN PHỐI</p>
            <h1 className="gradient-heading">Danh mục, kho và phối hợp giao nhận</h1>
            <p>Hưng Phát trình bày năng lực dựa trên thông tin và hình ảnh đang có, không sử dụng số liệu minh họa không có nguồn.</p>
            <div className="page-hero-points">
              <span>2016 · Thành lập</span>
              <span>6 · Ngành hàng ưu tiên</span>
              <span>B2B · Đối tác kinh doanh</span>
            </div>
          </div>
          <div className="page-hero-image">
            <Image src={siteAssets.warehouse.capability} alt="Năng lực kho và phân phối Hưng Phát" fill priority sizes="(max-width: 900px) 100vw, 40vw" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container capability-page-grid">
          {capabilityPoints.map((item) => {
            const Icon = item.icon;
            return (
              <article className="capability-page-card" key={item.title}>
                <span><Icon size={18} /></span>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <CompanyCapabilitySection />
      <CompanyContactCta />
    </main>
  );
}
