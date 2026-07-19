import {
  Beaker,
  Boxes,
  Factory,
  Leaf,
  PackageCheck,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import { siteAssets } from "@/lib/site-assets";

export const navigation = [
  { label: "Trang chủ", href: "/#trang-chu" },
  { label: "Giới thiệu", href: "/#gioi-thieu" },
  { label: "Sản phẩm", href: "/san-pham" },
  { label: "Lĩnh vực", href: "/#danh-muc" },
  { label: "Tin tức", href: "/#tin-tuc" },
  { label: "Liên hệ", href: "/#lien-he" },
];
export const stats = [
  { value: "2016", label: "Thành lập từ năm" },
  { value: "500+", label: "Sản phẩm đa dạng" },
  { value: "1200+", label: "Khách hàng tin tưởng" },
  { value: "20+", label: "Khu vực phân phối" },
];

export const trustItems = [
  {
    title: "Chất lượng hàng đầu",
    description: "Nguồn hàng được lựa chọn và kiểm soát nghiêm ngặt.",
    icon: ShieldCheck,
  },
  {
    title: "Nguồn hàng ổn định",
    description: "Đáp ứng nhu cầu đều đặn cho hoạt động sản xuất.",
    icon: PackageCheck,
  },
  {
    title: "Giao hàng linh hoạt",
    description: "Tối ưu lộ trình và thời gian theo từng đơn hàng.",
    icon: Truck,
  },
  {
    title: "Hỗ trợ tận tâm",
    description: "Đồng hành từ tư vấn nguyên liệu đến sau giao hàng.",
    icon: Users,
  },
];

export const categories = [
  {
    slug: "nguyen-lieu-cong-nghiep",
    title: "Nguyên liệu công nghiệp",
    count: "120+ sản phẩm",
    description: "Hạt nhựa, khoáng chất và nguyên liệu nền.",
    image: siteAssets.categories.industrial,
    icon: Factory,
  },
  {
    slug: "hoa-chat-phu-gia",
    title: "Hóa chất & phụ gia",
    count: "80+ sản phẩm",
    description: "Giải pháp hỗ trợ tối ưu quy trình sản xuất.",
    image: siteAssets.categories.chemical,
    icon: Beaker,
  },
  {
    slug: "nguyen-lieu-thuc-pham",
    title: "Nguyên liệu thực phẩm",
    count: "150+ sản phẩm",
    description: "Nguyên liệu được chọn theo nhu cầu ứng dụng.",
    image: siteAssets.categories.food,
    icon: Leaf,
  },
  {
    slug: "vat-tu-bao-bi",
    title: "Vật tư & bao bì",
    count: "60+ sản phẩm",
    description: "Giải pháp đóng gói và lưu thông hàng hóa.",
    image: siteAssets.categories.packaging,
    icon: Boxes,
  },
];
