/* eslint-disable @next/next/no-img-element */

import { brands } from "@/data/brands";
import { Reveal } from "./reveal";

export function BrandSection() {
  if (!brands.length) return null;

  return (
    <section className="section brand-section" id="nhan-hang">
      <div className="container">
        <Reveal>
          <div className="section-heading company-section-heading">
            <p className="eyebrow">NHÃN HÀNG</p>
            <h2 className="gradient-heading">Nhãn hàng tiêu biểu</h2>
          </div>
        </Reveal>

        <div className="brand-logo-grid" aria-label="Nhãn hàng tiêu biểu trong danh mục Hưng Phát">
          {brands.map((brand, index) => (
            <Reveal key={brand.name} delay={index * 0.025}>
              <div className={`brand-logo-tile ${brand.logoTone === "dark" ? "is-dark" : "is-light"}`}>
                <img
                  className="brand-logo-image"
                  src={brand.logoSrc}
                  alt={brand.name}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
