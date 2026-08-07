import { ArrowRight, MessageCircle } from "lucide-react";
import { ZALO_URL } from "@/lib/contact";
import { siteAssets, siteAssetFallbacks } from "@/lib/site-assets";
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
        <p className="eyebrow light-eyebrow">BÁO GIÁ NHANH</p>
        <h2 className="gradient-heading">{productName ? `Báo giá ${productName}?` : "Cần nguồn hàng?"}</h2>
        <p>Gửi ngành hàng, sản phẩm, số lượng dự kiến và khu vực giao hàng.</p>
        <div className="quote-bullet-row" aria-label="Điểm nhấn báo giá">
          <span>Phản hồi nhanh</span>
          <span>Gợi ý theo nhóm hàng</span>
          <span>Phù hợp cửa hàng và đại lý</span>
        </div>
      </div>

      <div className="quote-actions">
        <QuoteButton className="button button-surface button-large" seed={{ product: productName ?? "", source: "quote-banner" }}>
          Nhận báo giá <ArrowRight size={18} />
        </QuoteButton>
        <a className="button button-outline-light button-large" href={ZALO_URL}>
          <MessageCircle size={18} /> Zalo tư vấn
        </a>
      </div>
    </section>
  );
}
