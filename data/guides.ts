import { siteAssets } from "@/lib/site-assets";

export const guideItems = [
  {
    badge: "Chọn nguyên liệu",
    title: "5 bước chọn nguyên liệu pha chế cho menu mới",
    summary:
      "Bắt đầu từ nhóm món chủ lực, mức giá bán và sản lượng dự kiến để chọn nguyên liệu vừa vị, dễ vận hành và phù hợp chi phí.",
    image: siteAssets.categories.phaChe,
    readingTime: "4 phút đọc",
    highlights: [
      "Chốt nhóm món bán chính trước khi mở rộng menu.",
      "Ưu tiên nguyên liệu dùng được cho nhiều công thức.",
      "Thử định lượng thực tế để tính đúng giá vốn mỗi ly.",
    ],
  },
  {
    badge: "Quản lý tồn kho",
    title: "Tính lượng nhập hàng để hạn chế tồn kho",
    summary:
      "Một cách đơn giản để ước lượng lượng hàng cần nhập theo số món bán mỗi ngày, định lượng sử dụng và chu kỳ giao hàng.",
    image: siteAssets.categories.miCay,
    readingTime: "3 phút đọc",
    highlights: [
      "Ghi nhận sản lượng bán trung bình theo tuần.",
      "Tách hàng bán nhanh, bán chậm và hàng dự phòng.",
      "Đặt ngưỡng nhập lại trước khi nguyên liệu chạm mức tối thiểu.",
    ],
  },
  {
    badge: "Bảo quản",
    title: "Bảo quản syrup, bột và topping sau khi mở",
    summary:
      "Giữ chất lượng nguyên liệu bằng cách ghi ngày mở, dùng dụng cụ sạch và sắp xếp theo nguyên tắc nhập trước dùng trước.",
    image: siteAssets.categories.food,
    readingTime: "3 phút đọc",
    highlights: [
      "Đậy kín và tuân thủ điều kiện bảo quản trên bao bì.",
      "Không dùng chung dụng cụ lấy nguyên liệu giữa các hũ.",
      "Kiểm tra mùi, màu và trạng thái trước mỗi ca bán.",
    ],
  },
  {
    badge: "Hàng đông lạnh",
    title: "Nhận và bảo quản hàng đông lạnh đúng cách",
    summary:
      "Kiểm tra nhanh bao bì, trạng thái sản phẩm và nhiệt độ bảo quản ngay khi nhận hàng để giảm rủi ro hao hụt.",
    image: siteAssets.categories.dongLanh,
    readingTime: "4 phút đọc",
    highlights: [
      "Đưa hàng vào tủ đông ngay sau khi kiểm tra.",
      "Chia khu vực theo nhóm sản phẩm và ngày nhập.",
      "Hạn chế rã đông rồi cấp đông lại.",
    ],
  },
] as const;
