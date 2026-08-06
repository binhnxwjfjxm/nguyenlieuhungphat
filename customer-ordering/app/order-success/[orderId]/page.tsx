import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { OrderSuccess } from "@/components/order-success";

export const metadata: Metadata = { title: "Đặt hàng thành công" };

export default async function OrderSuccessPage({
  params,
}: Readonly<{ params: Promise<{ orderId: string }> }>) {
  const { orderId } = await params;
  return (
    <AppShell title="Hoàn tất">
      <OrderSuccess orderId={orderId} />
    </AppShell>
  );
}
