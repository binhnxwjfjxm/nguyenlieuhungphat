"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { stats } from "@/data/site";
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
          <h1>
            Nguồn hàng phù hợp
            <span>Phân phối linh hoạt</span>
            Đồng hành cùng kinh doanh
          </h1>
          <p className="hero-description">
            Hưng Phát chuyên thương mại và phân phối nguyên liệu pha chế, nguyên liệu mì cay và hàng đông lạnh cho cửa hàng, đại lý và đối
            tác kinh doanh.
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
          <div className="hero-orbit" />
          <ResponsiveAssetPicture
            className="hero-picture"
            imgClassName="hero-picture-img"
            alt="Hình ảnh minh họa không gian trưng bày và kho hàng Hưng Phát"
            desktopSrc={siteAssets.hero.desktop}
            desktopFallbackSrc={siteAssetFallbacks.hero.desktop}
            mobileSrc={siteAssets.hero.mobile}
            mobileFallbackSrc={siteAssetFallbacks.hero.mobile}
            priority
            imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
          />
          <div className="hero-badge">
            <span>Since</span>
            <strong>2016</strong>
          </div>
        </motion.div>
      </div>

      <div className="container hero-stats-wrap">
        <div className="hero-stats">
          {stats.map((stat) => (
            <div className="stat-item" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
