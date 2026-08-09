"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useCustomerAuth } from "@/components/clerk-auth-provider";
import { getPortalLifecycle, PortalLifecycleError, type PortalLifecycleState } from "@/lib/customer-portal-lifecycle";

const STATE_MESSAGE: Partial<Record<PortalLifecycleState, string>> = {
  unregistered: "Điểm bán chưa đăng ký với Hưng Phát.",
  submitted: "Đăng ký điểm bán đã được gửi và đang chờ xử lý.",
  under_review: "Điểm bán đang được Hưng Phát xác minh.",
  need_more_info: "Đăng ký cần bổ sung thông tin trước khi được duyệt.",
  activation_pending: "Điểm bán đã được duyệt và đang chờ kích hoạt quyền đặt hàng.",
  rejected: "Đăng ký điểm bán chưa được chấp thuận.",
  cancelled: "Đăng ký điểm bán đã kết thúc.",
  suspended: "Liên kết điểm bán hiện đang tạm khóa.",
};

export function CustomerPortalAccessGate({ children }: Readonly<{ children: ReactNode }>) {
  const { status } = useCustomerAuth();
  const [portalState, setPortalState] = useState<PortalLifecycleState | "loading" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "signed-in") return;
    let cancelled = false;
    void getPortalLifecycle()
      .then((snapshot) => {
        if (cancelled) return;
        setError("");
        setPortalState(snapshot.state);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setPortalState("error");
        setError(loadError instanceof PortalLifecycleError ? loadError.message : "Không kiểm tra được trạng thái điểm bán.");
      });
    return () => { cancelled = true; };
  }, [status]);

  if (portalState === "active_customer") return children;

  const message = error || (portalState === "loading"
    ? "Đang kiểm tra trạng thái điểm bán..."
    : STATE_MESSAGE[portalState as PortalLifecycleState] || "Điểm bán chưa được kích hoạt để đặt hàng.");

  return (
    <section className="auth-state-page" aria-live="polite">
      <span className="auth-state-icon"><ShieldCheck aria-hidden="true" size={30} /></span>
      <strong>{message}</strong>
      <small>Danh mục, giỏ hàng và đặt hàng vẫn được khóa cho tới khi membership hoạt động. Bạn vẫn có thể dùng thanh điều hướng để xem trạng thái tài khoản.</small>
      {portalState !== "loading" ? <Link className="primary-button" href="/account#shop-registration">Đăng ký / xem trạng thái điểm bán</Link> : null}
    </section>
  );
}
