import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { OrdersScreen } from "@/components/orders-screen";

export const metadata: Metadata = { title: "Đơn hàng" };

export default function OrdersPage() {
  return (
    <AppShell title="Đơn hàng">
      <OrdersScreen />
    </AppShell>
  );
}
