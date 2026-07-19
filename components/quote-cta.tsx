import { ArrowRight, PhoneCall } from "lucide-react";
import { siteAssets, siteAssetFallbacks } from "@/lib/site-assets";
import { HapticLink } from "./haptic-link";
import { QuoteButton } from "./quote-trigger";
import { ResponsiveAssetPicture } from "./responsive-asset-picture";

export function QuoteCta({ productName }: { productName?: string }) {
  return (
    <section className="quote-banner" id="bao-gia">
      <div className="quote-banner-media" aria-hidden="true">
        <ResponsiveAssetPicture
          className="quote-banner-picture"
          imgClassName="quote-banner-picture-img"
          alt=""
          desktopSrc={siteAssets.quote.desktop}
          desktopFallbackSrc={siteAssetFallbacks.quote.desktop}
          mobileSrc={siteAssets.quote.mobile}
          mobileFallbackSrc={siteAssetFallbacks.quote.mobile}
          imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
        />
      </div>
      <div className="quote-banner-copy">
        <p className="eyebrow light-eyebrow">HƯNG PHÁT ĐỒNG HÀNH CÙNG DOANH NGHIỆP</p>
        <h2>{productName ? `Cần báo giá ${productName}?` : "Cần nguồn hàng cho cửa hàng hoặc đại lý?"}</h2>
        <p>
          Gửi ngành hàng, sản phẩm cần tìm, số lượng dự kiến và khu vực giao hàng. Hưng Phát sẽ tiếp nhận và phản hồi báo
          giá phù hợp.
        </p>
      </div>
      <div className="quote-actions">
        <QuoteButton
          className="button button-cream button-large"
          seed={{ product: productName ?? "", usage: productName ?? "", source: "quote-banner" }}
        >
          Nhận báo giá <ArrowRight size={18} />
        </QuoteButton>
        <HapticLink className="button button-outline-light button-large" href="tel:0900123456">
          <PhoneCall size={18} /> Gọi tư vấn
        </HapticLink>
      </div>
    </section>
  );
}
