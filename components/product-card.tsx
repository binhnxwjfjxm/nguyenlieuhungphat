"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight, Heart } from "lucide-react";
import { useState } from "react";

export type ProductCardData = {
  name: string;
  englishName: string;
  category: string;
  image: string;
};

function vibrate() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(12);
  }
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const [saved, setSaved] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className="product-card"
      whileHover={reduceMotion ? undefined : { y: -6 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.2 }}
      onPointerDown={vibrate}
    >
      <div className="product-image-wrap">
        <Image src={product.image} alt={product.name} fill sizes="(max-width: 720px) 50vw, 25vw" />
        <span className="product-tag">{product.category}</span>
        <button
          className={`save-button${saved ? " is-saved" : ""}`}
          type="button"
          aria-label={saved ? "Bỏ lưu sản phẩm" : "Lưu sản phẩm"}
          aria-pressed={saved}
          onClick={() => setSaved((value) => !value)}
        >
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="product-card-body">
        <h3>{product.name}</h3>
        <p>{product.englishName}</p>
        <a href="#bao-gia" className="product-link">
          Xem chi tiết <ArrowUpRight size={16} />
        </a>
      </div>
    </motion.article>
  );
}
