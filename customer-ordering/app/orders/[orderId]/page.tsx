import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { OrderDetail } from "@/components/order-detail";

export const metadata: Metadata = { title: "Chi tiết đơn hàng" };

export default async function OrderDetailPage({
  params,
}: Readonly<{ params: Promise<{ orderId: string }> }>) {
  const { orderId } = await params;
  return (
    <AppShell title="Chi tiết đơn">
      <OrderDetail orderId={orderId} />
    </AppShell>
  );
}
