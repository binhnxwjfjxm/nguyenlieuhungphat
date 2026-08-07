import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ProductCatalog } from "@/components/product-catalog";
import { CUSTOMER_CATEGORY_PRIORITY } from "@/lib/category-order";

export const metadata: Metadata = { title: "Sản phẩm" };

type ProductsPageProps = {
  searchParams: Promise<{ category?: string | string[] }>;
};

export default async function ProductsPage({ searchParams }: Readonly<ProductsPageProps>) {
  const params = await searchParams;
  const requestedCategory = typeof params.category === "string" ? params.category : null;
  const initialCategoryId = requestedCategory && CUSTOMER_CATEGORY_PRIORITY.includes(requestedCategory as (typeof CUSTOMER_CATEGORY_PRIORITY)[number])
    ? requestedCategory
    : null;

  return (
    <AppShell title="Sản phẩm">
      <ProductCatalog initialCategoryId={initialCategoryId} />
    </AppShell>
  );
}
