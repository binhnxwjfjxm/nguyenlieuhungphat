import { getSiteAssetUrl } from "@/lib/site-assets";
import { productPlans } from "./products.generated";

export type Product = {
  slug: string;
  name: string;
  englishName: string;
  brand?: string;
  category: string;
  categorySlug: string;
  image: string;
  shortDescription: string;
  description: string;
  origin: string;
  packaging: string;
  applications: string[];
  features: string[];
  specifications: { label: string; value: string }[];
  featured: boolean;
};

export type ProductFamily = {
  key: string;
  name: string;
  brand?: string;
  category: string;
  categorySlug: string;
  origin: string;
  primary: Product;
  variants: Product[];
  featured: boolean;
};

export type ProductCategory = {
  slug: string;
  title: string;
  description: string;
};

export const productCategories: ProductCategory[] = [
  {
    slug: "nguyen-lieu-pha-che",
    title: "Trà sữa & pha chế",
    description: "Siro, trà, bột, topping và nguyên liệu cho trà sữa, cà phê, đá xay và đồ uống.",
  },
  {
    slug: "nguyen-lieu-mi-cay",
    title: "Mì cay",
    description: "Mì, sốt, topping và nguyên liệu phục vụ quán mì cay, nhà hàng và mô hình đồ ăn.",
  },
  {
    slug: "hang-dong-lanh",
    title: "Đông lạnh",
    description: "Thực phẩm đông lạnh phục vụ cửa hàng, quán ăn, nhà hàng và đại lý.",
  },
  {
    slug: "an-vat",
    title: "Ăn vặt",
    description: "Bánh tráng, đồ ăn vặt và nguyên liệu đi kèm cho quán, cửa hàng và đại lý.",
  },
  {
    slug: "bao-bi",
    title: "Bao bì",
    description: "Ly, nắp, hộp, túi và vật tư bao bì phục vụ vận hành F&B.",
  },
  {
    slug: "gia-vi-sot",
    title: "Gia vị & sốt",
    description: "Gia vị, sốt và nguyên liệu nêm nếm phục vụ bếp, quán ăn và bán lại.",
  },
];

function normalizeText(value: string) {
  return value.normalize("NFC").replace(/\s+/g, " ").trim();
}

function normalizeLookup(value: string) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
}

function getCategorySlug(industryCode: string, industryName: string) {
  const code = normalizeText(industryCode).toUpperCase();
  const name = normalizeLookup(industryName);

  if (code === "TS" || name.includes("tra sua") || name.includes("pha che")) return "nguyen-lieu-pha-che";
  if (code === "MC" || name.includes("mi cay")) return "nguyen-lieu-mi-cay";
  if (code === "DL" || name.includes("dong lanh")) return "hang-dong-lanh";
  if (code === "AV" || code === "BT" || name.includes("an vat") || name.includes("banh trang")) return "an-vat";
  if (code === "BB" || name.includes("bao bi")) return "bao-bi";
  if (code === "GS" || name.includes("gia vi") || name.includes("sot")) return "gia-vi-sot";
  return "";
}

function getIndustryName(industryCode: string, industryName: string) {
  const normalized = normalizeText(industryName);
  if (normalized) return normalized;

  const code = normalizeText(industryCode).toUpperCase();
  if (code === "TS") return "Trà sữa & pha chế";
  if (code === "MC") return "Mì cay";
  if (code === "DL") return "Đông lạnh";
  if (code === "AV" || code === "BT") return "Ăn vặt";
  if (code === "BB") return "Bao bì";
  if (code === "GS") return "Gia vị & sốt";
  return "";
}

