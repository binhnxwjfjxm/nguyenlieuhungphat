import { ArrowRight } from "lucide-react";
import { products } from "@/data/site";
import { HapticLink } from "./haptic-link";
import { ProductCard } from "./product-card";
import { Reveal } from "./reveal";

const filters = ["Tất cả", "Công nghiệp", "Thực phẩm", "Hóa chất", "Phụ gia"];

export function ProductSection() {
  return (
    <section className="section product-section" id="san-pham">
      <div className="container">
        <Reveal>
          <div className="section-heading split-heading product-heading">
            <div>
              <p className="eyebrow">SẢN PHẨM NỔI BẬT</p>
              <h2>Nguồn nguyên liệu cho nhiều lĩnh vực</h2>
            </div>
            <HapticLink className="text-link desktop-only-link" href="#san-pham">
              Xem tất cả <ArrowRight size={17} />
            </HapticLink>
          </div>
        </Reveal>

        <div className="filter-row" aria-label="Bộ lọc sản phẩm">
          {filters.map((filter, index) => (
            <button className={index === 0 ? "filter-chip active" : "filter-chip"} type="button" key={filter}>
              {filter}
            </button>
          ))}
        </div>

        <div className="product-grid">
          {products.map((product, index) => (
            <Reveal key={product.name} delay={index * 0.06}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <section className="quote-banner" id="bao-gia">
            <div>
              <p className="eyebrow light-eyebrow">HƯNG PHÁT ĐỒNG HÀNH CÙNG DOANH NGHIỆP</p>
              <h2>Anh đang cần nguồn nguyên liệu phù hợp?</h2>
              <p>Gửi nhu cầu, đội ngũ Hưng Phát sẽ liên hệ tư vấn và phản hồi báo giá nhanh chóng.</p>
            </div>
            <HapticLink className="button button-cream button-large" href="#lien-he">
              Gửi yêu cầu báo giá <ArrowRight size={18} />
            </HapticLink>
          </section>
        </Reveal>
      </div>
    </section>
  );
}
