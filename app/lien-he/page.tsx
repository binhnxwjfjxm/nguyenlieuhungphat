import type { Metadata } from "next";
import Image from "next/image";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import {
  COMPANY_ADDRESS_DISPLAY,
  COMPANY_EMAIL,
  COMPANY_NAME,
  ZALO_PHONE_DISPLAY,
  ZALO_URL,
} from "@/lib/contact";
import { getAbsoluteUrl } from "@/lib/site";
import { siteAssets } from "@/lib/site-assets";

export const metadata: Metadata = {
  title: "Liên hệ",
  description: "Liên hệ Hưng Phát để trao đổi về ngành hàng, nhãn hàng, năng lực phân phối hoặc các nội dung hợp tác.",
  alternates: { canonical: "/lien-he" },
  openGraph: {
    title: "Liên hệ | Hưng Phát",
    description: "Thông tin liên hệ và biểu mẫu trao đổi với Công Ty Hưng Phát.",
    url: getAbsoluteUrl("/lien-he"),
  },
};

export default function LienHePage() {
  return (
    <main className="content-page content-page-v2">
      <section className="page-hero">
        <div className="container page-hero-inner page-hero-with-image">
          <div>
            <p className="eyebrow">LIÊN HỆ</p>
            <h1 className="gradient-heading">Trao đổi trực tiếp với Hưng Phát</h1>
            <p>Để lại thông tin và nội dung cần trao đổi. Bộ phận phù hợp của Công Ty sẽ tiếp nhận và phản hồi.</p>
          </div>
          <div className="page-hero-image">
            <Image src={siteAssets.pageHero.lienHe} alt="Liên hệ Công Ty Hưng Phát" fill priority sizes="(max-width: 900px) 100vw, 40vw" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container contact-v2-grid">
          <aside className="contact-card contact-info-v2">
            <p className="eyebrow">THÔNG TIN CÔNG TY</p>
            <h2 className="gradient-heading">{COMPANY_NAME}</h2>
            <a href={ZALO_URL}><MessageCircle size={17} /> Zalo {ZALO_PHONE_DISPLAY}</a>
            <a href={`mailto:${COMPANY_EMAIL}`}><Mail size={17} /> {COMPANY_EMAIL}</a>
            <p><MapPin size={17} /> {COMPANY_ADDRESS_DISPLAY}</p>
          </aside>

          <div className="contact-card contact-form-card contact-form-v2-card">
            <p className="eyebrow">NỘI DUNG LIÊN HỆ</p>
            <h2 className="gradient-heading">Gửi thông tin cho Hưng Phát</h2>
            <p className="contact-form-intro">Biểu mẫu chỉ thu thông tin cần thiết để Công Ty phản hồi nội dung trao đổi.</p>
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  );
}
