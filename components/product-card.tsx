"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight, Heart, MapPin } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/data/products";
import { HapticLink } from "./haptic-link";
import { QuoteButton } from "./quote-trigger";

function vibrate() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(12);
  }
}

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const [saved, setSaved] = useState(false);
  const reduceMotion = useReducedMotion();

  function toggleSaved() {
    const savedProducts = JSON.parse(localStorage.getItem("hungphat-saved-products") ?? "[]") as string[];
    const nextSaved = savedProducts.includes(product.slug)
      ? savedProducts.filter((slug) => slug !== product.slug)
      : [...savedProducts, product.slug];

    localStorage.setItem("hungphat-saved-products", JSON.stringify(nextSaved));
    setSaved(nextSaved.includes(product.slug));
    vibrate();
  }

  return (
    <motion.article
      className={`product-card${compact ? " product-card-compact" : ""}`}
      whileHover={reduceMotion ? undefined : { y: -6 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.2 }}
    >
      <HapticLink className="product-image-wrap" href={`/san-pham/${product.slug}`}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 720px) 50vw, (max-width: 1080px) 33vw, 25vw"
        />
        <span className="product-tag">{product.category}</span>
      </HapticLink>

      <button
        className={`save-button${saved ? " is-saved" : ""}`}
        type="button"
        aria-label={saved ? "Bỏ lưu sản phẩm" : "Lưu sản phẩm"}
        aria-pressed={saved}
        onClick={toggleSaved}
      >
        <Heart size={18} fill={saved ? "currentColor" : "none"} />
      </button>

      <div className="product-card-body">
        <p className="product-origin">
          <MapPin size={13} /> {product.origin}
        </p>
        <h3>
          <HapticLink href={`/san-pham/${product.slug}`}>{product.name}</HapticLink>
        </h3>
        <p className="product-english-name">{product.englishName}</p>
        {!compact ? <p className="product-summary">{product.shortDescription}</p> : null}

        <div className="product-card-actions">
          <HapticLink href={`/san-pham/${product.slug}`} className="product-link">
            Xem chi tiết <ArrowUpRight size={16} />
          </HapticLink>
          <QuoteButton
            className="product-quote-button"
            seed={{ product: product.name, source: "product-card", pathname: `/san-pham/${product.slug}` }}
          >
            Nhận báo giá
          </QuoteButton>
        </div>
      </div>
    </motion.article>
  );
}
