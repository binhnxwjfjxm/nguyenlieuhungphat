import type { Metadata } from "next";
import { RecruitmentBoard } from "@/components/recruitment-board";
import { RecruitmentForm } from "@/components/recruitment-form";
import { getAbsoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tuyển dụng",
  description:
    "Tin tuyển Hưng Phát hiển thị dạng hàng ngang. Bấm vào từng tin để xem mô tả công việc, lương thưởng và cách ứng tuyển.",
  alternates: { canonical: "/tuyen-dung" },
  openGraph: {
    title: "Tuyển dụng | Hưng Phát",
    description:
      "Tin tuyển Hưng Phát hiển thị dạng hàng ngang. Bấm vào từng tin để xem mô tả công việc, lương thưởng và cách ứng tuyển.",
    url: getAbsoluteUrl("/tuyen-dung"),
  },
};

export default function TuyenDungPage() {
  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="container page-hero-inner">
          <p className="eyebrow">TUYỂN DỤNG</p>
          <h1 className="gradient-heading">Tin tuyển dạng ngang, bấm vào xem chi tiết</h1>
          <p>Hàng ngang ngắn, bấm vào từng tin để xem mô tả công việc, lương thưởng và quyền lợi.</p>
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
            <p>Ứng viên xem nhanh chi tiết vị trí rồi gửi hồ sơ qua form bên dưới. HR sẽ phản hồi trực tiếp.</p>
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
