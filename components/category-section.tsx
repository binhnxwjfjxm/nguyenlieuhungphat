import { ArrowUpRight } from "lucide-react";
import { categories } from "@/data/site";
import { siteAssets, siteAssetFallbacks } from "@/lib/site-assets";
import { HapticLink } from "./haptic-link";
import { Reveal } from "./reveal";
import { ResponsiveAssetPicture } from "./responsive-asset-picture";

const categoryAssetBySlug = {
  "nguyen-lieu-pha-che": {
    src: siteAssets.categories.industrial,
    fallback: siteAssetFallbacks.categories.industrial,
  },
  "nguyen-lieu-mi-cay": {
    src: siteAssets.categories.chemical,
    fallback: siteAssetFallbacks.categories.chemical,
  },
  "hang-dong-lanh": {
    src: siteAssets.categories.food,
    fallback: siteAssetFallbacks.categories.food,
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
              <h2 className="gradient-heading">3 ngành hàng chính</h2>
              <p>Danh mục được sắp xếp gọn để khách vào đúng nhóm nhanh hơn.</p>
            </div>
            <HapticLink className="text-link desktop-only-link" href="/nganh-hang">
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
                <HapticLink className="category-card" href={`/nganh-hang/${category.slug}`}>
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
