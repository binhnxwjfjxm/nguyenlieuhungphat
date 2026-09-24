import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { guideItems } from "@/data/guides";
import { HapticLink } from "./haptic-link";

const homeGuides = guideItems.slice(0, 4);

export function HomeGuideSection() {
  return (
    <section className="reference-guide-section" id="cam-nang">
      <div className="container">
        <div className="reference-section-heading-row">
          <div>
            <p className="eyebrow">CẨM NANG</p>
            <h2>Thông tin hữu ích cho hoạt động F&amp;B</h2>\n            <p>Các hướng dẫn ngắn về chọn nguyên liệu, bảo quản và quản lý nhập hàng.</p>
          </div>
          <HapticLink className="reference-view-all" href="/cam-nang">
            Xem tất cả <ArrowRight size={15} />
          </HapticLink>
        </div>
        <div className="reference-guide-grid">
          {homeGuides.map((guide) => (
            <HapticLink className="reference-guide-card" href="/cam-nang" key={guide.title}>
              <div className="reference-guide-image">
                <Image src={guide.image} alt={guide.title} fill sizes="(max-width: 760px) 86vw, 25vw" />
                <span>{guide.badge}</span>
              </div>
              <div className="reference-guide-copy">
                <h3>{guide.title}</h3>
                <p>{guide.summary}</p>
                <small>{guide.readingTime}</small>
              </div>
            </HapticLink>
          ))}
        </div>
      </div>
    </section>
  );
}
