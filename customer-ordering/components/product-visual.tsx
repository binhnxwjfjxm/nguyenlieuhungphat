import { PackageOpen } from "lucide-react";
import type { Product } from "@/lib/contracts";

export function ProductVisual({
  product,
  compact = false,
}: Readonly<{ product: Product; compact?: boolean }>) {
  return (
    <div
      aria-label={`Minh họa bao bì ${product.name}`}
      className={`catalog-product-visual tone-${product.visualTone}${compact ? " is-compact" : ""}`}
      role="img"
    >
      <span className="catalog-product-pack">
        <PackageOpen aria-hidden="true" size={compact ? 30 : 42} strokeWidth={1.45} />
        <small>{product.code}</small>
      </span>
      <span className="catalog-product-shine" />
    </div>
  );
}
