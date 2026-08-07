"use client";

import Link from "next/link";
import { Bell, ChevronRight, Megaphone, PackageCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NotificationPreferences } from "@/components/notification-preferences";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { Announcement, AnnouncementKind } from "@/lib/contracts";

const kindMeta: Record<AnnouncementKind, { label: string; icon: typeof Bell }> = {
  order: { label: "Đơn hàng", icon: PackageCheck },
  company: { label: "Tin Hưng Phát", icon: Bell },
  promotion: { label: "Chương trình", icon: Sparkles },
  system: { label: "Ứng dụng", icon: Megaphone },
};
const dateFormatter = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export function NotificationCenter() {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void service.listAnnouncements().then((next) => { if (active) setItems(next); }).catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : "Không tải được thông báo."); });
    return () => { active = false; };
  }, [service]);

  const unreadCount = items?.filter((item) => !item.readAt).length ?? 0;

  return <div className="notification-center notification-center-compact">
    <NotificationPreferences />
    <section className="notification-feed-section">
      <div className="notification-feed-toolbar"><span>{unreadCount > 0 ? `${unreadCount} chưa đọc` : "Đã đọc hết"}</span>{items ? <small>{items.length} nội dung</small> : null}</div>
      {error ? <div className="notification-empty-state">{error}</div> : null}
      {!items && !error ? <div className="notification-empty-state">Đang tải…</div> : null}
      {items?.length === 0 ? <div className="notification-empty-state">Chưa có thông báo mới.</div> : null}
      <div className="notification-feed-list">{items?.map((item) => { const meta = kindMeta[item.kind]; const Icon = meta.icon; return <Link className={["notification-feed-card", item.readAt ? "is-read" : "is-unread"].join(" ")} href={`/news/${item.id}`} key={item.id}><span className="notification-kind-icon"><Icon aria-hidden="true" size={20} /></span><span className="notification-feed-copy"><span className="notification-feed-meta"><span>{meta.label}</span><time dateTime={item.publishedAt}>{dateFormatter.format(new Date(item.publishedAt))}</time></span><strong>{item.title}</strong><span>{item.summary}</span>{!item.readAt ? <em>Chưa đọc</em> : null}</span><ChevronRight aria-hidden="true" className="notification-feed-chevron" size={19} /></Link>; })}</div>
    </section>
  </div>;
}
