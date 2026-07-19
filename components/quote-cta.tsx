import type { CSSProperties } from "react";
import { ArrowRight, PhoneCall } from "lucide-react";
import { siteAssets } from "@/lib/site-assets";
import { HapticLink } from "./haptic-link";
import { QuoteButton } from "./quote-trigger";

export function QuoteCta({ productName }: { productName?: string }) {
  return (
    <section className="quote-banner" id="bao-gia">
      <div
        className="quote-banner-media"
        aria-hidden="true"
        style={
          {
            "--quote-banner-desktop": `url("${siteAssets.quote.desktop}")`,
            "--quote-banner-mobile": `url("${siteAssets.quote.mobile}")`,
          } as CSSProperties
        }
      />
      <div className="quote-banner-copy">
        <p className="eyebrow light-eyebrow">HƯNG PHÁT ĐỒNG HÀNH CÙNG DOANH NGHIỆP</p>
        <h2>{productName ? `Cần báo giá ${productName}?` : "Anh đang cần nguồn nguyên liệu phù hợp?"}</h2>
        <p>Gửi nhu cầu, đội ngũ Hưng Phát sẽ liên hệ tư vấn và phản hồi báo giá nhanh chóng.</p>
      </div>
      <div className="quote-actions">
        <QuoteButton
          className="button button-cream button-large"
          seed={{ product: productName ?? "", usage: productName ?? "", source: "quote-banner" }}
        >
          Gửi yêu cầu báo giá <ArrowRight size={18} />
        </QuoteButton>
        <HapticLink className="button button-outline-light button-large" href="tel:0900123456">
          <PhoneCall size={18} /> Gọi tư vấn
        </HapticLink>
      </div>
    </section>
  );
}
