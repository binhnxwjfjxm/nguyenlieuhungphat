import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ProductCatalog } from "@/components/product-catalog";

export const metadata: Metadata = { title: "Sản phẩm" };

export default function ProductsPage() {
  return (
    <AppShell title="Sản phẩm">
      <ProductCatalog />
    </AppShell>
  );
}
