"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { siteAssets, siteAssetFallbacks } from "@/lib/site-assets";
import { HapticLink } from "./haptic-link";
import { ResponsiveAssetPicture } from "./responsive-asset-picture";

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="hero" id="trang-chu">
      <div className="hero-glow hero-glow-one" />
      <div className="hero-glow hero-glow-two" />
      <div className="container hero-grid">
        <motion.div
          className="hero-copy"
          initial={reduceMotion ? false : { opacity: 1, x: -18 }}
          animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="eyebrow">CÔNG TY TNHH TM NGUYÊN LIỆU HƯNG PHÁT</p>
          <h1 className="gradient-heading">
            Nguồn hàng phù hợp
            <span>Phân phối linh hoạt</span>
            Đồng hành cùng kinh doanh
          </h1>
          <p className="hero-description">
            Hưng Phát chuyên thương mại và phân phối nguyên liệu pha chế, mì cay và hàng đông lạnh cho khách B2B.
          </p>
          <div className="hero-actions">
            <HapticLink className="button button-primary button-large" href="/nganh-hang">
              Xem ngành hàng <ArrowRight size={18} />
            </HapticLink>
            <HapticLink className="button button-secondary button-large" href="/lien-he">
              <MessageCircle size={18} /> Nhận báo giá
            </HapticLink>
          </div>
        </motion.div>

        <motion.div
          className="hero-visual"
          initial={reduceMotion ? false : { opacity: 1, scale: 0.98 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hero-collage">
            <ResponsiveAssetPicture
              className="hero-picture hero-picture-main"
              imgClassName="hero-picture-img"
              alt="Hình ảnh minh họa không gian trưng bày và kho hàng Hưng Phát"
              desktopSrc={siteAssets.hero.desktop}
              desktopFallbackSrc={siteAssetFallbacks.hero.desktop}
              mobileSrc={siteAssets.hero.mobile}
              mobileFallbackSrc={siteAssetFallbacks.hero.mobile}
              priority
              imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
            />

            <div className="hero-stack" aria-hidden="true">
              <div className="hero-mini-card hero-mini-card-top">
                <ResponsiveAssetPicture
                  className="hero-mini-picture"
                  imgClassName="hero-mini-picture-img"
                  alt=""
                  desktopSrc={siteAssets.categories.industrial}
                  desktopFallbackSrc={siteAssetFallbacks.categories.industrial}
                  imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
                />
              </div>
              <div className="hero-mini-card hero-mini-card-bottom">
                <ResponsiveAssetPicture
                  className="hero-mini-picture"
                  imgClassName="hero-mini-picture-img"
                  alt=""
                  desktopSrc={siteAssets.warehouse.two}
                  desktopFallbackSrc={siteAssetFallbacks.warehouse.two}
                  imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
