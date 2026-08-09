"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useCustomerAuth } from "@/components/clerk-auth-provider";
import { getPortalLifecycle, PortalLifecycleError, type PortalLifecycleState } from "@/lib/customer-portal-lifecycle";

export function CustomerPortalAccessGate({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
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
        if (snapshot.state !== "active_customer") router.replace("/account#shop-registration");
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setPortalState("error");
        setError(loadError instanceof PortalLifecycleError ? loadError.message : "Không kiểm tra được trạng thái điểm bán.");
      });
    return () => { cancelled = true; };
  }, [router, status]);

  if (portalState === "active_customer") return children;

  return (
    <main className="auth-state-page" aria-live="polite">
      <span className="auth-state-icon"><ShieldCheck aria-hidden="true" size={30} /></span>
      <strong>{error || (portalState === "loading" ? "Đang kiểm tra trạng thái điểm bán..." : "Đang chuyển tới đăng ký điểm bán...")}</strong>
      {error ? <small>Thử tải lại trang. Danh mục và đặt hàng vẫn được khóa cho tới khi xác minh membership thành công.</small> : null}
    </main>
  );
}
