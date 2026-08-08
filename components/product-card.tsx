"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Heart, MapPin } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import type { Product } from "@/data/products";
import { HapticLink } from "./haptic-link";
import familyStyles from "./product-family.module.css";
import { QuoteButton } from "./quote-trigger";

function vibrate() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(12);
  }
}

type ProductCardProps = {
  product: Product;
  compact?: boolean;
  onOpen?: (product: Product) => void;
  displayName?: string;
  variantLabels?: string[];
  variantCount?: number;
};

export function ProductCard({
  product,
  compact = false,
  onOpen,
  displayName = product.name,
  variantLabels = [],
  variantCount = 1,
}: ProductCardProps) {
  const [saved, setSaved] = useState(false);
  const reduceMotion = useReducedMotion();
  const clickable = Boolean(onOpen);
  const visibleVariantLabels = [...new Set(variantLabels.filter(Boolean))].slice(0, 3);

  function toggleSaved(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    const savedProducts = JSON.parse(localStorage.getItem("hungphat-saved-products") ?? "[]") as string[];
    const nextSaved = savedProducts.includes(product.slug)
      ? savedProducts.filter((slug) => slug !== product.slug)
      : [...savedProducts, product.slug];

    localStorage.setItem("hungphat-saved-products", JSON.stringify(nextSaved));
    setSaved(nextSaved.includes(product.slug));
    vibrate();
  }

  function handleOpen() {
    onOpen?.(product);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpen();
    }
  }

  return (
    <motion.article
      className={`product-card${compact ? " product-card-compact" : ""}${clickable ? " is-clickable" : ""}`}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `Xem ${displayName} và các lựa chọn` : undefined}
      whileHover={reduceMotion ? undefined : { y: -6 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.2 }}
      onClick={clickable ? handleOpen : undefined}
      onKeyDown={clickable ? handleKeyDown : undefined}
    >
      {clickable ? (
        <div className="product-image-wrap">
          <Image
            src={product.image}
            alt={displayName}
            fill
            sizes="(max-width: 720px) 50vw, (max-width: 1080px) 33vw, 25vw"
            style={{ objectFit: compact ? "contain" : "cover", objectPosition: "center center" }}
          />
          <span className="product-tag">{product.category}</span>
        </div>
      ) : (
        <HapticLink className="product-image-wrap" href={`/san-pham/${product.slug}`}>
          <Image
            src={product.image}
            alt={displayName}
            fill
            sizes="(max-width: 720px) 50vw, (max-width: 1080px) 33vw, 25vw"
            style={{ objectFit: compact ? "contain" : "cover", objectPosition: "center center" }}
          />
          <span className="product-tag">{product.category}</span>
        </HapticLink>
      )}

      {compact ? null : (
        <button
          className={`save-button${saved ? " is-saved" : ""}`}
          type="button"
          aria-label={saved ? "Bỏ lưu sản phẩm" : "Lưu sản phẩm"}
          aria-pressed={saved}
          onClick={toggleSaved}
        >
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      )}

      <div className="product-card-body">
        <div className="product-card-topline">
          <p className="product-origin">
            <MapPin size={13} /> {product.origin}
          </p>
          {product.brand ? <span className="product-brand">{product.brand}</span> : null}
        </div>
        <h3>
          {clickable ? (
            <span className="product-card-title">{displayName}</span>
          ) : (
            <HapticLink href={`/san-pham/${product.slug}`}>{displayName}</HapticLink>
          )}
        </h3>
        <p className={`product-summary${compact ? " product-summary-compact" : ""}`}>{product.shortDescription}</p>

        {variantCount > 1 ? (
          <div className={familyStyles.variantPreview} aria-label={`${variantCount} lựa chọn`}>
            <strong>{variantCount} lựa chọn</strong>
            {visibleVariantLabels.length ? (
              <div className={familyStyles.variantChips}>
                {visibleVariantLabels.map((label) => <span key={label}>{label}</span>)}
                {variantCount > visibleVariantLabels.length ? <span>+{variantCount - visibleVariantLabels.length}</span> : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="product-card-metadata">
          <span>{product.origin}</span>
          <span>{product.category}</span>
        </div>

        <div className="product-card-actions">
          {clickable ? null : (
            <HapticLink href={`/san-pham/${product.slug}`} className="product-link">
              {variantCount > 1 ? "Xem các lựa chọn" : "Xem chi tiết"} <ArrowUpRight size={16} />
            </HapticLink>
          )}
          <QuoteButton
            className="product-quote-button"
            seed={{ product: displayName, source: "product-card", pathname: `/san-pham/${product.slug}` }}
            onClick={(event) => event.stopPropagation()}
          >
            Nhận báo giá
          </QuoteButton>
        </div>
      </div>
    </motion.article>
  );
}