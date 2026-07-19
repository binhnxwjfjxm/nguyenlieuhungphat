import { CategorySection } from "@/components/category-section";
import { CompanyCapabilitySection } from "@/components/company-capability-section";
import { Hero } from "@/components/hero";
import { HomeStructuredData } from "@/components/home-structured-data";
import { ProductSection } from "@/components/product-section";
import { TrustSection } from "@/components/trust-section";

export default function HomePage() {
  return (
    <main>
      <HomeStructuredData />
      <Hero />
      <TrustSection />
      <CategorySection />
      <CompanyCapabilitySection />
      <ProductSection />
    </main>
  );
}
