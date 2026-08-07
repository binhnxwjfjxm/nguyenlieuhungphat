import type { Metadata } from "next";
import { AnnouncementDetail } from "@/components/announcement-detail";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = { title: "Chi tiết thông báo" };

export default async function AnnouncementDetailPage({
  params,
}: Readonly<{ params: Promise<{ articleId: string }> }>) {
  const { articleId } = await params;
  return (
    <AppShell title="Thông báo">
      <AnnouncementDetail announcementId={articleId} />
    </AppShell>
  );
}
