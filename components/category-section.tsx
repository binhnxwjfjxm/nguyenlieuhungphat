import { ArrowUpRight } from "lucide-react";
import { categories } from "@/data/site";
import { HapticLink } from "./haptic-link";
import { Reveal } from "./reveal";
import { ResponsiveAssetPicture } from "./responsive-asset-picture";

export function CategorySection() {
  return (
    <section className="section company-category-section" id="danh-muc">
      <div className="container">
        <Reveal>
          <div className="section-heading company-section-heading">
            <p className="eyebrow">NGÀNH HÀNG</p>
            <h2 className="gradient-heading">Sáu ngành hàng ưu tiên của Hưng Phát</h2>
            <p>
              Khám phá các nhóm nguyên liệu và vật tư Hưng Phát đang giới thiệu cho cửa hàng,
              đại lý và đối tác F&amp;B.
            </p>
          </div>
        </Reveal>

        <div className="company-category-grid">
          {categories.map((category, index) => (
            <Reveal key={category.slug} delay={index * 0.035}>
              <HapticLink className="company-category-card" href={`/nganh-hang/${category.slug}`}>
                <div className="company-category-image">
                  <ResponsiveAssetPicture
                    className="company-category-picture"
                    imgClassName="company-category-picture-img"
                    alt={`Ngành hàng ${category.title}`}
                    desktopSrc={category.image}
                    desktopFallbackSrc={category.fallback}
                    imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
                  />
                </div>
                <div className="company-category-copy">
                  <h3>{category.title}</h3>
                  <p>{category.description}</p>
                  <span>
                    Xem giới thiệu <ArrowUpRight size={15} />
                  </span>
                </div>
              </HapticLink>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.05}>
          <div className="company-section-footer">
            <HapticLink className="text-link" href="/san-pham">
              Xem danh mục giới thiệu <ArrowUpRight size={16} />
            </HapticLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
