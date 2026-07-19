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
          initial={reduceMotion ? false : { opacity: 0, x: -24 }}
          animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="eyebrow">CÔNG TY TNHH TM NGUYÊN LIỆU HƯNG PHÁT</p>
          <h1>
            Vững nền tảng
            <span>Phát triển bền vững</span>
            Thịnh vượng lâu dài
          </h1>
          <p className="hero-description">
            Kết nối nguồn nguyên liệu chất lượng, tối ưu lưu thông hàng hóa và xây dựng nền tảng đồng bộ cho hoạt
            động sản xuất của doanh nghiệp.
          </p>
          <div className="hero-actions">
            <HapticLink className="button button-primary button-large" href="#san-pham">
              Khám phá sản phẩm <ArrowRight size={18} />
            </HapticLink>
            <HapticLink className="button button-secondary button-large" href="#bao-gia">
              <MessageCircle size={18} /> Tư vấn miễn phí
            </HapticLink>
          </div>
        </motion.div>

        <motion.div
          className="hero-visual"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.75, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hero-orbit" />
          <ResponsiveAssetPicture
            className="hero-picture"
            imgClassName="hero-picture-img"
            alt="Kho hàng và nguyên liệu Hưng Phát"
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
