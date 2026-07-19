import { ArrowUpRight } from "lucide-react";
import { categories } from "@/data/site";
import { siteAssets, siteAssetFallbacks } from "@/lib/site-assets";
import { HapticLink } from "./haptic-link";
import { Reveal } from "./reveal";
import { ResponsiveAssetPicture } from "./responsive-asset-picture";

const categoryAssetBySlug = {
  "nguyen-lieu-cong-nghiep": {
    src: siteAssets.categories.industrial,
    fallback: siteAssetFallbacks.categories.industrial,
  },
  "hoa-chat-phu-gia": {
    src: siteAssets.categories.chemical,
    fallback: siteAssetFallbacks.categories.chemical,
  },
  "nguyen-lieu-thuc-pham": {
    src: siteAssets.categories.food,
    fallback: siteAssetFallbacks.categories.food,
  },
  "vat-tu-bao-bi": {
    src: siteAssets.categories.packaging,
    fallback: siteAssetFallbacks.categories.packaging,
  },
} as const;

export function CategorySection() {
  return (
    <section className="section category-section" id="danh-muc">
      <div className="container">
        <Reveal>
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">DANH MỤC</p>
              <h2>Danh mục sản phẩm</h2>
              <p>Danh mục được tổ chức rõ ràng để khách hàng tìm đúng nguyên liệu nhanh hơn.</p>
            </div>
            <HapticLink className="text-link desktop-only-link" href="/san-pham">
              Xem tất cả <ArrowUpRight size={17} />
            </HapticLink>
          </div>
        </Reveal>

        <div className="category-scroller">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const asset = categoryAssetBySlug[category.slug as keyof typeof categoryAssetBySlug];

            return (
              <Reveal key={category.title} delay={index * 0.05}>
                <HapticLink className="category-card" href={`/san-pham?category=${category.slug}`}>
                  <div className="category-image-wrap">
                    <ResponsiveAssetPicture
                      className="category-picture"
                      imgClassName="category-picture-img"
                      alt={`Ảnh minh họa danh mục ${category.title}`}
                      desktopSrc={asset.src}
                      desktopFallbackSrc={asset.fallback}
                      priority={index === 0}
                      imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
                    />
                  </div>
                  <div className="category-content">
                    <span className="category-icon">
                      <Icon size={19} />
                    </span>
                    <h3>{category.title}</h3>
                    <p>{category.description}</p>
                    <small>{category.count}</small>
                  </div>
                </HapticLink>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
