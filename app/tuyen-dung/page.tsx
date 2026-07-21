import type { Metadata } from "next";
import { BadgeCheck, Briefcase, Clock3, FileText, MapPin, Send, Users } from "lucide-react";
import { RecruitmentForm } from "@/components/recruitment-form";
import { getAbsoluteUrl } from "@/lib/site";

const openRoles = [
  {
    title: "Kinh doanh B2B",
    summary:
      "Làm việc trực tiếp với quán, cửa hàng và đại lý. Theo dõi báo giá, đơn hàng và giữ nhịp chăm sóc sau bán.",
    points: ["Ưu tiên người hiểu bán sỉ", "Giao tiếp gọn, rõ", "Biết bám khách tới cùng"],
  },
  {
    title: "Điều phối kho & giao nhận",
    summary:
      "Phối hợp soạn hàng, kiểm soát số lượng và giữ nhịp giao nhận theo lịch đã chốt với khách.",
    points: ["Cẩn thận, có trách nhiệm", "Làm việc sát với kho", "Ưu tiên người quen vận hành thực tế"],
  },
  {
    title: "Vận hành nội dung / web",
    summary:
      "Cập nhật nội dung public, hỗ trợ đăng sản phẩm và giữ giao diện site sạch, dễ đọc, dễ chốt lead.",
    points: ["Viết ngắn gọn, rõ ý", "Chủ động kiểm tra hiển thị", "Ưu tiên người thích làm việc có quy trình"],
  },
];

const hiringSteps = [
  "Điền form và đính kèm CV",
  "Nhóm HR nhận trực tiếp trong Telegram",
  "Trao đổi nhanh về vị trí phù hợp",
  "Chốt lịch phỏng vấn và ngày bắt đầu",
];

const recruitmentHighlights = [
  "CV đi thẳng vào nhóm HR-Hưng Phát",
  "Phản hồi nhanh, không vòng vo",
  "Ưu tiên người hiểu mô hình B2B / bán sỉ",
];

export const metadata: Metadata = {
  title: "Tuyển dụng",
  description:
    "Tuyển dụng Hưng Phát: vị trí kinh doanh B2B, kho giao nhận và vận hành nội dung / web. CV gửi thẳng về nhóm HR để phản hồi nhanh.",
  alternates: { canonical: "/tuyen-dung" },
  openGraph: {
    title: "Tuyển dụng | Hưng Phát",
    description:
      "Tuyển dụng Hưng Phát: vị trí kinh doanh B2B, kho giao nhận và vận hành nội dung / web. CV gửi thẳng về nhóm HR để phản hồi nhanh.",
    url: getAbsoluteUrl("/tuyen-dung"),
  },
};

export default function TuyenDungPage() {
  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="container page-hero-inner">
          <p className="eyebrow">TUYỂN DỤNG</p>
          <h1 className="gradient-heading">Tìm người làm thật, đi cùng Hưng Phát</h1>
          <p>
            Ứng tuyển thẳng qua form bên dưới. CV và thông tin ứng viên sẽ vào nhóm HR-Hưng Phát để
            đội tuyển dụng xem nhanh.
          </p>
          <div className="page-hero-points">
            {recruitmentHighlights.map((item) => (
              <span key={item}>
                <Send size={18} /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container contact-grid">
          <div className="contact-card">
            <p className="eyebrow">VỊ TRÍ ĐANG MỞ</p>
            <h2 className="gradient-heading">Những vai trò đang ưu tiên</h2>

            {openRoles.map((role) => (
              <div key={role.title} className="recruitment-role">
                <h3>{role.title}</h3>
                <p>{role.summary}</p>
                <p>{role.points.join(" · ")}</p>
              </div>
            ))}

            <div className="page-hero-points">
              <span>
                <Users size={18} /> Môi trường gọn, ít lớp trung gian
              </span>
              <span>
                <Briefcase size={18} /> Làm việc với nguồn hàng và khách thật
              </span>
              <span>
                <BadgeCheck size={18} /> Quy trình rõ ràng, phản hồi nhanh
              </span>
            </div>
          </div>

          <div className="contact-card contact-form-card">
            <p className="eyebrow">GỬI CV</p>
            <h2 className="gradient-heading">Điền form, CV tự vào nhóm HR</h2>
            <p>
              Không cần email. Chỉ cần điền form, thêm link CV hoặc đính kèm file, nhóm HR sẽ nhận
              trực tiếp.
            </p>

            <RecruitmentForm
              inline
              initialValues={{
                source: "tuyen-dung",
                pathname: "/tuyen-dung",
              }}
            />

            <div className="page-hero-points">
              <span>
                <FileText size={18} /> CV PDF, DOC, DOCX, PNG hoặc JPG
              </span>
              <span>
                <Clock3 size={18} /> Phản hồi trong giờ làm việc
              </span>
              <span>
                <MapPin size={18} /> Ưu tiên ứng viên ở TP. Hồ Chí Minh
              </span>
            </div>

            <p className="eyebrow">QUY TRÌNH ỨNG TUYỂN</p>
            <ol>
              {hiringSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
