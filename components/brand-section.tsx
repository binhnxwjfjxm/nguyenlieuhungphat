/* eslint-disable @next/next/no-img-element */

import { ArrowRight } from "lucide-react";
import { brands } from "@/data/brands";
import { HapticLink } from "./haptic-link";

export function BrandSection() {
  if (!brands.length) return null;

  return (
    <section className="reference-brand-section" id="nhan-hang">
      <div className="container">
        <div className="reference-section-heading-row">
          <div>
            <p className="eyebrow">NHÃN HÀNG</p>
            <h2>Nhãn hàng tiêu biểu</h2>
          </div>
          <HapticLink className="reference-view-all" href="/nhan-hang">
            Xem tất cả <ArrowRight size={15} />
          </HapticLink>
        </div>

        <div className="reference-brand-strip" aria-label="Nhãn hàng tiêu biểu trong danh mục Hưng Phát">
          {brands.map((brand) => (
            <div className={`reference-brand-tile ${brand.logoTone === "dark" ? "is-dark" : "is-light"}`} key={brand.name}>
              <img className="brand-logo-image" src={brand.logoSrc} alt={brand.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
