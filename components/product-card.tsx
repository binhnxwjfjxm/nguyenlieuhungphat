"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import type { KeyboardEvent } from "react";
import type { Product } from "@/data/products";
import { HapticLink } from "./haptic-link";
import familyStyles from "./product-family.module.css";

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
  const reduceMotion = useReducedMotion();
  const clickable = Boolean(onOpen);
  const visibleVariantLabels = [...new Set(variantLabels.filter(Boolean))].slice(0, 3);

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
      className={`product-card presentation-product-card${compact ? " product-card-compact" : ""}${clickable ? " is-clickable" : ""}`}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `Xem ${displayName} và các lựa chọn` : undefined}
      aria-haspopup={clickable ? "dialog" : undefined}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      whileTap={reduceMotion ? undefined : { scale: 0.992 }}
      transition={{ duration: 0.18 }}
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

      <div className="product-card-body">
        <div className="product-card-topline">
          <p className="product-origin">{product.origin}</p>
          {product.brand ? <span className="product-brand">{product.brand}</span> : null}
        </div>
        <h3>
          {clickable ? <span className="product-card-title">{displayName}</span> : <HapticLink href={`/san-pham/${product.slug}`}>{displayName}</HapticLink>}
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

        <div className="product-card-actions presentation-card-actions">
          {clickable ? (
            <span className="product-card-hint">{variantCount > 1 ? "Xem các lựa chọn" : "Xem nhanh"}</span>
          ) : (
            <HapticLink href={`/san-pham/${product.slug}`} className="product-link">
              Xem chi tiết <ArrowUpRight size={15} />
            </HapticLink>
          )}
        </div>
      </div>
    </motion.article>
  );
}
