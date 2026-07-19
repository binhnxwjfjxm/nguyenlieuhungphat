"use client";

import type { CSSProperties } from "react";
import { siteAssetFallbacks } from "@/lib/site-assets";

type ResponsiveAssetPictureProps = {
  alt: string;
  desktopSrc: string;
  desktopFallbackSrc: string;
  mobileSrc?: string;
  mobileFallbackSrc?: string;
  className?: string;
  imgClassName?: string;
  style?: CSSProperties;
  imgStyle?: CSSProperties;
  mobileMedia?: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
};

function getFallbackForSource(
  activeSrc: string,
  desktopSrc: string,
  desktopFallbackSrc: string,
  mobileSrc?: string,
  mobileFallbackSrc?: string,
) {
  if (mobileSrc && activeSrc === mobileSrc) {
    return mobileFallbackSrc ?? desktopFallbackSrc;
  }

  if (activeSrc === desktopSrc) {
    return desktopFallbackSrc;
  }

  return desktopFallbackSrc;
}

export function ResponsiveAssetPicture({
  alt,
  desktopSrc,
  desktopFallbackSrc,
  mobileSrc,
  mobileFallbackSrc,
  className,
  imgClassName,
  style,
  imgStyle,
  mobileMedia = "(max-width: 820px)",
  priority = false,
  loading,
}: ResponsiveAssetPictureProps) {
  return (
    <picture className={className} style={style}>
      {mobileSrc ? <source media={mobileMedia} srcSet={mobileSrc} /> : null}
      <source media="(min-width: 821px)" srcSet={desktopSrc} />
      <img
        alt={alt}
        className={imgClassName}
        loading={loading ?? (priority ? "eager" : "lazy")}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        referrerPolicy="no-referrer"
        src={desktopSrc}
        style={imgStyle}
        onError={(event) => {
          const target = event.currentTarget;
          if (target.dataset.fallbackApplied === "1") return;
          target.dataset.fallbackApplied = "1";
          target.src = getFallbackForSource(
            target.currentSrc || target.src,
            desktopSrc,
            desktopFallbackSrc ?? siteAssetFallbacks.hero.desktop,
            mobileSrc,
            mobileFallbackSrc ?? siteAssetFallbacks.hero.mobile,
          );
        }}
      />
    </picture>
  );
}
