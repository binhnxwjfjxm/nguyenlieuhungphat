"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useCustomerAuth } from "@/components/clerk-auth-provider";
import { getPortalLifecycle, PortalLifecycleError, type PortalLifecycleState } from "@/lib/customer-portal-lifecycle";

type PortalAccessViewState = PortalLifecycleState | "loading" | "error";
type PortalAccessCacheEntry = Readonly<{
  checkedAt: number;
  error: string;
  state: PortalAccessViewState;
}>;

const PORTAL_ACCESS_FRESH_MS = 5 * 60 * 1000;
const portalAccessCache = new Map<string, PortalAccessCacheEntry>();
const portalAccessRequests = new Map<string, Promise<PortalAccessCacheEntry>>();

export function rememberCustomerPortalAccess(userId: string, state: PortalLifecycleState): void {
  portalAccessCache.set(userId, { checkedAt: Date.now(), error: "", state });
}

function loadCustomerPortalAccess(userId: string): Promise<PortalAccessCacheEntry> {
  const currentRequest = portalAccessRequests.get(userId);
  if (currentRequest) return currentRequest;

  const request = getPortalLifecycle()
    .then((snapshot) => {
      const entry = { checkedAt: Date.now(), error: "", state: snapshot.state } satisfies PortalAccessCacheEntry;
      portalAccessCache.set(userId, entry);
      return entry;
    })
    .catch((loadError: unknown) => {
      const message = loadError instanceof PortalLifecycleError ? loadError.message : "Không kiểm tra được trạng thái điểm bán.";
      const entry = { checkedAt: Date.now(), error: message, state: "error" } satisfies PortalAccessCacheEntry;
      portalAccessCache.set(userId, entry);
      return entry;
    })
    .finally(() => portalAccessRequests.delete(userId));

  portalAccessRequests.set(userId, request);
  return request;
}

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
  const { status, user } = useCustomerAuth();
  const userId = user?.id ?? "";
  const cached = userId ? portalAccessCache.get(userId) : undefined;
  const [resolved, setResolved] = useState<Readonly<{ entry: PortalAccessCacheEntry; userId: string }> | null>(
    cached ? { entry: cached, userId } : null,
  );
  const currentEntry = resolved?.userId === userId
    ? resolved.entry
    : cached ?? { checkedAt: 0, error: "", state: "loading" };
  const portalState = currentEntry.state;
  const error = currentEntry.error;

  useEffect(() => {
    if (status !== "signed-in" || !userId) return;
    let cancelled = false;
    const current = portalAccessCache.get(userId);

    if (current && Date.now() - current.checkedAt < PORTAL_ACCESS_FRESH_MS) return;

    void loadCustomerPortalAccess(userId).then((entry) => {
      if (cancelled) return;
      setResolved({ entry, userId });
    });
    return () => { cancelled = true; };
  }, [status, userId]);

  if (portalState === "active_customer") return children;

  if (portalState === "loading") {
    return (
      <section aria-label="Đang chuẩn bị nội dung" className="portal-gate-skeleton" role="status">
        <span className="sr-only">Đang kiểm tra trạng thái điểm bán</span>
        <div className="portal-skeleton-heading is-skeleton" />
        <div className="portal-skeleton-search is-skeleton" />
        <div className="portal-skeleton-grid"><span className="is-skeleton" /><span className="is-skeleton" /></div>
      </section>
    );
  }

  const message = error || STATE_MESSAGE[portalState as PortalLifecycleState] || "Điểm bán chưa được kích hoạt để đặt hàng.";

  return (
    <section className="auth-state-page portal-access-state" aria-live="polite">
      <span className="auth-state-icon"><ShieldCheck aria-hidden="true" size={30} /></span>
      <strong>{message}</strong>
      <small>Danh mục, giỏ hàng và đặt hàng vẫn được khóa cho tới khi membership hoạt động. Bạn vẫn có thể dùng thanh điều hướng để xem trạng thái tài khoản.</small>
      <Link className="primary-button" href="/account#shop-registration">Đăng ký / xem trạng thái điểm bán</Link>
    </section>
  );
}
