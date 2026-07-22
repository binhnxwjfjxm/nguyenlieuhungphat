"use client";

import { Briefcase, Building2, CalendarDays, Coins, MapPin, PhoneCall, Send, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { siteAssets, siteAssetFallbacks } from "@/lib/site-assets";
import { ResponsiveAssetPicture } from "./responsive-asset-picture";

type AreaKey = "mien-tay-1" | "mien-tay-2";

type RecruitmentRole = {
  key: AreaKey;
  shortTitle: string;
  region: string;
  provinces: string;
  salary: string;
  summary: string;
};

const roles: RecruitmentRole[] = [
  {
    key: "mien-tay-1",
    shortTitle: "Miền Tây 1",
    region: "Tiền Giang - Long An - Bến Tre - Vĩnh Long",
    provinces: "Tiền Giang, Long An, Bến Tre, Vĩnh Long, Trà Vinh, Đồng Tháp, An Giang",
    salary: "12 - 30 triệu / tháng",
    summary: "Phụ trách thị trường, chăm khách và mở rộng đại lý khu vực phía Đông miền Tây.",
  },
  {
    key: "mien-tay-2",
    shortTitle: "Miền Tây 2",
    region: "Cần Thơ - Hậu Giang - Sóc Trăng - Cà Mau",
    provinces: "Cần Thơ, Hậu Giang, Sóc Trăng, Bạc Liêu, Cà Mau, Kiên Giang",
    salary: "12 - 30 triệu / tháng",
    summary: "Phụ trách thị trường, chăm khách và mở rộng đại lý khu vực phía Tây miền Tây.",
  },
];

const responsibilities = [
  "Tìm kiếm và phát triển khách hàng mới trong khu vực phụ trách.",
  "Chăm sóc khách hàng hiện có, giữ nhịp đặt hàng và tái mua.",
  "Tư vấn sản phẩm, triển khai chương trình đến đại lý và cửa hàng.",
  "Khảo sát thị trường, cập nhật nhu cầu và đối thủ cạnh tranh.",
  "Thường xuyên đi thị trường, bám tuyến và theo dõi đơn hàng.",
];

const requirements = [
  "Nam, độ tuổi 22 - 35.",
  "Yêu thích kinh doanh và phát triển thị trường.",
  "Giao tiếp tốt, chủ động, có trách nhiệm.",
  "Sẵn sàng đi công tác thường xuyên tại miền Tây.",
  "Ưu tiên ứng viên có kinh nghiệm ngành hàng tiêu dùng, thực phẩm, đồ uống hoặc nguyên liệu pha chế.",
];

const benefits = [
  "Thu nhập 12 - 30 triệu / tháng theo năng lực và hiệu quả thị trường.",
  "Có thể trên 50 triệu / tháng nếu đạt kết quả kinh doanh vượt trội.",
  "Thưởng theo kết quả thực tế và chỉ tiêu kinh doanh.",
  "Ký hợp đồng lao động chính thức sau thử việc.",
  "Đầy đủ BHXH, BHYT, BHTN và chế độ lễ, Tết, phép năm.",
];

const applicationNotes = [
  "CV có thể gửi qua form bên dưới hoặc Zalo 0396 980 168.",
  "Địa chỉ công ty: 152 Yersin, phường Đạo Thạnh, tỉnh Đồng Tháp.",
  "HR sẽ liên hệ lại nếu hồ sơ phù hợp.",
];

export function RecruitmentBoard() {
  const [selectedRole, setSelectedRole] = useState<RecruitmentRole | null>(null);
  const selectedDetail = useMemo(() => selectedRole ?? roles[0], [selectedRole]);

  useEffect(() => {
    if (!selectedRole) return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedRole(null);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedRole]);

  return (
    <>
      <div className="recruitment-strip">
        {roles.map((role) => (
          <button
            key={role.key}
            className="recruitment-strip-card"
            type="button"
            onClick={() => setSelectedRole(role)}
          >
            <div className="recruitment-strip-main">
              <div className="recruitment-strip-icon">
                <Briefcase size={20} />
              </div>

              <div className="recruitment-strip-copy">
                <p className="recruitment-strip-eyebrow">Nhân viên kinh doanh thị trường</p>
                <h2>{role.shortTitle}</h2>
                <p>{role.summary}</p>
              </div>

              <div className="recruitment-strip-preview" aria-hidden="true">
                <ResponsiveAssetPicture
                  className="recruitment-strip-preview-picture"
                  imgClassName="recruitment-strip-preview-img"
                  alt=""
                  desktopSrc={role.key === "mien-tay-1" ? siteAssets.categories.food : siteAssets.categories.industrial}
                  desktopFallbackSrc={
                    role.key === "mien-tay-1" ? siteAssetFallbacks.categories.food : siteAssetFallbacks.categories.industrial
                  }
                  imgStyle={{ objectFit: "cover", objectPosition: "center center" }}
                />
              </div>
            </div>

            <div className="recruitment-strip-side">
              <strong>{role.salary}</strong>
              <span>{role.region}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="recruitment-strip-note">
        <span>
          <MapPin size={16} /> Chọn 1 trong 2 khu vực phụ trách
        </span>
        <span>
          <Coins size={16} /> Lương theo năng lực và hiệu quả thị trường
        </span>
        <span>
          <Send size={16} /> Bấm vào từng tin để xem mô tả đầy đủ
        </span>
      </div>

      {selectedRole ? (
        <div className="recruitment-modal-overlay" role="presentation" onMouseDown={() => setSelectedRole(null)}>
          <div
            className="recruitment-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recruitment-preview-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="icon-button recruitment-modal-close"
              type="button"
              aria-label="Đóng chi tiết tuyển dụng"
              onClick={() => setSelectedRole(null)}
            >
              <X size={18} />
            </button>

            <div className="recruitment-modal-header">
              <div>
                <p className="eyebrow">TUYỂN DỤNG</p>
                <h2 id="recruitment-preview-title">Nhân viên kinh doanh thị trường miền Tây</h2>
                <p className="recruitment-modal-lead">{selectedDetail.summary}</p>
              </div>
              <div className="recruitment-modal-salary">
                <span>Lương</span>
                <strong>{selectedDetail.salary}</strong>
                <small>Có thể trên 50 triệu / tháng nếu làm tốt</small>
              </div>
            </div>

            <div className="recruitment-modal-layout">
              <div className="recruitment-modal-copy">
                <div className="recruitment-modal-meta">
                  <div>
                    <span>Khu vực</span>
                    <strong>{selectedDetail.key === "mien-tay-1" ? "Miền Tây 1" : "Miền Tây 2"}</strong>
                  </div>
                  <div>
                    <span>Tuyến phụ trách</span>
                    <strong>{selectedDetail.region}</strong>
                  </div>
                  <div>
                    <span>Địa bàn</span>
                    <strong>{selectedDetail.provinces}</strong>
                  </div>
                </div>

                <div className="recruitment-modal-section">
                  <h3>
                    <Building2 size={18} /> Mô tả công việc
                  </h3>
                  <ul>
                    {responsibilities.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="recruitment-modal-section">
                  <h3>
                    <ShieldCheck size={18} /> Yêu cầu ứng viên
                  </h3>
                  <ul>
                    {requirements.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="recruitment-modal-section">
                  <h3>
                    <Coins size={18} /> Quyền lợi
                  </h3>
                  <ul>
                    {benefits.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="recruitment-modal-section">
                  <h3>
                    <PhoneCall size={18} /> Ứng tuyển
                  </h3>
                  <ul>
                    {applicationNotes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="recruitment-modal-rail">
                <div className="recruitment-modal-card">
                  <p>Thời gian</p>
                  <strong>
                    <CalendarDays size={18} />
                    Phản hồi trong giờ làm việc
                  </strong>
                </div>
                <div className="recruitment-modal-card">
                  <p>CV</p>
                  <strong>Gửi file hoặc link hồ sơ đều được</strong>
                </div>
                <div className="recruitment-modal-card">
                  <p>Liên hệ</p>
                  <strong>0396 980 168</strong>
                </div>
                <button
                  className="button button-primary recruitment-modal-cta"
                  type="button"
                  onClick={() => {
                    document.getElementById("recruitment-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    setSelectedRole(null);
                  }}
                >
                  Gửi hồ sơ ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
