import Link from "next/link";

const COMPANY_LOGO =
  "https://raw.githubusercontent.com/binhnxwjfjxm/nguyenlieuhungphat/main/public/logo-transparent.png";

export default function LoginPage() {
  return (
    <main className="login-page">
      <div className="logo-wrap">
        {/* Dùng đúng asset logo công ty hiện có trong repo, không vẽ lại. */}
        <img className="company-logo" src={COMPANY_LOGO} alt="Công ty Hưng Phát" />
      </div>

      <div className="login-copy">
        <h1>Đăng nhập</h1>
        <p>Chào mừng quý khách trở lại</p>
      </div>

      <form className="form">
        <div className="field">
          <label htmlFor="phone">Số điện thoại</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" placeholder="Nhập số điện thoại" autoComplete="tel" />
        </div>
        <div className="field">
          <label htmlFor="password">Mật khẩu</label>
          <input id="password" name="password" type="password" placeholder="Nhập mật khẩu" autoComplete="current-password" />
        </div>
        <div className="form-row">
          <label><input type="checkbox" /> Ghi nhớ đăng nhập</label>
          <Link href="#">Quên mật khẩu?</Link>
        </div>
        <Link className="primary-button" href="/">Đăng nhập</Link>
      </form>

      <div className="login-footer">
        Chưa có tài khoản? <Link href="#">Liên hệ chúng tôi</Link>
      </div>
    </main>
  );
}
