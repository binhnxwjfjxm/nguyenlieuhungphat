"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useCustomerAuth } from "@/components/clerk-auth-provider";

export function CustomerAuthGate({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const { status, error } = useCustomerAuth();

  useEffect(() => {
    if (status === "signed-out") router.replace("/login");
  }, [router, status]);

  if (status === "signed-in") return children;

  const message =
    status === "unconfigured"
      ? "Ứng dụng chưa được cấu hình khóa đăng nhập Clerk."
      : status === "error"
        ? error ?? "Không thể tải dịch vụ đăng nhập."
        : status === "signed-out"
          ? "Đang chuyển tới trang đăng nhập..."
          : "Đang kiểm tra phiên đăng nhập...";

  return (
    <main className="auth-state-page" aria-live="polite">
      <span className="auth-state-icon">
        <ShieldCheck aria-hidden="true" size={30} />
      </span>
      <strong>{message}</strong>
      {status === "unconfigured" ? (
        <small>Thiết lập NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY tại môi trường Customer Ordering.</small>
      ) : null}
    </main>
  );
}
