import { ArrowRight } from "lucide-react";
import { HapticLink } from "./haptic-link";
import { Reveal } from "./reveal";

export function CompanyContactCta() {
  return (
    <section className="section section-tight company-contact-section">
      <div className="container">
        <Reveal>
          <div className="company-contact-cta">
            <div>
              <p className="eyebrow">KẾT NỐI CÙNG HƯNG PHÁT</p>
              <h2>Sẵn sàng đồng hành cùng bạn</h2>
              <p>
                Trao đổi với Công Ty khi bạn cần tìm hiểu thêm về ngành hàng, nhãn hàng hoặc năng lực phân phối.
              </p>
            </div>
            <HapticLink className="button company-contact-button" href="/lien-he">
              Liên hệ ngay <ArrowRight size={17} />
            </HapticLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
