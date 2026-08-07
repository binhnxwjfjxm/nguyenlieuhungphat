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

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function NotificationCenter() {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void service
      .listAnnouncements()
      .then((next) => {
        if (active) setItems(next);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Không tải được thông báo.");
        }
      });
    return () => {
      active = false;
    };
  }, [service]);

  const unreadCount = items?.filter((item) => !item.readAt).length ?? 0;

  return (
    <div className="notification-center">
      <section className="notification-center-hero">
        <div>
          <p className="eyebrow">Tin tức &amp; thông báo</p>
          <h1>Trung tâm thông tin</h1>
          <p>
            {unreadCount > 0
              ? `Bạn có ${unreadCount} nội dung chưa đọc.`
              : "Bạn đã xem hết nội dung hiện có."}
          </p>
        </div>
        <span className="notification-hero-icon">
          <Bell aria-hidden="true" size={28} />
        </span>
      </section>

      <NotificationPreferences />

      <section className="notification-feed-section">
        <div className="notification-feed-heading">
          <div>
            <p className="eyebrow">Mới nhất</p>
            <h2>Tin và cập nhật</h2>
          </div>
          {items ? <span>{items.length} nội dung</span> : null}
        </div>

        {error ? <div className="notification-empty-state">{error}</div> : null}
        {!items && !error ? <div className="notification-empty-state">Đang tải thông báo…</div> : null}
        {items?.length === 0 ? (
          <div className="notification-empty-state">Chưa có thông báo hoặc tin mới.</div>
        ) : null}

        <div className="notification-feed-list">
          {items?.map((item) => {
            const meta = kindMeta[item.kind];
            const Icon = meta.icon;
            return (
              <Link
                className={["notification-feed-card", item.readAt ? "is-read" : "is-unread"]
                  .filter(Boolean)
                  .join(" ")}
                href={`/news/${item.id}`}
                key={item.id}
              >
                <span className="notification-kind-icon">
                  <Icon aria-hidden="true" size={20} />
                </span>
                <span className="notification-feed-copy">
                  <span className="notification-feed-meta">
                    <span>{meta.label}</span>
                    <time dateTime={item.publishedAt}>
                      {dateFormatter.format(new Date(item.publishedAt))}
                    </time>
                  </span>
                  <strong>{item.title}</strong>
                  <span>{item.summary}</span>
                  {!item.readAt ? <em>Chưa đọc</em> : null}
                </span>
                <ChevronRight aria-hidden="true" className="notification-feed-chevron" size={19} />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
