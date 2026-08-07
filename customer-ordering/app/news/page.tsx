import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { NotificationCenter } from "@/components/notification-center";
import { NotificationPreferences } from "@/components/notification-preferences";

export const metadata: Metadata = { title: "Tin tức & thông báo" };

export default function NewsPage() {
  return (
    <AppShell title="Thông báo">
      <NotificationCenter />
      <NotificationPreferences />
    </AppShell>
  );
}
