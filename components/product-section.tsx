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
              <h2 className="gradient-heading">Chọn nhanh nhóm hàng đang bán tốt</h2>
              <p>
                Ưu tiên những sản phẩm có dữ liệu rõ ràng, dễ xem, dễ đối chiếu và phù hợp để gửi báo giá ngay cho quán, cửa hàng hoặc đại lý.
              </p>
            </div>
            <HapticLink className="text-link desktop-only-link" href="/san-pham">
              Mở toàn bộ danh mục <ArrowRight size={17} />
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
                Xem toàn bộ danh mục
              </HapticLink>
            </div>
          </>
        ) : (
          <div className="catalog-empty product-empty-state">
            <Search size={34} />
            <h2 className="gradient-heading">Chưa có sản phẩm phù hợp</h2>
            <p>Thử đổi bộ lọc hoặc gửi nhu cầu để em gợi ý đúng nhóm hàng và báo giá phù hợp hơn.</p>
          </div>
        )}
      </div>
    </section>
  );
}
