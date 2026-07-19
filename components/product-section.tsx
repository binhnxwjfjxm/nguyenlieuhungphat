import { ArrowRight, Search } from "lucide-react";
import { featuredProducts, productCategories } from "@/data/products";
import { HapticLink } from "./haptic-link";
import { ProductCard } from "./product-card";
import { QuoteCta } from "./quote-cta";
import { Reveal } from "./reveal";

export function ProductSection() {
  const hasProducts = featuredProducts.length > 0;

  return (
    <section className="section product-section" id="san-pham">
      <div className="container">
        <Reveal>
          <div className="section-heading split-heading product-heading">
            <div>
              <p className="eyebrow">SẢN PHẨM NỔI BẬT</p>
              <h2>Danh mục đang được cập nhật theo nhu cầu thực tế</h2>
            </div>
            <HapticLink className="text-link desktop-only-link" href="/san-pham">
              Xem tất cả <ArrowRight size={17} />
            </HapticLink>
          </div>
        </Reveal>

        <div className="filter-row" aria-label="Danh mục sản phẩm">
          <HapticLink className="filter-chip active" href="/san-pham">
            Tất cả
          </HapticLink>
          {productCategories.map((category) => (
            <HapticLink className="filter-chip" href={`/san-pham?category=${category.slug}`} key={category.slug}>
              {category.title}
            </HapticLink>
          ))}
        </div>

        {hasProducts ? (
          <div className="product-grid">
            {featuredProducts.map((product, index) => (
              <Reveal key={product.slug} delay={index * 0.06}>
                <ProductCard product={product} compact />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="catalog-empty product-empty-state">
            <Search size={34} />
            <h2>Danh mục đang được cập nhật</h2>
            <p>Vui lòng gửi nhu cầu để nhận tư vấn đúng ngành hàng và báo giá phù hợp.</p>
          </div>
        )}

        <Reveal>
          <QuoteCta />
        </Reveal>
      </div>
    </section>
  );
}