function buildProduct(productPlan: (typeof productPlans)[number]): Product | null {
  const categorySlug = getCategorySlug(productPlan.industry_code, productPlan.industry_name);
  if (!categorySlug) return null;

  const productId = normalizeText(productPlan.new_product_id);
  const productName = normalizeText(productPlan.old_name);
  const brand = normalizeText(productPlan.old_brand);
  const industryName = getIndustryName(productPlan.industry_code, productPlan.industry_name);
  const groupName = normalizeText(productPlan.group_name);
  const imagePath = normalizeText(productPlan.new_r2_object_path);

  return {
    slug: productId.toLowerCase(),
    name: productName,
    englishName: `Mã ${productId}`,
    brand: brand || undefined,
    category: groupName,
    categorySlug,
    image: getSiteAssetUrl(imagePath, "/images/hero-materials.svg"),
    shortDescription: `Phù hợp nhập sỉ cho quán, cửa hàng và đại lý trong nhóm ${groupName.toLowerCase()}.`,
    description: `Dòng ${groupName.toLowerCase()} thuộc ngành ${industryName.toLowerCase()}, tối ưu cho mô hình mua sỉ, phân phối và bán lại.`,
    origin: industryName,
    packaging: groupName,
    applications: [industryName, groupName, "Mua sỉ"],
    features: [
      "Phù hợp quán, cửa hàng và đại lý",
      "Báo giá theo nhu cầu",
      "Hỗ trợ đặt hàng số lượng lớn",
    ],
    specifications: [
      { label: "Ngành hàng", value: industryName },
      { label: "Nhóm hàng", value: groupName },
      { label: "Thương hiệu", value: brand || "Hưng Phát" },
    ],
    featured: productPlan.stt <= 12,
  };
}

function hasFamilyBrand(product: Product) {
  const brand = normalizeLookup(product.brand ?? "");
  return Boolean(brand && brand !== "hung phat");
}

export function productFamilyKey(product: Product) {
  if (!hasFamilyBrand(product)) return `product:${product.slug}`;
  return ["family", product.categorySlug, normalizeLookup(product.category), normalizeLookup(product.brand ?? "")].join(":");
}

export function productFamilyName(product: Product) {
  if (!hasFamilyBrand(product)) return product.name;
  return `${product.category} ${product.brand}`.replace(/\s+/g, " ").trim();
}

function choosePrimaryProduct(variants: Product[]) {
  return [...variants].sort((left, right) => {
    const leftFamily = normalizeLookup(productFamilyName(left));
    const rightFamily = normalizeLookup(productFamilyName(right));
    const leftExact = normalizeLookup(left.name) === leftFamily ? 1 : 0;
    const rightExact = normalizeLookup(right.name) === rightFamily ? 1 : 0;
    if (leftExact !== rightExact) return rightExact - leftExact;
    if (left.featured !== right.featured) return Number(right.featured) - Number(left.featured);
    return left.name.length - right.name.length || left.name.localeCompare(right.name, "vi");
  })[0];
}

export function productVariantLabel(product: Product, family?: ProductFamily) {
  if (!family || family.variants.length <= 1) return product.name;
  const parts = [product.category, product.brand ?? ""].filter(Boolean);
  let label = product.name;
  for (const part of parts) {
    const escaped = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    label = label.replace(new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "iu"), " ");
  }
  label = label.replace(/\s+/g, " ").replace(/^[\s,\-–—/]+|[\s,\-–—/]+$/g, "").trim();
  return label || product.packaging || product.englishName;
}

export function groupProductFamilies(source: Product[]) {
  const groups = new Map<string, Product[]>();
  for (const product of source) {
    const key = productFamilyKey(product);
    groups.set(key, [...(groups.get(key) ?? []), product]);
  }

  return [...groups.entries()]
    .map(([key, variants]): ProductFamily => {
      const sortedVariants = [...variants].sort((left, right) => left.name.localeCompare(right.name, "vi"));
      const primary = choosePrimaryProduct(sortedVariants);
      return {
        key,
        name: productFamilyName(primary),
        brand: primary.brand,
        category: primary.category,
        categorySlug: primary.categorySlug,
        origin: primary.origin,
        primary,
        variants: sortedVariants,
        featured: sortedVariants.some((variant) => variant.featured),
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name, "vi"));
}

export const products = productPlans.map(buildProduct).filter((product): product is Product => Boolean(product));
export const productFamilies = groupProductFamilies(products);
export const featuredProducts = products.filter((product) => product.featured);
export const featuredProductFamilies = productFamilies.filter((family) => family.featured);

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductFamily(product: Product) {
  return productFamilies.find((family) => family.key === productFamilyKey(product));
}

export function getRelatedProducts(product: Product, limit = 4) {
  const familyKey = productFamilyKey(product);
  return products
    .filter((item) => item.categorySlug === product.categorySlug && productFamilyKey(item) !== familyKey)
    .slice(0, limit);
}

export const productOrigins = Array.from(new Set(products.map((product) => product.origin))).sort();
export const productApplications = Array.from(new Set(products.flatMap((product) => product.applications))).sort();