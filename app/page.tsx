import { CategorySection } from "@/components/category-section";
import { Hero } from "@/components/hero";
import { ProductSection } from "@/components/product-section";
import { TrustSection } from "@/components/trust-section";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <TrustSection />
      <CategorySection />
      <ProductSection />
    </main>
  );
}
