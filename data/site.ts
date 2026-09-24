import {
  Boxes,
  Flame,
  PackageCheck,
  Snowflake,
  ShieldCheck,
  Truck,
  Warehouse,
} from "lucide-react";
import { siteAssets } from "@/lib/site-assets";

export const navigation = [
  { label: "Trang chủ", href: "/" },
  { label: "Giới thiệu", href: "/gioi-thieu" },
  { label: "Ngành hàng", href: "/nganh-hang" },
  { label: "Nhãn hàng", href: "/nhan-hang" },
  { label: "Năng lực", href: "/nang-luc" },
  { label: "Cẩm nang", href: "/cam-nang" },
  { label: "Tuyển dụng", href: "/tuyen-dung" },
];

export const stats = [
  { value: "Pha chế", label: "Nguyên liệu & topping" },
  { value: "Thực phẩm", label: "Đông lạnh & gia vị" },
  { value: "Bao bì", label: "Vật tư vận hành" },
  { value: "Giao nhận", label: "Phối hợp theo nhu cầu" },
];

export const trustItems = [
  {
    title: "Ngành hàng F&B",
    description: "Các nhóm nguyên liệu, thực phẩm, bao bì và gia vị - sốt.",
    icon: ShieldCheck,
  },
  {
    title: "Danh mục theo nhóm",
    description: "Thông tin được sắp xếp theo ngành hàng và nhóm hàng.",
    icon: PackageCheck,
  },
  {
    title: "Liên hệ Công Ty",
    description: "Tiếp nhận nội dung và chuyển đến bộ phận phù hợp.",
    icon: Truck,
  },
  {
    title: "Phối hợp giao nhận",
    description: "Trao đổi phương án giao nhận theo từng nhu cầu cụ thể.",
    icon: Warehouse,
  },
];

export const categories = [
  {
    slug: "nguyen-lieu-pha-che",
    orderingCategoryId: "milk-tea",
    title: "Trà sữa & pha chế",
    description: "Siro, trà, bột, topping và nguyên liệu phục vụ trà sữa, cà phê, đá xay và đồ uống.",
    image: siteAssets.categories.phaChe,
    fallback: "/images/category-food.svg",
    icon: Boxes,
  },
  {
    slug: "nguyen-lieu-mi-cay",
    orderingCategoryId: "spicy-noodle",
    title: "Mì cay",
    description: "Mì, sốt, topping và nguyên liệu phục vụ quán mì cay, nhà hàng và mô hình đồ ăn.",
    image: siteAssets.categories.miCay,
    fallback: "/images/category-food.svg",
    icon: Flame,
  },
  {
    slug: "hang-dong-lanh",
    orderingCategoryId: "frozen",
    title: "Đông lạnh",
    description: "Thực phẩm đông lạnh phục vụ cửa hàng, quán ăn, nhà hàng và đại lý.",
    image: siteAssets.categories.dongLanh,
    fallback: "/images/category-food.svg",
    icon: Snowflake,
  },
  {
    slug: "an-vat",
    orderingCategoryId: "snacks",
    title: "Ăn vặt",
    description: "Nhóm bánh tráng, đồ ăn vặt và nguyên liệu đi kèm cho quán, cửa hàng và đại lý.",
    image: siteAssets.categories.food,
    fallback: "/images/category-food.svg",
    icon: PackageCheck,
  },
  {
    slug: "bao-bi",
    orderingCategoryId: "packaging",
    title: "Bao bì",
    description: "Ly, nắp, hộp, túi và vật tư bao bì phục vụ vận hành F&B.",
    image: siteAssets.categories.packaging,
    fallback: "/images/category-packaging.svg",
    icon: Boxes,
  },
  {
    slug: "gia-vi-sot",
    orderingCategoryId: "sauce-seasoning",
    title: "Gia vị & sốt",
    description: "Gia vị, sốt và nguyên liệu nêm nếm phục vụ bếp, quán ăn và bán lại.",
    image: siteAssets.categories.food,
    fallback: "/images/category-food.svg",
    icon: Flame,
  },
];
