import { ArrowUpRight } from "lucide-react";
import { categories } from "@/data/site";
import { siteAssets, siteAssetFallbacks } from "@/lib/site-assets";
import { HapticLink } from "./haptic-link";
import { Reveal } from "./reveal";
import { ResponsiveAssetPicture } from "./responsive-asset-picture";

const categoryAssetBySlug = {
  "nguyen-lieu-pha-che": {
    src: siteAssets.categories.phaChe,
    fallback: siteAssetFallbacks.categories.phaChe,
  },
  "nguyen-lieu-mi-cay": {
    src: siteAssets.categories.miCay,
    fallback: siteAssetFallbacks.categories.miCay,
  },
  "hang-dong-lanh": {
    src: siteAssets.categories.dongLanh,
    fallback: siteAssetFallbacks.categories.dongLanh,
  },
} as const;

const interestTags = [
  "Siro",
  "Trà",
  "Bột pha chế",
  "Trân châu",
  "Thạch",
  "Topping",
  "Sốt mì cay",
  "Viên thả lẩu",
  "Hải sản",
  "Dim sum",
];

export function CategorySection() {
  const [featured, ...otherCategories] = categories;

  return (
    <section className="section category-section" id="danh-muc">
      <div className="container">
        <Reveal>
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">DANH MỤC NỔI BẬT</p>
              <h2 className="gradient-heading">Ba nhóm hàng chính cho khách mua sỉ</h2>
              <p>
                Gom gọn đúng ba hướng hàng đang có nhu cầu thật, để quán, đại lý và cửa hàng xem nhanh là biết nên đi vào nhóm nào.
              </p>
            </div>
            <HapticLink className="text-link desktop-only-link" href="/nganh-hang">
              Xem toàn bộ danh mục <ArrowUpRight size={17} />
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
                  Xem nhóm hàng <ArrowUpRight size={15} />
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
                        Xem nhóm hàng <ArrowUpRight size={15} />
                      </span>
                    </div>
                  </HapticLink>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container">
        <Reveal delay={0.05}>
          <div className="category-interest-strip">
            <div className="category-interest-copy">
              <p className="eyebrow">DANH MỤC ĐƯỢC QUAN TÂM</p>
              <h3>Những nhóm hàng đang được hỏi nhiều cho quán, cửa hàng và đại lý</h3>
            </div>

            <div className="interest-chip-row" aria-label="Danh mục được quan tâm">
              {interestTags.map((tag) => (
                <span className="interest-chip" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
