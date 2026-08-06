import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { QuickOrder } from "@/components/quick-order";

export const metadata: Metadata = { title: "Đặt hàng nhanh" };

export default function QuickOrderPage() {
  return (
    <AppShell title="Đặt nhanh">
      <QuickOrder />
    </AppShell>
  );
}
