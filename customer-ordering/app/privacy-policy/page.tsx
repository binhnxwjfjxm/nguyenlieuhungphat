import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách bảo mật",
  description:
    "Chính sách bảo mật dành cho website đặt hàng và các kênh hỗ trợ trực tuyến của Hưng Phát.",
  alternates: {
    canonical: "https://sales.nguyenlieuhungphat.com/privacy-policy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const sectionStyle = {
  marginTop: "28px",
} as const;

const headingStyle = {
  margin: "0 0 10px",
  fontSize: "1.08rem",
  lineHeight: 1.45,
  color: "#0f6b3d",
} as const;

const paragraphStyle = {
  margin: "0 0 10px",
  lineHeight: 1.75,
  color: "#334038",
} as const;

export default function PrivacyPolicyPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#f7f8f6",
        padding: "32px 16px 56px",
      }}
    >
      <article
        style={{
          width: "min(100%, 820px)",
          margin: "0 auto",
          background: "#ffffff",
          border: "1px solid #e5e9e4",
          borderRadius: "20px",
          padding: "clamp(22px, 5vw, 42px)",
          boxShadow: "0 12px 34px rgba(22, 58, 35, 0.08)",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            color: "#198754",
            fontWeight: 800,
            letterSpacing: ".08em",
            fontSize: ".78rem",
          }}
        >
          HƯNG PHÁT
        </p>
        <h1
          style={{
            margin: "0 0 12px",
            fontSize: "clamp(1.8rem, 5vw, 2.5rem)",
            lineHeight: 1.18,
            color: "#17221a",
          }}
        >
          Chính sách bảo mật
        </h1>
        <p style={{ ...paragraphStyle, color: "#6c757d" }}>
          Chính sách này mô tả cách Hưng Phát tiếp nhận, sử dụng và bảo vệ thông
          tin khi khách hàng sử dụng website đặt hàng, Facebook Messenger và các
          kênh hỗ trợ trực tuyến có liên quan.
        </p>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>1. Phạm vi áp dụng</h2>
          <p style={paragraphStyle}>
            Chính sách áp dụng cho website tại sales.nguyenlieuhungphat.com,
            các biểu mẫu đặt hàng, tài khoản khách hàng, nội dung trao đổi với
            bộ phận hỗ trợ và hội thoại được gửi qua các kênh được Hưng Phát kết
            nối để phục vụ khách hàng.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>2. Thông tin có thể được tiếp nhận</h2>
          <p style={paragraphStyle}>
            Tùy theo cách khách hàng sử dụng dịch vụ, Hưng Phát có thể tiếp nhận
            họ tên, số điện thoại, email, tên cửa hàng hoặc doanh nghiệp, địa chỉ
            giao hàng, thông tin đơn hàng, nội dung yêu cầu hỗ trợ và nội dung
            hội thoại do khách hàng chủ động gửi.
          </p>
          <p style={paragraphStyle}>
            Khi khách hàng liên hệ qua Facebook Messenger, hệ thống có thể xử lý
            thông tin kỹ thuật và định danh cần thiết do Meta cung cấp để nhận,
            định tuyến và phản hồi tin nhắn, chẳng hạn mã người dùng hoặc mã
            trang trong phạm vi quyền mà khách hàng và Meta cho phép.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>3. Mục đích sử dụng thông tin</h2>
          <p style={paragraphStyle}>
            Thông tin được sử dụng để tư vấn sản phẩm, tạo và xử lý đơn hàng,
            phản hồi tin nhắn, hỗ trợ khách hàng, xác nhận giao nhận, xử lý yêu
            cầu sau bán hàng, bảo đảm an toàn hệ thống và đáp ứng nghĩa vụ pháp
            lý khi có yêu cầu hợp lệ.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>4. Dịch vụ kỹ thuật và bên xử lý dữ liệu</h2>
          <p style={paragraphStyle}>
            Để vận hành website và chatbot, dữ liệu có thể được xử lý thông qua
            các nhà cung cấp hạ tầng, lưu trữ, xác thực, nhắn tin hoặc nền tảng
            tích hợp mà Hưng Phát sử dụng. Việc xử lý chỉ nhằm phục vụ chức năng
            của dịch vụ và được giới hạn theo cấu hình, quyền truy cập và mục
            đích vận hành tương ứng.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>5. Thời gian lưu giữ</h2>
          <p style={paragraphStyle}>
            Dữ liệu được lưu trong thời gian cần thiết để xử lý giao dịch, hỗ
            trợ khách hàng, giải quyết khiếu nại, vận hành hệ thống và thực hiện
            nghĩa vụ lưu trữ theo quy định áp dụng. Khi không còn cần thiết, dữ
            liệu sẽ được xóa, ẩn danh hoặc hạn chế sử dụng theo điều kiện kỹ
            thuật và pháp lý phù hợp.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>6. Bảo vệ thông tin</h2>
          <p style={paragraphStyle}>
            Hưng Phát áp dụng các biện pháp kỹ thuật và quy trình vận hành phù
            hợp nhằm hạn chế truy cập, thay đổi, sử dụng hoặc tiết lộ thông tin
            ngoài mục đích được phép.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>7. Quyền của khách hàng và yêu cầu xóa dữ liệu</h2>
          <p style={paragraphStyle}>
            Khách hàng có thể yêu cầu kiểm tra, cập nhật hoặc xóa thông tin đã
            cung cấp, trong phạm vi pháp luật và nghĩa vụ lưu trữ cho phép. Khi
            gửi yêu cầu, vui lòng cung cấp đủ thông tin để Hưng Phát xác minh
            đúng tài khoản hoặc cuộc hội thoại liên quan.
          </p>
          <p style={paragraphStyle}>
            Yêu cầu về dữ liệu có thể được gửi qua trang liên hệ chính thức của
            Hưng Phát tại{" "}
            <a
              href="https://www.nguyenlieuhungphat.com/lien-he"
              style={{ color: "#0f6b3d", fontWeight: 750, textDecoration: "underline" }}
            >
              www.nguyenlieuhungphat.com/lien-he
            </a>
            .
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>8. Thay đổi chính sách</h2>
          <p style={paragraphStyle}>
            Chính sách có thể được cập nhật khi phạm vi dịch vụ hoặc yêu cầu
            pháp lý thay đổi. Phiên bản công bố tại địa chỉ này là phiên bản
            đang có hiệu lực.
          </p>
        </section>

        <section style={{ ...sectionStyle, paddingTop: "10px", borderTop: "1px solid #e5e9e4" }}>
          <p style={{ ...paragraphStyle, marginBottom: 0 }}>
            <strong>Đơn vị vận hành:</strong> Hưng Phát
            <br />
            <strong>Ngày cập nhật:</strong> 23/09/2026
          </p>
        </section>
      </article>
    </main>
  );
}
