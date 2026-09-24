import { PackageCheck, Route, Warehouse } from "lucide-react";
import { siteAssets, siteAssetFallbacks } from "@/lib/site-assets";
import { HapticLink } from "./haptic-link";
import { Reveal } from "./reveal";
import { ResponsiveAssetPicture } from "./responsive-asset-picture";

const capabilityItems = [
  {
    icon: Warehouse,
    title: "Kho và nguồn hàng",
    description: "Tổ chức danh mục theo nhóm ngành hàng để đối tác dễ tìm và đối chiếu.",
  },
  {
    icon: PackageCheck,
    title: "Danh mục phù hợp vận hành",
    description: "Tập trung nguyên liệu, thực phẩm, bao bì và gia vị phục vụ mô hình F&B.",
  },
  {
    icon: Route,
    title: "Phối hợp giao nhận",
    description: "Trao đổi phương án giao nhận theo nhu cầu thực tế của từng đối tác.",
  },
] as const;

export function CompanyCapabilitySection() {
  return (
    <section className="section company-capability-v2" id="nang-luc">
      <div className="container company-capability-layout">
        <Reveal>
          <div className="company-capability-visual">
            <ResponsiveAssetPicture
              className="company-capability-picture"
              imgClassName="company-capability-picture-img"
              alt="Không gian kho và năng lực phân phối Hưng Phát"
              desktopSrc={siteAssets.warehouse.capability}
              desktopFallbackSrc={siteAssetFallbacks.warehouse.capability}
              imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
            />
            <div className="company-capability-stats" aria-label="Các loại hàng Hưng Phát">
              <span>
                <strong>Nguyên liệu</strong>
                <small>Pha chế &amp; topping</small>
              </span>
              <span>
                <strong>Thực phẩm</strong>
                <small>Đông lạnh &amp; gia vị</small>
              </span>
              <span>
                <strong>Bao bì</strong>
                <small>Vật tư vận hành</small>
              </span>
            </div>
          </div>
        </Reveal>

        <div className="company-capability-copy">
          <Reveal>
            <div className="section-heading company-section-heading">
              <p className="eyebrow">NĂNG LỰC PHÂN PHỐI</p>
              <h2 className="gradient-heading">Hưng Phát đồng hành cùng hoạt động kinh doanh F&amp;B</h2>
              <p>
                Từ danh mục ngành hàng đến kho và giao nhận, thông tin trên Website Công Ty được trình bày
                theo các nhóm hàng và năng lực vận hành thực tế.
              </p>
            </div>
          </Reveal>

          <div className="company-capability-list">
            {capabilityItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={index * 0.04}>
                  <div className="company-capability-item">
                    <span className="company-capability-icon"><Icon size={18} /></span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={0.08}>
            <div className="company-capability-actions">
              <HapticLink className="button button-primary" href="/gioi-thieu">
                Giới thiệu về Hưng Phát
              </HapticLink>
              <HapticLink className="button button-secondary" href="/lien-he">
                Liên hệ Công Ty
              </HapticLink>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
