import { getSiteAssetUrl } from "@/lib/site-assets";
import { productPlans } from "./products.generated";

export type Product = {
  slug: string;
  name: string;
  englishName: string;
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
    description: "Nhóm nguyên liệu phục vụ trà sữa, cà phê, đá xay và các món đồ uống.",
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
  if (industryCode === "DL") return "hang-dong-lanh";
  return "nguyen-lieu-pha-che";
}

function buildProduct(productPlan: (typeof productPlans)[number]): Product {
  const productId = normalizeText(productPlan.new_product_id);
  const productName = normalizeText(productPlan.old_name);
  const industryName = normalizeText(productPlan.industry_name);
  const groupName = normalizeText(productPlan.group_name);
  const planStatus = normalizeText(productPlan.plan_status);
  const imagePath = normalizeText(productPlan.new_r2_object_path);

  return {
    slug: productId.toLowerCase(),
    name: productName,
    englishName: `Mã ${productId}`,
    category: groupName,
    categorySlug: getCategorySlug(productPlan.industry_code),
    image: getSiteAssetUrl(imagePath, "/images/hero-materials.svg"),
    shortDescription: `Sản phẩm thật thuộc nhóm ${groupName} trong ngành ${industryName}.`,
    description: `Dữ liệu dựng từ plan CSV. Mã cũ ${normalizeText(productPlan.old_product_key)}. Ảnh mới ${normalizeText(productPlan.new_file_name)}. Trạng thái ${planStatus}.`,
    origin: industryName,
    packaging: groupName,
    applications: [industryName, planStatus === "LOCKED_FROM_EXCEL_BATCH_01" ? "Đã xác minh" : "Cần duyệt"],
    features: [
      `Mã sản phẩm: ${productId}`,
      `Mã ảnh: ${normalizeText(productPlan.new_image_key)}`,
      `Trạng thái: ${planStatus}`,
    ],
    specifications: [
      { label: "Mã cũ", value: normalizeText(productPlan.old_product_key) },
      { label: "Tên cũ", value: productName },
      { label: "Mã ảnh cũ", value: normalizeText(productPlan.old_image_key) },
      { label: "Mã ảnh mới", value: normalizeText(productPlan.new_image_key) },
      { label: "File ảnh mới", value: normalizeText(productPlan.new_file_name) },
      { label: "R2 object path", value: imagePath },
      { label: "Ngành hàng", value: industryName },
      { label: "Nhóm", value: groupName },
      { label: "Trạng thái", value: planStatus },
    ],
    featured: productPlan.stt <= 12,
  };
}

export const products = productPlans.map(buildProduct);

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
