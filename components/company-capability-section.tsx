import { PackageCheck, Route, Warehouse } from "lucide-react";
import { siteAssets, siteAssetFallbacks } from "@/lib/site-assets";
import { HapticLink } from "./haptic-link";
import { ResponsiveAssetPicture } from "./responsive-asset-picture";

const capabilityItems = [
  { icon: Warehouse, title: "Kho và nguồn hàng" },
  { icon: PackageCheck, title: "Danh mục phù hợp vận hành" },
  { icon: Route, title: "Phối hợp giao nhận" },
] as const;

export function CompanyCapabilitySection() {
  return (
    <section className="reference-about-section" id="nang-luc">
      <div className="container reference-about-layout">
        <div className="reference-about-visual">
          <ResponsiveAssetPicture
            className="reference-about-picture"
            imgClassName="reference-about-picture-img"
            alt="Kho và năng lực phân phối Hưng Phát"
            desktopSrc={siteAssets.warehouse.capability}
            desktopFallbackSrc={siteAssetFallbacks.warehouse.capability}
            imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
          />
          <div className="reference-about-caption">
            <span>Nguyên liệu pha chế</span>
            <span>Thực phẩm &amp; gia vị</span>
            <span>Bao bì &amp; vật tư</span>
          </div>
        </div>

        <div className="reference-about-copy">
          <p className="eyebrow">NĂNG LỰC PHÂN PHỐI</p>
          <h2>Hưng Phát đồng hành cùng hoạt động kinh doanh F&amp;B</h2>
          <p className="reference-about-description">
            Từ danh mục ngành hàng đến kho và giao nhận, thông tin trên Website Công Ty được trình bày theo các nhóm hàng và năng lực vận hành thực tế.
          </p>
          <div className="reference-about-features">
            {capabilityItems.map((item) => {
              const Icon = item.icon;
              return (
                <div className="reference-about-feature" key={item.title}>
                  <span><Icon size={19} /></span>
                  <strong>{item.title}</strong>
                </div>
              );
            })}
          </div>
          <HapticLink className="button reference-about-button" href="/gioi-thieu">
            Tìm hiểu thêm về Hưng Phát
          </HapticLink>
        </div>
      </div>
    </section>
  );
}
