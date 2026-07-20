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
  const [featured, ...otherCategories] = categories;

  return (
    <section className="section category-section" id="danh-muc">
      <div className="container">
        <Reveal>
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">NGÀNH HÀNG</p>
              <h2 className="gradient-heading">Ba nhóm hàng chính</h2>
              <p>Danh mục được giữ gọn để khách vào đúng nhánh hàng nhanh hơn và không phải lướt qua quá nhiều lựa chọn rời rạc.</p>
            </div>
            <HapticLink className="text-link desktop-only-link" href="/nganh-hang">
              Xem tất cả <ArrowUpRight size={17} />
            </HapticLink>
          </div>
        </Reveal>

        <div className="category-layout">
          <Reveal>
            <HapticLink className="category-card category-card-featured" href={`/nganh-hang/${featured.slug}`}>
              <div className="category-image-wrap">
                <ResponsiveAssetPicture
                  className="category-picture"
                  imgClassName="category-picture-img"
                  alt={`Ảnh minh họa danh mục ${featured.title}`}
                  desktopSrc={categoryAssetBySlug[featured.slug as keyof typeof categoryAssetBySlug].src}
                  desktopFallbackSrc={categoryAssetBySlug[featured.slug as keyof typeof categoryAssetBySlug].fallback}
                  priority
                  imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
                />
              </div>
              <div className="category-content">
                <span className="category-icon">
                  <featured.icon size={19} />
                </span>
                <h3>{featured.title}</h3>
                <p>{featured.description}</p>
                <span className="category-link-text">
                  Xem ngành hàng <ArrowUpRight size={15} />
                </span>
              </div>
            </HapticLink>
          </Reveal>

          <div className="category-stack">
            {otherCategories.map((category, index) => {
              const Icon = category.icon;
              const asset = categoryAssetBySlug[category.slug as keyof typeof categoryAssetBySlug];

              return (
                <Reveal key={category.title} delay={index * 0.05}>
                  <HapticLink className="category-card category-card-compact" href={`/nganh-hang/${category.slug}`}>
                    <div className="category-image-wrap">
                      <ResponsiveAssetPicture
                        className="category-picture"
                        imgClassName="category-picture-img"
                        alt={`Ảnh minh họa danh mục ${category.title}`}
                        desktopSrc={asset.src}
                        desktopFallbackSrc={asset.fallback}
                        imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
                      />
                    </div>
                    <div className="category-content">
                      <span className="category-icon">
                        <Icon size={19} />
                      </span>
                      <h3>{category.title}</h3>
                      <p>{category.description}</p>
                      <span className="category-link-text">
                        Xem ngành hàng <ArrowUpRight size={15} />
                      </span>
                    </div>
                  </HapticLink>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
