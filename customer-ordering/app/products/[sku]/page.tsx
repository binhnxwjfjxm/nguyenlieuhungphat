import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ProductDetail } from "@/components/product-detail";

export const metadata: Metadata = { title: "Chi tiết sản phẩm" };

export default async function ProductDetailPage({ params }: Readonly<{ params: Promise<{ sku: string }> }>) {
  const { sku } = await params;
  return <AppShell title="Chi tiết"><ProductDetail sku={sku} /></AppShell>;
}
