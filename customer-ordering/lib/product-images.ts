import uploadedProductImageSkus from "@/data/r2-product-image-skus.json";
import type { Product } from "@/lib/contracts";

const R2_PRODUCT_IMAGE_BASE = "https://pub-7d2987fab97d4e3ebb2021a823973862.r2.dev/app-customer/products";
const R2_PRODUCT_IMAGE_SKUS = new Set(uploadedProductImageSkus.map((sku) => sku.trim().toUpperCase()));

export function productImageSku(product: Pick<Product, "familySku">): string | null {
  const familySku = product.familySku.trim().toUpperCase();
  return R2_PRODUCT_IMAGE_SKUS.has(familySku) ? familySku : null;
}

export function productImageUrl(product: Pick<Product, "familySku">): string | null {
  const imageSku = productImageSku(product);
  return imageSku ? `${R2_PRODUCT_IMAGE_BASE}/${encodeURIComponent(imageSku)}.webp` : null;
}
