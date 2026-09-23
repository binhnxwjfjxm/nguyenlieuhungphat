import { ArrowUpRight } from "lucide-react";
import { brands, brandInitials } from "@/data/brands";
import { HapticLink } from "./haptic-link";
import { Reveal } from "./reveal";

const featuredBrands = brands.slice(0, 12);

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
              <p>Danh sách được tổng hợp trực tiếp từ dữ liệu sản phẩm hiện có của Công Ty.</p>
            </div>
            <HapticLink className="text-link desktop-only-link" href="/nhan-hang">
              Xem toàn bộ nhãn hàng <ArrowUpRight size={16} />
            </HapticLink>
          </div>
        </Reveal>

        <div className="brand-strip" aria-label="Nhãn hàng trong danh mục Hưng Phát">
          {featuredBrands.map((brand, index) => (
            <Reveal key={brand.name} delay={index * 0.025}>
              <HapticLink className="brand-pill" href={`/san-pham?q=${encodeURIComponent(brand.name)}`}>
                <span className="brand-mark" aria-hidden="true">{brandInitials(brand.name)}</span>
                <span className="brand-name">{brand.name}</span>
              </HapticLink>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
