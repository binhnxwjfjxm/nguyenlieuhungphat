import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { ZALO_PHONE_DISPLAY, ZALO_URL } from "@/lib/contact";
import { getAbsoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Chính sách bảo mật",
  description:
    "Chính sách bảo mật thông tin liên hệ, hội thoại hỗ trợ và hồ sơ tuyển dụng tại Hưng Phát.",
  alternates: { canonical: "/chinh-sach-bao-mat" },
  openGraph: {
    title: "Chính sách bảo mật | Hưng Phát",
    description: "Cách Hưng Phát tiếp nhận và sử dụng thông tin phục vụ liên hệ, hỗ trợ và tuyển dụng.",
    url: getAbsoluteUrl("/chinh-sach-bao-mat"),
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="container page-hero-inner">
          <div>
            <p className="eyebrow">QUYỀN RIÊNG TƯ</p>
            <h1 className="gradient-heading">Chính sách bảo mật</h1>
            <p>Thông tin được tiếp nhận để phản hồi liên hệ, hỗ trợ hội thoại hoặc xử lý hồ sơ tuyển dụng.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <article className="contact-card">
            <h2>1. Thông tin Hưng Phát tiếp nhận</h2>
            <p>
              Với biểu mẫu liên hệ, thông tin có thể gồm họ tên, số điện thoại, email, Công Ty/cửa hàng và nội dung người dùng chủ động gửi.
            </p>
            <p>
              Với hội thoại hỗ trợ trực tuyến, thông tin có thể gồm nội dung trao đổi, mã phiên, trang đang xem và số điện thoại nếu người dùng
              chủ động gửi trong tin nhắn.
            </p>
            <p>
              Với hồ sơ tuyển dụng, thông tin có thể gồm họ tên, thông tin liên hệ, vị trí ứng tuyển, kinh nghiệm, đường dẫn hồ sơ và
              tệp CV do ứng viên chủ động gửi.
            </p>

            <h2>2. Mục đích sử dụng</h2>
            <p>
              Hưng Phát sử dụng thông tin để phản hồi nội dung liên hệ, hỗ trợ hội thoại và tiếp nhận, đánh giá hồ sơ tuyển dụng.
              Thông tin không được dùng cho mục đích khác ngoài phạm vi cần thiết nếu chưa có sự đồng ý phù hợp.
            </p>

            <h2>3. Hệ thống xử lý thông tin</h2>
            <p>
              Thông tin có thể đi qua các dịch vụ kỹ thuật cần thiết cho hội thoại tự động, chuyển tiếp thông báo, tiếp nhận biểu mẫu và lưu vết
              yêu cầu. Hưng Phát giới hạn việc sử dụng dữ liệu theo mục đích vận hành của từng yêu cầu và theo cấu hình thực tế của hệ thống.
            </p>

            <h2>4. Thời gian lưu giữ</h2>
            <p>
              Thông tin được lưu trong khoảng thời gian hợp lý để xử lý yêu cầu, chăm sóc sau trao đổi, quản lý hồ sơ và đáp ứng nghĩa vụ vận hành
              hoặc pháp lý có liên quan. Dữ liệu không còn cần thiết sẽ được xem xét xóa hoặc hạn chế sử dụng.
            </p>

            <h2>5. Yêu cầu cập nhật hoặc xóa thông tin</h2>
            <p>
              Bạn có thể liên hệ Hưng Phát để đề nghị kiểm tra, cập nhật hoặc xóa thông tin đã gửi, trong phạm vi pháp luật và nghĩa vụ lưu trữ cho phép.
            </p>
            <a href={ZALO_URL}>
              <MessageCircle size={18} /> Zalo {ZALO_PHONE_DISPLAY}
            </a>

            <h2>6. Bảo vệ thông tin</h2>
            <p>
              Hưng Phát áp dụng các biện pháp kỹ thuật và quy trình vận hành phù hợp để hạn chế truy cập, sử dụng hoặc tiết lộ thông tin ngoài mục đích xử lý.
            </p>

            <p>
              <strong>Ngày cập nhật:</strong> 24/09/2026.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
