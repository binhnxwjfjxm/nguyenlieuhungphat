type AssetEntry = {
  path: string;
  fallback: string;
};

function normalizeBaseUrl(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  return trimmed.replace(/\/+$/, "");
}

function normalizeAssetPath(value: string) {
  return value.replace(/^\/+/, "");
}

function buildAssetUrl(baseUrl: string, entry: AssetEntry) {
  if (baseUrl) {
    return `${baseUrl}/${normalizeAssetPath(entry.path)}`;
  }

  return entry.fallback;
}

export function getR2AssetBaseUrl() {
  return normalizeBaseUrl(
    process.env.NEXT_PUBLIC_R2_ASSET_URL ??
      process.env.R2_PUBLIC_URL ??
      process.env.R2_PUBLIC_BASE_URL ??
      process.env.CLOUDFLARE_R2_PUBLIC_URL,
  );
}

export function getSiteAssetUrl(path: string, fallback: string) {
  return buildAssetUrl(getR2AssetBaseUrl(), { path, fallback });
}

const asset = (path: string, fallback: string) => getSiteAssetUrl(path, fallback);

export const siteAssetFallbacks = {
  hero: {
    desktop: "/images/hero-materials.svg",
    mobile: "/images/hero-materials.svg",
  },
  categories: {
    industrial: "/images/category-industrial.svg",
    chemical: "/images/category-chemical.svg",
    food: "/images/category-food.svg",
    packaging: "/images/category-packaging.svg",
  },
  warehouse: {
    one: "/images/hero-materials.svg",
    two: "/images/hero-materials.svg",
    capability: "/images/hero-materials.svg",
  },
  quote: {
    desktop: "/images/hero-materials.svg",
    mobile: "/images/hero-materials.svg",
  },
  seo: {
    og: "/images/hero-materials.svg",
  },
} as const;

export const siteAssets = {
  hero: {
    desktop: asset("web-site/01-hero-desktop.webp", "/images/hero-materials.svg"),
    mobile: asset("web-site/02-hero-mobile.webp", "/images/hero-materials.svg"),
  },
  categories: {
    industrial: asset("web-site/03-category-industrial.webp", "/images/category-industrial.svg"),
    chemical: asset("web-site/04-category-chemical.webp", "/images/category-chemical.svg"),
    food: asset("web-site/05-category-food.webp", "/images/category-food.svg"),
    packaging: asset("web-site/06-category-packaging.webp", "/images/category-packaging.svg"),
  },
  warehouse: {
    one: asset("web-site/07-warehouse-01.webp", "/images/hero-materials.svg"),
    two: asset("web-site/08-warehouse-02.webp", "/images/hero-materials.svg"),
    capability: asset("web-site/09-company-capability.webp", "/images/hero-materials.svg"),
  },
  quote: {
    desktop: asset("web-site/10-quote-banner.webp", "/images/hero-materials.svg"),
    mobile: asset("web-site/11-quote-mobile.webp", "/images/hero-materials.svg"),
  },
  seo: {
    og: asset("web-site/12-og-hung-phat.webp", "/images/hero-materials.svg"),
  },
} as const;

