import { ArrowRight } from "lucide-react";
import { featuredProducts, productCategories } from "@/data/products";
import { HapticLink } from "./haptic-link";
import { ProductCard } from "./product-card";
import { QuoteCta } from "./quote-cta";
import { Reveal } from "./reveal";

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
            <HapticLink className="text-link desktop-only-link" href="/san-pham">
              Xem tất cả <ArrowRight size={17} />
            </HapticLink>
          </div>
        </Reveal>

        <div className="filter-row" aria-label="Danh mục sản phẩm">
          <HapticLink className="filter-chip active" href="/san-pham">Tất cả</HapticLink>
          {productCategories.slice(0, 3).map((category) => (
            <HapticLink className="filter-chip" href={`/san-pham?category=${category.slug}`} key={category.slug}>
              {category.title}
            </HapticLink>
          ))}
        </div>

        <div className="product-grid">
          {featuredProducts.map((product, index) => (
            <Reveal key={product.slug} delay={index * 0.06}>
              <ProductCard product={product} compact />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <QuoteCta />
        </Reveal>
      </div>
    </section>
  );
}
