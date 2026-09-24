"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { siteAssets, siteAssetFallbacks } from "@/lib/site-assets";
import { HapticLink } from "./haptic-link";
import { ResponsiveAssetPicture } from "./responsive-asset-picture";

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="reference-home-hero" id="trang-chu">
      <div className="reference-home-hero-media">
        <ResponsiveAssetPicture
          className="reference-home-hero-picture"
          imgClassName="reference-home-hero-image"
          alt="Nguyên liệu pha chế và ngành hàng F&B Hưng Phát"
          desktopSrc={siteAssets.pageHero.nganhHang}
          desktopFallbackSrc={siteAssetFallbacks.pageHero.nganhHang}
          mobileSrc={siteAssets.categories.phaChe}
          mobileFallbackSrc={siteAssetFallbacks.categories.phaChe}
          priority
          imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
        />
        <div className="reference-home-hero-shade" aria-hidden="true" />
      </div>

      <div className="container reference-home-hero-inner">
        <motion.div
          className="reference-home-hero-copy"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="reference-home-hero-badge">ĐỒNG HÀNH CÙNG F&amp;B VIỆT NAM</p>
          <h1>Nguyên liệu chất lượng<br />Kiến tạo thành công</h1>
          <p>
            Hưng Phát giới thiệu các ngành hàng nguyên liệu, thực phẩm, bao bì và gia vị
            phục vụ cửa hàng, đại lý và đối tác F&amp;B.
          </p>
          <div className="reference-home-hero-actions">
            <HapticLink className="button reference-home-primary" href="/#danh-muc">
              Khám phá ngành hàng <ArrowRight size={17} />
            </HapticLink>
            <HapticLink className="button reference-home-secondary" href="/gioi-thieu">
              Giới thiệu về Hưng Phát
            </HapticLink>
          </div>
        </motion.div>

        <div className="reference-home-hero-pager" aria-hidden="true">
          <span><strong>01</strong> / 03</span>
          <ChevronLeft size={18} />
          <ChevronRight size={18} />
        </div>
      </div>
    </section>
  );
}
