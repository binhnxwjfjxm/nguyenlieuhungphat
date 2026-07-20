import { CategorySection } from "@/components/category-section";
import { AudienceSection } from "@/components/audience-section";
import { CompanyCapabilitySection } from "@/components/company-capability-section";
import { Hero } from "@/components/hero";
import { HomeStructuredData } from "@/components/home-structured-data";
import { ProductSection } from "@/components/product-section";
import { ProcessSection } from "@/components/process-section";
import { TrustSection } from "@/components/trust-section";
import { QuoteCta } from "@/components/quote-cta";

export default function HomePage() {
  return (
    <main>
      <HomeStructuredData />
      <Hero />
      <TrustSection />
      <CategorySection />
      <ProductSection />
      <AudienceSection />
      <CompanyCapabilitySection />
      <ProcessSection />
      <QuoteCta />
    </main>
  );
}
