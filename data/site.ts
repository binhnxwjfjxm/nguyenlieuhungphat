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
  { label: "Tin tức sự kiện", href: "/nganh-hang" },
  { label: "Sản phẩm", href: "/san-pham" },
  { label: "Liên hệ", href: "/lien-he" },
  { label: "Tuyển dụng", href: "/tuyen-dung" },
];

export const stats = [
  { value: "2016", label: "Thành lập từ năm" },
  { value: "3", label: "Nhóm ngành hàng chính" },
  { value: "B2B", label: "Phục vụ đối tác kinh doanh" },
  { value: "Linh hoạt", label: "Báo giá nhanh" },
];

export const trustItems = [
  {
    title: "Danh mục đúng nhu cầu",
    description: "Tập trung vào nguyên liệu pha chế, mì cay và hàng đông lạnh.",
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
    title: "Nguyên liệu pha chế",
    count: "Đang cập nhật",
    description: "Nhóm nguyên liệu phục vụ trà sữa, cà phê, đá xay và các món đồ uống.",
    image: siteAssets.categories.phaChe,
    icon: Boxes,
  },
  {
    slug: "nguyen-lieu-mi-cay",
    title: "Nguyên liệu mì cay",
    count: "Đang cập nhật",
    description: "Nhóm nguyên liệu và thành phần phục vụ quán mì cay, nhà hàng và mô hình đồ ăn.",
    image: siteAssets.categories.miCay,
    icon: Flame,
  },
  {
    slug: "hang-dong-lanh",
    title: "Hàng đông lạnh",
    count: "Đang cập nhật",
    description: "Nhóm thực phẩm đông lạnh phục vụ cửa hàng, quán ăn, nhà hàng và đại lý.",
    image: siteAssets.categories.dongLanh,
    icon: Snowflake,
  },
];
