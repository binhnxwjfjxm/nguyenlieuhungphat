import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { categories } from "@/data/site";
import { HapticLink } from "./haptic-link";
import { Reveal } from "./reveal";

export function CategorySection() {
  return (
    <section className="section category-section" id="danh-muc">
      <div className="container">
        <Reveal>
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">DANH MỤC</p>
              <h2>Danh mục sản phẩm</h2>
              <p>Danh mục được tổ chức rõ ràng để khách hàng tìm đúng nguyên liệu nhanh hơn.</p>
            </div>
            <HapticLink className="text-link desktop-only-link" href="/san-pham">
              Xem tất cả <ArrowUpRight size={17} />
            </HapticLink>
          </div>
        </Reveal>

        <div className="category-scroller">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Reveal key={category.title} delay={index * 0.05}>
                <HapticLink className="category-card" href={`/san-pham?category=${category.slug}`}>
                  <div className="category-image-wrap">
                    <Image
                      src={category.image}
                      alt={`Ảnh minh họa danh mục ${category.title}`}
                      fill
                      sizes="(max-width: 720px) 78vw, 25vw"
                    />
                  </div>
                  <div className="category-content">
                    <span className="category-icon">
                      <Icon size={19} />
                    </span>
                    <h3>{category.title}</h3>
                    <p>{category.description}</p>
                    <small>{category.count}</small>
                  </div>
                </HapticLink>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
