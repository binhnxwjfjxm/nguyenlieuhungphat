import type { Metadata } from "next";
import { RecruitmentBoard } from "@/components/recruitment-board";
import { RecruitmentForm } from "@/components/recruitment-form";
import { getAbsoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tuyển dụng nhân viên kinh doanh miền Tây",
  description:
    "Hưng Phát tuyển nhân viên kinh doanh thị trường miền Tây, phụ trách chăm sóc khách hàng, phát triển đại lý và theo dõi đơn hàng.",
  alternates: { canonical: "/tuyen-dung" },
  openGraph: {
    title: "Tuyển dụng nhân viên kinh doanh miền Tây | Hưng Phát",
    description:
      "Cơ hội nhân viên kinh doanh thị trường miền Tây tại Hưng Phát, với hai khu vực phụ trách và chính sách thu nhập theo hiệu quả.",
    url: getAbsoluteUrl("/tuyen-dung"),
  },
};

export default function TuyenDungPage() {
  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="container page-hero-inner">
          <div>
            <p className="eyebrow">TUYỂN DỤNG</p>
            <h1 className="gradient-heading">Tuyển nhân viên kinh doanh thị trường miền Tây</h1>
            <p>Chọn khu vực phù hợp, xem mô tả công việc và gửi CV trực tiếp cho Hưng Phát.</p>
          </div>
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
