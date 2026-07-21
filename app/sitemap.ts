import type { MetadataRoute } from "next";
import { categories } from "@/data/site";
import { products } from "@/data/products";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/gioi-thieu`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/nganh-hang`, changeFrequency: "weekly", priority: 0.9 },
    ...categories.map((category) => ({
      url: `${baseUrl}/nganh-hang/${category.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    { url: `${baseUrl}/san-pham`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/lien-he`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/tuyen-dung`, changeFrequency: "monthly", priority: 0.75 },
    ...products.map((product) => ({
      url: `${baseUrl}/san-pham/${product.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
