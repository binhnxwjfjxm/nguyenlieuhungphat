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
  { label: "Cẩm nang", href: "/nganh-hang" },
  { label: "Sản phẩm", href: "/san-pham" },
  { label: "Liên hệ", href: "/lien-he" },
  { label: "Tuyển dụng", href: "/tuyen-dung" },
];

export const stats = [
  { value: "2016", label: "Thành lập từ năm" },
  { value: "6", label: "Ngành hàng ưu tiên" },
  { value: "B2B", label: "Phục vụ đối tác kinh doanh" },
  { value: "Linh hoạt", label: "Báo giá nhanh" },
];

export const trustItems = [
  {
    title: "Danh mục đúng nhu cầu",
    description: "Tập trung vào nhóm hàng F&B, hàng đông lạnh, ăn vặt, bao bì và gia vị - sốt.",
    icon: ShieldCheck,
  },
  {
    title: "Nguồn hàng ổn định",
    description: "Hỗ trợ khách hàng chủ động kế hoạch nhập hàng và kinh doanh.",
    icon: PackageCheck,
  },
  {
    title: "Báo giá nhanh chóng",
    description: "Tiếp nhận nhu cầu, số lượng và khu vực để tư vấn nhanh.",
    icon: Truck,
  },
  {
    title: "Giao hàng linh hoạt",
    description: "Phối hợp phương án giao nhận theo từng đơn hàng thực tế.",
    icon: Warehouse,
  },
];

export const categories = [
  {
    slug: "nguyen-lieu-pha-che",
    orderingCategoryId: "milk-tea",
    title: "Trà sữa & pha chế",
    count: "Đang cập nhật",
    description: "Siro, trà, bột, topping và nguyên liệu phục vụ trà sữa, cà phê, đá xay và đồ uống.",
    image: siteAssets.categories.phaChe,
    fallback: "/images/category-food.svg",
    icon: Boxes,
  },
  {
    slug: "nguyen-lieu-mi-cay",
    orderingCategoryId: "spicy-noodle",
    title: "Mì cay",
    count: "Đang cập nhật",
    description: "Mì, sốt, topping và nguyên liệu phục vụ quán mì cay, nhà hàng và mô hình đồ ăn.",
    image: siteAssets.categories.miCay,
    fallback: "/images/category-food.svg",
    icon: Flame,
  },
  {
    slug: "hang-dong-lanh",
    orderingCategoryId: "frozen",
    title: "Đông lạnh",
    count: "Đang cập nhật",
    description: "Thực phẩm đông lạnh phục vụ cửa hàng, quán ăn, nhà hàng và đại lý.",
    image: siteAssets.categories.dongLanh,
    fallback: "/images/category-food.svg",
    icon: Snowflake,
  },
  {
    slug: "an-vat",
    orderingCategoryId: "snacks",
    title: "Ăn vặt",
    count: "Đang cập nhật",
    description: "Nhóm bánh tráng, đồ ăn vặt và nguyên liệu đi kèm cho quán, cửa hàng và đại lý.",
    image: siteAssets.categories.food,
    fallback: "/images/category-food.svg",
    icon: PackageCheck,
  },
  {
    slug: "bao-bi",
    orderingCategoryId: "packaging",
    title: "Bao bì",
    count: "Đang cập nhật",
    description: "Ly, nắp, hộp, túi và vật tư bao bì phục vụ vận hành F&B.",
    image: siteAssets.categories.packaging,
    fallback: "/images/category-packaging.svg",
    icon: Boxes,
  },
  {
    slug: "gia-vi-sot",
    orderingCategoryId: "sauce-seasoning",
    title: "Gia vị & sốt",
    count: "Đang cập nhật",
    description: "Gia vị, sốt và nguyên liệu nêm nếm phục vụ bếp, quán ăn và bán lại.",
    image: siteAssets.categories.food,
    fallback: "/images/category-food.svg",
    icon: Flame,
  },
];
