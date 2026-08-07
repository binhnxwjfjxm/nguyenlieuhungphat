import { ArrowUpRight } from "lucide-react";
import { categories } from "@/data/site";
import { HapticLink } from "./haptic-link";
import { Reveal } from "./reveal";
import { ResponsiveAssetPicture } from "./responsive-asset-picture";

const interestTags = [
  "Siro",
  "Trà",
  "Bột pha chế",
  "Trân châu",
  "Thạch",
  "Topping",
  "Sốt mì cay",
  "Viên thả lẩu",
  "Ăn vặt",
  "Bao bì",
  "Gia vị & sốt",
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
              <h2 className="gradient-heading">Sáu ngành hàng ưu tiên cho khách mua sỉ</h2>
              <p>
                Đồng bộ với danh mục đặt hàng: trà sữa, mì cay, đông lạnh, ăn vặt, bao bì và gia vị - sốt.
              </p>
            </div>
            <HapticLink className="text-link desktop-only-link" href="/san-pham">
              Xem toàn bộ sản phẩm <ArrowUpRight size={17} />
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
                  desktopSrc={featured.image}
                  desktopFallbackSrc={featured.fallback}
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

              return (
                <Reveal key={category.title} delay={index * 0.04}>
                  <HapticLink className="category-card category-card-compact" href={`/nganh-hang/${category.slug}`}>
                    <div className="category-image-wrap">
                      <ResponsiveAssetPicture
                        className="category-picture"
                        imgClassName="category-picture-img"
                        alt={`Ảnh minh họa danh mục ${category.title}`}
                        desktopSrc={category.image}
                        desktopFallbackSrc={category.fallback}
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

      <div className="container">
        <Reveal delay={0.05}>
          <div className="category-interest-strip">
            <div className="category-interest-copy">
              <p className="eyebrow">DANH MỤC ĐƯỢC QUAN TÂM</p>
              <h3>Những nhóm hàng khách thường tìm nhanh</h3>
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
