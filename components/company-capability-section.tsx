import { MessageCircle, PackageCheck, Route, Warehouse } from "lucide-react";
import { siteAssets, siteAssetFallbacks } from "@/lib/site-assets";
import { HapticLink } from "./haptic-link";
import { ResponsiveAssetPicture } from "./responsive-asset-picture";

const capabilityItems = [
  { icon: PackageCheck, title: "Sản phẩm đa dạng" },
  { icon: Warehouse, title: "Nguồn hàng ổn định" },
  { icon: Route, title: "Phối hợp giao nhận" },
  { icon: MessageCircle, title: "Tư vấn tận tâm" },
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
          <p className="eyebrow">VỀ HƯNG PHÁT</p>
          <h2>Đồng hành cùng hoạt động kinh doanh F&amp;B</h2>
          <p className="reference-about-description">
            Hưng Phát tập trung xây dựng danh mục rõ ràng, nguồn hàng ổn định và khả năng phối hợp phục vụ phù hợp với nhu cầu thực tế của cửa hàng, đại lý và đối tác.
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
