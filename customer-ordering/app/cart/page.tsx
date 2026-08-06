import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { CartScreen } from "@/components/cart-screen";

export const metadata: Metadata = { title: "Giỏ hàng" };

export default function CartPage() {
  return (
    <AppShell title="Giỏ hàng">
      <CartScreen />
    </AppShell>
  );
}
