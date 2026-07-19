import { ArrowUpRight, Factory, Warehouse } from "lucide-react";
import { siteAssets, siteAssetFallbacks } from "@/lib/site-assets";
import { Reveal } from "./reveal";
import { ResponsiveAssetPicture } from "./responsive-asset-picture";
import { QuoteButton } from "./quote-trigger";

export function CompanyCapabilitySection() {
  return (
    <section className="section company-capability-section" id="nang-luc">
      <div className="container">
        <Reveal>
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">NĂNG LỰC DOANH NGHIỆP</p>
              <h2>Kho vận, năng lực xử lý và hỗ trợ triển khai</h2>
              <p>
                Hình ảnh kho hàng và năng lực vận hành giúp khách hàng nhìn rõ hơn về cách Hưng Phát tổ chức nguồn
                hàng, chuẩn bị đơn và hỗ trợ báo giá nhanh.
              </p>
            </div>
            <QuoteButton className="text-link desktop-only-link capability-quote-link" seed={{ source: "capability-section" }}>
              Nhận báo giá <ArrowUpRight size={17} />
            </QuoteButton>
          </div>
        </Reveal>

        <div className="capability-grid">
          <Reveal>
            <article className="capability-card capability-card-large">
              <div className="capability-image-wrap">
                <ResponsiveAssetPicture
                  className="capability-picture"
                  imgClassName="capability-picture-img"
                  alt="Không gian năng lực vận hành của Hưng Phát"
                  desktopSrc={siteAssets.warehouse.capability}
                  desktopFallbackSrc={siteAssetFallbacks.warehouse.capability}
                  priority={false}
                  imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
                />
              </div>
              <div className="capability-copy">
                <span className="capability-icon">
                  <Factory size={18} />
                </span>
                <h3>Năng lực doanh nghiệp</h3>
                <p>Giới thiệu tổng quan về năng lực nguồn hàng, tổ chức kho và phương án phục vụ khách hàng.</p>
              </div>
            </article>
          </Reveal>

          <div className="capability-stack">
            <Reveal delay={0.04}>
              <article className="capability-card capability-card-small">
                <div className="capability-image-wrap">
                  <ResponsiveAssetPicture
                    className="capability-picture"
                    imgClassName="capability-picture-img"
                    alt="Kho hàng Hưng Phát với nguyên liệu sẵn sàng xuất"
                    desktopSrc={siteAssets.warehouse.one}
                    desktopFallbackSrc={siteAssetFallbacks.warehouse.one}
                    imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
                  />
                </div>
              </article>
            </Reveal>
            <Reveal delay={0.08}>
              <article className="capability-card capability-card-small">
                <div className="capability-image-wrap">
                  <ResponsiveAssetPicture
                    className="capability-picture"
                    imgClassName="capability-picture-img"
                    alt="Hoạt động kho vận và sắp xếp hàng hóa của Hưng Phát"
                    desktopSrc={siteAssets.warehouse.two}
                    desktopFallbackSrc={siteAssetFallbacks.warehouse.two}
                    imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
                  />
                </div>
                <div className="capability-mini-copy">
                  <Warehouse size={17} />
                  <span>Kho vận và kiểm soát hàng hóa</span>
                </div>
              </article>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
