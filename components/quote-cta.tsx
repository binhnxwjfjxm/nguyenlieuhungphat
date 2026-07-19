import { ArrowRight, PhoneCall } from "lucide-react";
import { HapticLink } from "./haptic-link";

export function QuoteCta({ productName }: { productName?: string }) {
  const subject = encodeURIComponent(`Yêu cầu báo giá${productName ? ` - ${productName}` : " nguyên liệu"}`);

  return (
    <section className="quote-banner" id="bao-gia">
      <div>
        <p className="eyebrow light-eyebrow">HƯNG PHÁT ĐỒNG HÀNH CÙNG DOANH NGHIỆP</p>
        <h2>{productName ? `Cần báo giá ${productName}?` : "Anh đang cần nguồn nguyên liệu phù hợp?"}</h2>
        <p>Gửi nhu cầu, đội ngũ Hưng Phát sẽ liên hệ tư vấn và phản hồi báo giá nhanh chóng.</p>
      </div>
      <div className="quote-actions">
        <HapticLink className="button button-cream button-large" href={`mailto:info@hungphat.com?subject=${subject}`}>
          Gửi yêu cầu báo giá <ArrowRight size={18} />
        </HapticLink>
        <HapticLink className="button button-outline-light button-large" href="tel:0900123456">
          <PhoneCall size={18} /> Gọi tư vấn
        </HapticLink>
      </div>
    </section>
  );
}
