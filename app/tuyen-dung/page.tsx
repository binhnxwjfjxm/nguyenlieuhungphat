import type { Metadata } from "next";
import Image from "next/image";
import { RecruitmentBoard } from "@/components/recruitment-board";
import { RecruitmentForm } from "@/components/recruitment-form";
import { getAbsoluteUrl } from "@/lib/site";
import { siteAssets } from "@/lib/site-assets";

export const metadata: Metadata = {
  title: "Tuyển dụng nhân viên kinh doanh miền Tây",
  description: "Hưng Phát tuyển nhân viên kinh doanh thị trường miền Tây, phụ trách chăm sóc khách hàng và phát triển thị trường.",
  alternates: { canonical: "/tuyen-dung" },
  openGraph: {
    title: "Tuyển dụng | Hưng Phát",
    description: "Thông tin cơ hội nghề nghiệp và vị trí nhân viên kinh doanh thị trường miền Tây tại Hưng Phát.",
    url: getAbsoluteUrl("/tuyen-dung"),
  },
};

export default function TuyenDungPage() {
  return (
    <main className="content-page content-page-v2 recruitment-page-v2">
      <section className="page-hero">
        <div className="container page-hero-inner page-hero-with-image">
          <div>
            <p className="eyebrow">TUYỂN DỤNG</p>
            <h1 className="gradient-heading">Tuyển nhân viên kinh doanh thị trường miền Tây</h1>
            <p>Xem khu vực phụ trách, mô tả công việc và gửi hồ sơ trực tiếp cho bộ phận tuyển dụng.</p>
          </div>
          <div className="page-hero-image">
            <Image
              src={siteAssets.pageHero.gioiThieu}
              alt="Môi trường làm việc tại Hưng Phát"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 56vw"
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container recruitment-board-wrap"><RecruitmentBoard /></div>
      </section>

      <section className="section" id="recruitment-form">
        <div className="container recruitment-form-wrap">
          <div className="contact-card contact-form-card recruitment-form-card-v2">
            <p className="eyebrow">GỬI HỒ SƠ</p>
            <h2 className="gradient-heading">Ứng tuyển cùng Hưng Phát</h2>
            <RecruitmentForm inline initialValues={{ source: "tuyen-dung", pathname: "/tuyen-dung" }} />
          </div>
        </div>
      </section>
    </main>
  );
}
