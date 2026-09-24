import { ArrowRight } from "lucide-react";
import { siteAssets } from "@/lib/site-assets";
import { HapticLink } from "./haptic-link";

export function CompanyContactCta() {
  return (
    <section className="reference-contact-section">
      <div className="reference-contact-banner" style={{ backgroundImage: `linear-gradient(90deg, rgba(9, 44, 32, .93), rgba(9, 44, 32, .72)), url("${siteAssets.quote.desktop}")` }}>
        <div className="container reference-contact-inner">
          <div>
            <p className="eyebrow">LIÊN HỆ</p>
            <h2>Liên hệ Công Ty</h2>
            <p>Gửi thông tin khi cần trao đổi về ngành hàng, nhãn hàng hoặc năng lực phân phối.</p>
          </div>
          <HapticLink className="button reference-contact-button" href="/lien-he">
            Gửi thông tin <ArrowRight size={17} />
          </HapticLink>
        </div>
      </div>
    </section>
  );
}
