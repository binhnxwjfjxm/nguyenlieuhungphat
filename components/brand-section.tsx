import { ArrowUpRight } from "lucide-react";
import { productFamilies } from "@/data/products";
import { HapticLink } from "./haptic-link";
import { Reveal } from "./reveal";

const brandCounts = productFamilies.reduce((map, family) => {
  const brand = family.brand?.trim();
  if (!brand || brand.toLocaleLowerCase("vi") === "hưng phát") return map;
  map.set(brand, (map.get(brand) ?? 0) + 1);
  return map;
}, new Map<string, number>());

const featuredBrands = [...brandCounts.entries()]
  .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "vi"))
  .slice(0, 12)
  .map(([name, familyCount]) => ({ name, familyCount }));

function brandInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("vi"))
    .join("");
}

export function BrandSection() {
  if (!featuredBrands.length) return null;

  return (
    <section className="section brand-section" id="nhan-hang">
      <div className="container">
        <Reveal>
          <div className="section-heading split-heading company-section-heading">
            <div>
              <p className="eyebrow">NHÃN HÀNG</p>
              <h2 className="gradient-heading">Nhãn hàng trong danh mục Hưng Phát</h2>
              <p>
                Danh sách được lấy trực tiếp từ dữ liệu sản phẩm hiện có, không dùng nhãn hàng minh họa.
              </p>
            </div>
            <HapticLink className="text-link desktop-only-link" href="/san-pham">
              Xem danh mục giới thiệu <ArrowUpRight size={16} />
            </HapticLink>
          </div>
        </Reveal>

        <div className="brand-strip" aria-label="Nhãn hàng trong danh mục Hưng Phát">
          {featuredBrands.map((brand, index) => (
            <Reveal key={brand.name} delay={index * 0.025}>
              <div className="brand-pill">
                <span className="brand-mark" aria-hidden="true">{brandInitials(brand.name)}</span>
                <span className="brand-name">{brand.name}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
