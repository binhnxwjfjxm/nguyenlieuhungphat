import Image from "next/image";
import { PackageOpen } from "lucide-react";
import type { Product } from "@/lib/contracts";
import { productImageUrl } from "@/lib/product-images";

export function ProductVisual({ product, compact = false }: Readonly<{ product: Product; compact?: boolean }>) {
  const imageUrl = productImageUrl(product);
  const className = `catalog-product-visual tone-${product.visualTone}${compact ? " is-compact" : ""}${imageUrl ? " has-product-image" : ""}`;
  const fallbackLabel = product.brand?.trim() || product.productType?.trim() || "Sản phẩm";

  return (
    <div aria-label={`Hình sản phẩm ${product.name}`} className={className} role="img">
      {imageUrl ? (
        <Image
          alt=""
          aria-hidden
          className="catalog-product-image"
          fill
          sizes={compact ? "(max-width: 520px) 42vw, 180px" : "(max-width: 520px) 50vw, 320px"}
          src={imageUrl}
        />
      ) : (
        <span className="catalog-product-pack">
          <PackageOpen aria-hidden="true" size={compact ? 30 : 42} strokeWidth={1.45} />
          <small>{fallbackLabel}</small>
        </span>
      )}
      <span className="catalog-product-shine" />
    </div>
  );
}
