import type { Announcement } from "@/lib/contracts";

type AnnouncementSeed = Omit<Announcement, "readAt">;

export const MOCK_ANNOUNCEMENTS: AnnouncementSeed[] = [
  {
    id: "order-status-notice",
    kind: "order",
    title: "Theo dõi đơn hàng ngay trên ứng dụng",
    summary: "Trạng thái đơn sẽ xuất hiện theo từng bước từ lúc gửi đến khi giao xong.",
    body:
      "Mở mục Đơn hàng để xem tiến trình xử lý. Khi NPP Core được kết nối, các thay đổi trạng thái sẽ là nguồn dữ liệu chính thức và có thể đồng thời phát thông báo đẩy đến đúng tài khoản khách hàng.",
    publishedAt: "2026-08-07T01:00:00.000Z",
    featured: true,
    targetHref: "/orders",
  },
  {
    id: "push-ready",
    kind: "system",
    title: "Bật thông báo để không bỏ lỡ cập nhật",
    summary: "Nhận thông tin trạng thái đơn và chương trình mới trên thiết bị đang dùng.",
    body:
      "Bạn có thể bật hoặc tắt thông báo đẩy bất cứ lúc nào. Trên iPhone/iPad, web push cần mở ứng dụng từ biểu tượng đã thêm vào Màn hình chính.",
    publishedAt: "2026-08-07T00:30:00.000Z",
    featured: false,
    targetHref: "/account",
  },
  {
    id: "company-program-august",
    kind: "promotion",
    title: "Chương trình khách hàng tháng 8",
    summary: "Khu vực chương trình đã sẵn sàng để sau này nhận nội dung chính thức từ NPP Core.",
    body:
      "Hiện nội dung này là dữ liệu mẫu phục vụ UI. Khi kết nối Core, tiêu đề, nội dung, thời gian hiệu lực và đối tượng nhận sẽ được trả về từ Customer API thay vì nằm trong frontend.",
    publishedAt: "2026-08-06T09:00:00.000Z",
    featured: true,
    targetHref: "/products",
  },
  {
    id: "company-news-foundation",
    kind: "company",
    title: "Tin tức Hưng Phát trên ứng dụng đặt hàng",
    summary: "Tin công ty, sự kiện và hướng dẫn sẽ nằm chung trong trung tâm thông báo.",
    body:
      "Mỗi nội dung có trạng thái đã đọc/chưa đọc và có thể kèm đường dẫn vào sản phẩm, đơn hàng hoặc khu vực liên quan. Push chỉ là kênh nhắc; danh sách trong ứng dụng vẫn là nơi khách xem lại nội dung.",
    publishedAt: "2026-08-05T08:00:00.000Z",
    featured: false,
  },
];
