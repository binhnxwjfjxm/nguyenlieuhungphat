import { PackageCheck, Route, Warehouse } from "lucide-react";
import { siteAssets, siteAssetFallbacks } from "@/lib/site-assets";
import { HapticLink } from "./haptic-link";
import { ResponsiveAssetPicture } from "./responsive-asset-picture";

const capabilityItems = [
  { icon: Warehouse, title: "Kho" },
  { icon: PackageCheck, title: "Danh mục ngành hàng" },
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
          <h2>Năng lực phân phối</h2>
          <p className="reference-about-description">Thông tin về danh mục ngành hàng, kho và phối hợp giao nhận của Công Ty.</p>
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
          <HapticLink className="button reference-about-button" href="/nang-luc">
            Xem năng lực phân phối
          </HapticLink>
        </div>
      </div>
    </section>
  );
}
