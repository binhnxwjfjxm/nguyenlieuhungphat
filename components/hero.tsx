"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { siteAssets, siteAssetFallbacks } from "@/lib/site-assets";
import { HapticLink } from "./haptic-link";
import { ResponsiveAssetPicture } from "./responsive-asset-picture";

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="hero" id="trang-chu">
      <div className="container hero-grid">
        <motion.div
          className="hero-copy"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="eyebrow">PHÂN PHỐI NGUYÊN LIỆU F&amp;B</p>
          <h1 className="gradient-heading">
            Nguyên liệu chất lượng
            <span>Đồng hành cùng tăng trưởng</span>
          </h1>
          <p className="hero-description">
            Hưng Phát giới thiệu hệ thống ngành hàng, nhãn hàng và năng lực phân phối phục vụ cửa hàng,
            đại lý và đối tác kinh doanh F&amp;B.
          </p>

          <div className="hero-actions">
            <HapticLink className="button button-primary button-large" href="/#danh-muc">
              Khám phá ngành hàng <ArrowRight size={17} />
            </HapticLink>
            <HapticLink className="button button-secondary button-large" href="/gioi-thieu">
              Giới thiệu về Hưng Phát
            </HapticLink>
          </div>

          <div className="hero-meta" aria-label="Thông tin Hưng Phát">
            <span><strong>2016</strong><small>Thành lập</small></span>
            <span><strong>6</strong><small>Ngành hàng</small></span>
            <span><strong>B2B</strong><small>Đối tác kinh doanh</small></span>
          </div>
        </motion.div>

        <motion.div
          className="hero-visual"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.58, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hero-collage">
            <ResponsiveAssetPicture
              className="hero-picture hero-picture-main"
              imgClassName="hero-picture-img"
              alt="Ngành hàng nguyên liệu F&B Hưng Phát"
              desktopSrc={siteAssets.pageHero.nganhHang}
              desktopFallbackSrc={siteAssetFallbacks.pageHero.nganhHang}
              mobileSrc={siteAssets.categories.phaChe}
              mobileFallbackSrc={siteAssetFallbacks.categories.phaChe}
              priority
              imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
            />

            <div className="hero-stack" aria-hidden="true">
              <div className="hero-mini-card hero-mini-card-top">
                <ResponsiveAssetPicture
                  className="hero-mini-picture"
                  imgClassName="hero-mini-picture-img"
                  alt=""
                  desktopSrc={siteAssets.categories.phaChe}
                  desktopFallbackSrc={siteAssetFallbacks.categories.phaChe}
                  imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
                />
              </div>
              <div className="hero-mini-card hero-mini-card-bottom">
                <ResponsiveAssetPicture
                  className="hero-mini-picture"
                  imgClassName="hero-mini-picture-img"
                  alt=""
                  desktopSrc={siteAssets.categories.miCay}
                  desktopFallbackSrc={siteAssetFallbacks.categories.miCay}
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
