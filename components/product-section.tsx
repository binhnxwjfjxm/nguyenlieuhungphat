import { ArrowRight, Search } from "lucide-react";
import { featuredProducts, productCategories } from "@/data/products";
import { HapticLink } from "./haptic-link";
import { ProductCard } from "./product-card";
import { Reveal } from "./reveal";

const previewProducts = featuredProducts.slice(0, 8);

export function ProductSection() {
  const hasProducts = previewProducts.length > 0;

  return (
    <section className="section product-section" id="san-pham">
      <div className="container">
        <Reveal>
          <div className="section-heading split-heading product-heading">
            <div>
              <p className="eyebrow">DANH MỤC SẢN PHẨM</p>
              <h2 className="gradient-heading">Catalog gọn, dễ lọc, dễ đi tiếp</h2>
              <p>Khách xem nhanh được nhóm hàng đang có dữ liệu thật, sau đó chuyển sang catalog đầy đủ để lọc sâu hơn.</p>
            </div>
            <HapticLink className="text-link desktop-only-link" href="/san-pham">
              Mở toàn bộ catalog <ArrowRight size={17} />
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
          <>
            <div className="product-grid">
              {previewProducts.map((product, index) => (
                <Reveal key={product.slug} delay={index * 0.06}>
                  <ProductCard product={product} compact />
                </Reveal>
              ))}
            </div>
            <div className="product-section-footer">
              <HapticLink className="button button-ghost" href="/san-pham">
                Xem toàn bộ catalog
              </HapticLink>
            </div>
          </>
        ) : (
          <div className="catalog-empty product-empty-state">
            <Search size={34} />
            <h2 className="gradient-heading">Danh mục đang được cập nhật</h2>
            <p>Gửi nhu cầu để nhận tư vấn đúng nhóm hàng và nhận báo giá phù hợp.</p>
          </div>
        )}
      </div>
    </section>
  );
}
