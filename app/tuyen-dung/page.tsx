import type { Metadata } from "next";
import { BadgeCheck, Clock3, Send, Users } from "lucide-react";
import { RecruitmentForm } from "@/components/recruitment-form";
import { getAbsoluteUrl } from "@/lib/site";

const recruitmentHighlights = [
  "Trang này chỉ để nhận hồ sơ ứng tuyển",
  "Chi tiết từng vị trí được trao đổi riêng khi HR liên hệ",
  "Form gọn, gửi nhanh, không cần email",
];

const hiringSteps = [
  "Điền form và gửi CV hoặc link hồ sơ",
  "HR xem nhanh và liên hệ lại nếu phù hợp",
  "Trao đổi thêm về vị trí, khu vực và thời gian bắt đầu",
];

export const metadata: Metadata = {
  title: "Tuyển dụng",
  description:
    "Trang tuyển dụng Hưng Phát dùng để tiếp nhận hồ sơ ứng tuyển. Thông tin chi tiết từng vị trí sẽ được trao đổi riêng khi HR liên hệ.",
  alternates: { canonical: "/tuyen-dung" },
  openGraph: {
    title: "Tuyển dụng | Hưng Phát",
    description:
      "Trang tuyển dụng Hưng Phát dùng để tiếp nhận hồ sơ ứng tuyển. Thông tin chi tiết từng vị trí sẽ được trao đổi riêng khi HR liên hệ.",
    url: getAbsoluteUrl("/tuyen-dung"),
  },
};

export default function TuyenDungPage() {
  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="container page-hero-inner">
          <p className="eyebrow">TUYỂN DỤNG</p>
          <h1 className="gradient-heading">Gửi hồ sơ, Hưng Phát sẽ chủ động liên hệ nếu phù hợp</h1>
          <p>
            Trang này chỉ dùng để tiếp nhận ứng viên. Nội dung mô tả công việc chi tiết đã có ở bài đăng riêng,
            website giữ phần tuyển dụng thật gọn để khách vào là biết ngay cách ứng tuyển.
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
            <p className="eyebrow">CÁCH LÀM VIỆC</p>
            <h2 className="gradient-heading">Chỉ giữ thông tin cần cho ứng tuyển</h2>
            <p>
              Không lặp lại toàn bộ tin tuyển trên web. Ứng viên chỉ cần để lại thông tin cơ bản, CV và ghi chú
              ngắn. Phần chi tiết sẽ được HR trao đổi trực tiếp sau khi xem hồ sơ.
            </p>

            <div className="page-hero-points">
              <span>
                <Users size={18} /> Nhận hồ sơ từ ứng viên phù hợp với mô hình B2B
              </span>
              <span>
                <BadgeCheck size={18} /> Trao đổi ngắn gọn, rõ ràng, không vòng vo
              </span>
              <span>
                <Clock3 size={18} /> Phản hồi trong giờ làm việc
              </span>
            </div>

            <div className="recruitment-role">
              <h3>Quy trình ứng tuyển</h3>
              <ol>
                {hiringSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </div>

          <div className="contact-card contact-form-card">
            <p className="eyebrow">GỬI CV</p>
            <h2 className="gradient-heading">Điền form để HR xem hồ sơ</h2>
            <p>
              Chỉ cần điền form, chọn vị trí phù hợp và đính kèm CV hoặc link hồ sơ. Các thông tin chi tiết sẽ
              được trao đổi riêng khi cần.
            </p>

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
