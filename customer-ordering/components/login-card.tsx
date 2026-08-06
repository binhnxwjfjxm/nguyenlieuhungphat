"use client";

import Image from "next/image";
import { Eye, LockKeyhole, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";

export function LoginCard() {
  const router = useRouter();
  const [phone, setPhone] = useState("0901234567");
  const [password, setPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await createCustomerOrderingService().signIn({ phone, password });
      router.push("/");
      router.refresh();
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Không thể đăng nhập.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <Image alt="Logo Công ty Hưng Phát" className="login-logo" height={108} priority src="/logo-transparent.png" width={230} />
        <div className="login-heading"><h1>Đăng nhập</h1><p>Chào mừng quý khách trở lại.</p></div>
        <form onSubmit={handleSubmit} className="login-form">
          <label><span>Số điện thoại</span><div className="input-with-icon"><Phone aria-hidden="true" size={18} /><input autoComplete="tel" inputMode="tel" onChange={(event) => setPhone(event.target.value)} placeholder="Nhập số điện thoại" required value={phone} /></div></label>
          <label><span>Mật khẩu</span><div className="input-with-icon"><LockKeyhole aria-hidden="true" size={18} /><input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu" required type={showPassword ? "text" : "password"} value={password} /><button aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="password-toggle" onClick={() => setShowPassword((current) => !current)} type="button"><Eye aria-hidden="true" size={18} /></button></div></label>
          <div className="login-options"><label className="remember-option"><input defaultChecked type="checkbox" /><span>Ghi nhớ đăng nhập</span></label><button className="text-button" type="button">Quên mật khẩu?</button></div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-button" disabled={submitting} type="submit">{submitting ? "Đang đăng nhập..." : "Đăng nhập"}</button>
        </form>
        <p className="contact-note">Chưa có tài khoản? <a href="tel:0900000000">Liên hệ Hưng Phát</a></p>
      </section>
    </main>
  );
}
