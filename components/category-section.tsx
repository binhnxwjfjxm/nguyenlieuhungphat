import { ArrowRight, MoreHorizontal } from "lucide-react";
import { categories } from "@/data/site";
import { HapticLink } from "./haptic-link";
import { ResponsiveAssetPicture } from "./responsive-asset-picture";

export function CategorySection() {
  return (
    <section className="reference-category-section" id="danh-muc">
      <div className="container reference-category-strip" aria-label="Các ngành hàng Hưng Phát">
        {categories.map((category) => (
          <HapticLink className="reference-category-item" href={`/nganh-hang/${category.slug}`} key={category.slug}>
            <span className="reference-category-image">
              <ResponsiveAssetPicture
                className="reference-category-picture"
                imgClassName="reference-category-picture-img"
                alt={category.title}
                desktopSrc={category.image}
                desktopFallbackSrc={category.fallback}
                imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
              />
            </span>
            <span>{category.title}</span>
          </HapticLink>
        ))}
        <HapticLink className="reference-category-item reference-category-more" href="/nganh-hang">
          <span className="reference-category-image reference-category-more-icon"><MoreHorizontal size={26} /></span>
          <span>Xem thêm <ArrowRight size={13} /></span>
        </HapticLink>
      </div>
    </section>
  );
}
