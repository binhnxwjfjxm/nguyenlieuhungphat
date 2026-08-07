"use client";

import Link from "next/link";
import { ChevronRight, Newspaper } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createCustomerOrderingService } from "@/lib/customer-ordering-service";
import type { Announcement } from "@/lib/contracts";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export function HomeAnnouncementPreview() {
  const service = useMemo(() => createCustomerOrderingService(), []);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void service.listAnnouncements()
      .then((items) => {
        if (!active) return;
        setAnnouncement(items.find((item) => item.kind === "promotion" || item.kind === "company") ?? null);
        setLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setLoaded(true);
      });
    return () => { active = false; };
  }, [service]);

  if (!loaded) {
    return <section aria-label="Đang tải sự kiện mới nhất" className="content-section home-news-section"><div className="home-news-preview-card is-loading" /></section>;
  }
  if (!announcement) return null;

  const label = announcement.kind === "promotion" ? "Chương trình" : "Tin Hưng Phát";

  return <section className="content-section home-news-section">
    <div className="section-heading"><h2>Sự kiện & tin tức</h2><Link href="/news">Xem tất cả <ChevronRight aria-hidden="true" size={16} /></Link></div>
    <Link className="home-news-preview-card" href={`/news/${announcement.id}`}>
      <span aria-hidden="true" className="home-news-preview-visual"><Newspaper size={28} /></span>
      <span className="home-news-preview-copy">
        <span className="home-news-preview-meta"><span>{label}</span><time dateTime={announcement.publishedAt}>{dateFormatter.format(new Date(announcement.publishedAt))}</time></span>
        <strong>{announcement.title}</strong>
        <span className="home-news-preview-action">Xem chi tiết</span>
      </span>
      <ChevronRight aria-hidden="true" className="home-news-preview-chevron" size={20} />
    </Link>
  </section>;
}
