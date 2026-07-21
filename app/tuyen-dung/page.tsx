import type { Metadata } from "next";
import { RecruitmentBoard } from "@/components/recruitment-board";
import { RecruitmentForm } from "@/components/recruitment-form";
import { getAbsoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tuyển dụng",
  description:
    "Trang tuyển dụng Hưng Phát hiển thị tin tuyển dạng hàng ngang, bấm vào để xem mô tả công việc, lương thưởng và cách ứng tuyển.",
  alternates: { canonical: "/tuyen-dung" },
  openGraph: {
    title: "Tuyển dụng | Hưng Phát",
    description:
      "Trang tuyển dụng Hưng Phát hiển thị tin tuyển dạng hàng ngang, bấm vào để xem mô tả công việc, lương thưởng và cách ứng tuyển.",
    url: getAbsoluteUrl("/tuyen-dung"),
  },
};

export default function TuyenDungPage() {
  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="container page-hero-inner">
          <p className="eyebrow">TUYỂN DỤNG</p>
          <h1 className="gradient-heading">Tin tuyển dạng ngang, bấm vào xem chi tiết ngay trên web</h1>
          <p>
            Em đã đổi đúng format Sếp muốn: phần tin tuyển hiển thị gọn theo hàng ngang, còn nội dung mô tả công
            việc, lương thưởng và quyền lợi nằm trong popup để khách xem dễ hơn.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container recruitment-board-wrap">
          <RecruitmentBoard />
        </div>
      </section>

      <section className="section" id="recruitment-form">
        <div className="container contact-grid">
          <div className="contact-card">
            <p className="eyebrow">QUY TRÌNH</p>
            <h2 className="gradient-heading">Ứng tuyển nhanh, không vòng vo</h2>
            <p>
              Nếu thấy phù hợp, ứng viên có thể xem nhanh chi tiết vị trí rồi gửi hồ sơ qua form bên dưới. HR sẽ
              nhận và phản hồi trực tiếp.
            </p>
          </div>

          <div className="contact-card contact-form-card">
            <p className="eyebrow">GỬI HỒ SƠ</p>
            <h2 className="gradient-heading">Điền form để HR xem CV</h2>
            <p>Giữ form ngắn gọn để khách gửi nhanh. CV hoặc link hồ sơ sẽ đi thẳng vào nhóm HR.</p>

            <RecruitmentForm
              inline
              initialValues={{
                source: "tuyen-dung",
                pathname: "/tuyen-dung",
              }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
