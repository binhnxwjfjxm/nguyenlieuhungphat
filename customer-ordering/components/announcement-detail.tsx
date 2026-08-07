"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Bell } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { Announcement } from "@/lib/contracts";
import { dispatchCustomerNotificationsChanged } from "@/lib/notification-events";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function AnnouncementDetail({ announcementId }: Readonly<{ announcementId: string }>) {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [announcement, setAnnouncement] = useState<Announcement | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void service
      .getAnnouncementById(announcementId)
      .then(async (item) => {
        if (!item) {
          if (active) setAnnouncement(null);
          return;
        }
        const next = item.readAt ? item : await service.markAnnouncementRead(announcementId);
        if (!active) return;
        setAnnouncement(next);
        dispatchCustomerNotificationsChanged();
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Không tải được nội dung.");
      });
    return () => {
      active = false;
    };
  }, [announcementId, service]);

  if (error) {
    return <section className="notification-detail-state">{error}</section>;
  }
  if (announcement === undefined) {
    return <section className="notification-detail-state">Đang tải nội dung…</section>;
  }
  if (announcement === null) {
    return (
      <section className="notification-detail-state">
        <p>Không tìm thấy nội dung này.</p>
        <Link href="/news">Quay lại trung tâm thông báo</Link>
      </section>
    );
  }

  return (
    <article className="notification-detail">
      <Link className="notification-detail-back" href="/news">
        <ArrowLeft aria-hidden="true" size={18} />
        Tin tức &amp; thông báo
      </Link>

      <div className="notification-detail-icon">
        <Bell aria-hidden="true" size={25} />
      </div>
      <p className="eyebrow">Hưng Phát</p>
      <h1>{announcement.title}</h1>
      <time dateTime={announcement.publishedAt}>
        {dateFormatter.format(new Date(announcement.publishedAt))}
      </time>

      <div className="notification-detail-body">
        {announcement.body.split("\n\n").map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      {announcement.targetHref ? (
        <Link className="primary-button notification-detail-action" href={announcement.targetHref}>
          Mở nội dung liên quan
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
      ) : null}
    </article>
  );
}
