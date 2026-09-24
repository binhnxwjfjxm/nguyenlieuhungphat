import { ArrowRight } from "lucide-react";
import { siteAssets } from "@/lib/site-assets";
import { HapticLink } from "./haptic-link";

export function CompanyContactCta() {
  return (
    <section className="reference-contact-section">
      <div className="reference-contact-banner" style={{ backgroundImage: `linear-gradient(90deg, rgba(9, 44, 32, .93), rgba(9, 44, 32, .72)), url("${siteAssets.quote.desktop}")` }}>
        <div className="container reference-contact-inner">
          <div>
            <p className="eyebrow">HƯNG PHÁT</p>
            <h2>Sẵn sàng đồng hành cùng bạn!</h2>
            <p>Liên hệ với Công Ty để trao đổi thêm về ngành hàng, nhãn hàng và năng lực phân phối.</p>
          </div>
          <HapticLink className="button reference-contact-button" href="/lien-he">
            Liên hệ ngay <ArrowRight size={17} />
          </HapticLink>
        </div>
      </div>
    </section>
  );
}
