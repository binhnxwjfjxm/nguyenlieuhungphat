import type { MetadataRoute } from "next";
import { products } from "@/data/products";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/san-pham`, changeFrequency: "weekly", priority: 0.9 },
    ...products.map((product) => ({
      url: `${baseUrl}/san-pham/${product.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
