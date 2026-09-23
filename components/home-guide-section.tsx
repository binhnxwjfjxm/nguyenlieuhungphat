import Image from "next/image";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { guideItems } from "@/data/guides";
import { HapticLink } from "./haptic-link";
import { Reveal } from "./reveal";

const homeGuides = guideItems.slice(0, 3);

export function HomeGuideSection() {
  return (
    <section className="section home-guide-section" id="cam-nang">
      <div className="container">
        <Reveal>
          <div className="section-heading split-heading company-section-heading">
            <div>
              <p className="eyebrow">CẨM NANG</p>
              <h2 className="gradient-heading">Thông tin hữu ích cho hoạt động F&amp;B</h2>
              <p>Các hướng dẫn ngắn về chọn nguyên liệu, bảo quản và quản lý nhập hàng.</p>
            </div>
            <HapticLink className="text-link desktop-only-link" href="/nganh-hang">
              Xem toàn bộ cẩm nang <ArrowUpRight size={16} />
            </HapticLink>
          </div>
        </Reveal>

        <div className="home-guide-grid">
          {homeGuides.map((guide, index) => (
            <Reveal key={guide.title} delay={index * 0.04}>
              <HapticLink className="home-guide-card" href="/nganh-hang">
                <div className="home-guide-image">
                  <Image
                    src={guide.image}
                    alt={guide.title}
                    fill
                    sizes="(max-width: 760px) 100vw, 33vw"
                  />
                </div>
                <div className="home-guide-copy">
                  <div className="home-guide-meta">
                    <span>{guide.badge}</span>
                    <small><Clock3 size={13} /> {guide.readingTime}</small>
                  </div>
                  <h3>{guide.title}</h3>
                  <p>{guide.summary}</p>
                </div>
              </HapticLink>
            </Reveal>
          ))}
        </div>

        <div className="company-section-footer mobile-only-footer">
          <HapticLink className="text-link" href="/nganh-hang">
            Xem toàn bộ cẩm nang <ArrowUpRight size={16} />
          </HapticLink>
        </div>
      </div>
    </section>
  );
}
