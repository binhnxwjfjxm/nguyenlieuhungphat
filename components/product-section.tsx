import { ArrowRight, Search } from "lucide-react";
import { featuredProductFamilies, productCategories, productVariantLabel } from "@/data/products";
import { HapticLink } from "./haptic-link";
import { ProductCard } from "./product-card";
import { Reveal } from "./reveal";

const previewFamilies = featuredProductFamilies.slice(0, 8);

export function ProductSection() {
  const hasProducts = previewFamilies.length > 0;

  return (
    <section className="section product-section" id="san-pham">
      <div className="container">
        <Reveal>
          <div className="section-heading split-heading product-heading">
            <div>
              <p className="eyebrow">DANH MỤC SẢN PHẨM</p>
              <h2 className="gradient-heading">Chọn nhanh nhóm hàng đang bán tốt</h2>
              <p>
                Mỗi dòng sản phẩm được gom thành một thẻ; các vị và quy cách nằm bên trong để khách dễ xem và đối chiếu hơn.
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
              {previewFamilies.map((family, index) => (
                <Reveal key={family.key} delay={index * 0.06}>
                  <ProductCard
                    product={family.primary}
                    compact
                    displayName={family.name}
                    variantCount={family.variants.length}
                    variantLabels={family.variants.map((product) => productVariantLabel(product, family))}
                  />
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
            <p>Thử đổi bộ lọc hoặc gửi nhu cầu để được gợi ý đúng nhóm hàng và báo giá phù hợp hơn.</p>
          </div>
        )}
      </div>
    </section>
  );
}