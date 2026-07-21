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

export type ProductCategory = {
  slug: string;
  title: string;
  description: string;
};

export const productCategories: ProductCategory[] = [
  {
    slug: "nguyen-lieu-pha-che",
    title: "Nguyên liệu pha chế",
    description: "Nhóm nguyên liệu cho trà sữa, cà phê, đá xay và các món đồ uống.",
  },
  {
    slug: "nguyen-lieu-mi-cay",
    title: "Nguyên liệu mì cay",
    description: "Nhóm nguyên liệu và thành phần phục vụ quán mì cay, nhà hàng và mô hình đồ ăn.",
  },
  {
    slug: "hang-dong-lanh",
    title: "Hàng đông lạnh",
    description: "Nhóm thực phẩm đông lạnh phục vụ cửa hàng, quán ăn, nhà hàng và đại lý.",
  },
];

function normalizeText(value: string) {
  return value.normalize("NFC").replace(/\s+/g, " ").trim();
}

function getCategorySlug(industryCode: string) {
  if (industryCode === "TS") return "nguyen-lieu-pha-che";
  if (industryCode === "MC") return "nguyen-lieu-mi-cay";
  if (industryCode === "DL") return "hang-dong-lanh";
  return "";
}

function getIndustryName(industryCode: string, industryName: string) {
  const normalized = normalizeText(industryName);
  if (industryCode === "TS") return normalized || "Trà sữa và pha chế";
  if (industryCode === "MC") return normalized || "Nguyên liệu mì cay";
  if (industryCode === "DL") return normalized || "Đông lạnh";
  return "";
}

function buildProduct(productPlan: (typeof productPlans)[number]): Product | null {
  const categorySlug = getCategorySlug(productPlan.industry_code);
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

export const products = productPlans.map(buildProduct).filter((product): product is Product => Boolean(product));

export const featuredProducts = products.filter((product) => product.featured);

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 4) {
  return products
    .filter((item) => item.slug !== product.slug && item.categorySlug === product.categorySlug)
    .slice(0, limit);
}

export const productOrigins = Array.from(new Set(products.map((product) => product.origin))).sort();
export const productApplications = Array.from(new Set(products.flatMap((product) => product.applications))).sort();
