import type { Metadata } from "next";
import { RecruitmentBoard } from "@/components/recruitment-board";
import { RecruitmentForm } from "@/components/recruitment-form";
import { getAbsoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tuyển Dụng Hưng Phát 2026",
  description:
    "Tin tuyển Hưng Phát hiển thị dạng hàng ngang. Bấm vào từng tin để xem mô tả công việc, lương thưởng và cách ứng tuyển.",
  alternates: { canonical: "/tuyen-dung" },
  openGraph: {
    title: "Tuyển Dụng Hưng Phát 2026",
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
          <h1 className="gradient-heading">Tuyển Dụng Hưng Phát 2026</h1>
        </div>
      </section>

      <section className="section">
        <div className="container recruitment-board-wrap">
          <RecruitmentBoard />
        </div>
      </section>

      <section className="section" id="recruitment-form">
        <div className="container recruitment-form-wrap">
          <div className="contact-card contact-form-card">
            <p className="eyebrow">GỬI HỒ SƠ</p>
            <h2 className="gradient-heading">Gửi CV cho HR</h2>

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
