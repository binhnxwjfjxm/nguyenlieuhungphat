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

export const products: Product[] = [];

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
