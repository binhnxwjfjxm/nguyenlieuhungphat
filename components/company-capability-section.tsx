import { ArrowUpRight, Building2, Route, Warehouse } from "lucide-react";
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
              <p className="eyebrow">NĂNG LỰC PHÂN PHỐI</p>
              <h2 className="gradient-heading">Kho, trưng bày &amp; giao nhận</h2>
              <p>
                Ảnh thật từ kho, khu trưng bày và luồng giao nhận giúp khách nhìn vào là thấy ngay năng lực vận hành của Hưng Phát.
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
              <div className="capability-image-wrap capability-image-wrap-large">
                <ResponsiveAssetPicture
                  className="capability-picture"
                  imgClassName="capability-picture-img"
                  alt="Hình ảnh giới thiệu năng lực kho trưng bày của Hưng Phát"
                  desktopSrc={siteAssets.warehouse.capability}
                  desktopFallbackSrc={siteAssetFallbacks.warehouse.capability}
                  priority={false}
                  imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
                />
                <span className="capability-image-label">Kho trưng bày</span>
              </div>
              <div className="capability-copy">
                <span className="capability-icon">
                  <Building2 size={18} />
                </span>
                <h3>Kết nối nguồn hàng</h3>
                <p>
                  Danh mục theo ngành hàng, hỗ trợ chọn đúng nhóm và phối hợp báo giá theo nhu cầu thực tế.
                </p>
              </div>
            </article>
          </Reveal>

          <div className="capability-stack">
            <Reveal delay={0.02}>
              <div className="capability-highlights">
                <span>
                  <strong>2016</strong>
                  <small>Kinh nghiệm thực tế</small>
                </span>
                <span>
                  <strong>3</strong>
                  <small>Nhóm hàng chính</small>
                </span>
                <span>
                  <strong>B2B</strong>
                  <small>Phân phối linh hoạt</small>
                </span>
              </div>
            </Reveal>
            <Reveal delay={0.04}>
              <article className="capability-card capability-card-small">
                <div className="capability-image-wrap">
                  <ResponsiveAssetPicture
                    className="capability-picture"
                    imgClassName="capability-picture-img"
                    alt="Kho hàng và khu vực lưu trữ phục vụ giao nhận"
                    desktopSrc={siteAssets.warehouse.one}
                    desktopFallbackSrc={siteAssetFallbacks.warehouse.one}
                    imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
                  />
                  <span className="capability-image-label">Kho hàng</span>
                </div>
                <div className="capability-mini-copy">
                  <Warehouse size={17} />
                  <span>Tiếp nhận số lượng và khu vực</span>
                </div>
              </article>
            </Reveal>
            <Reveal delay={0.08}>
              <article className="capability-card capability-card-small">
                <div className="capability-image-wrap">
                  <ResponsiveAssetPicture
                    className="capability-picture"
                    imgClassName="capability-picture-img"
                    alt="Hình ảnh phối hợp đơn hàng và luồng giao nhận"
                    desktopSrc={siteAssets.warehouse.two}
                    desktopFallbackSrc={siteAssetFallbacks.warehouse.two}
                    imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
                  />
                  <span className="capability-image-label">Giao nhận</span>
                </div>
                <div className="capability-mini-copy">
                  <Route size={17} />
                  <span>Phối hợp báo giá và giao nhận</span>
                </div>
              </article>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
