import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { CheckoutScreen } from "@/components/checkout-screen";

export const metadata: Metadata = { title: "Xác nhận đơn" };

export default function CheckoutPage() {
  return (
    <AppShell title="Xác nhận">
      <CheckoutScreen />
    </AppShell>
  );
}
