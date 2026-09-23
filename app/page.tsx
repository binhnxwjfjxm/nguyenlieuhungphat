import { BrandSection } from "@/components/brand-section";
import { CategorySection } from "@/components/category-section";
import { CompanyCapabilitySection } from "@/components/company-capability-section";
import { CompanyContactCta } from "@/components/company-contact-cta";
import { Hero } from "@/components/hero";
import { HomeGuideSection } from "@/components/home-guide-section";
import { HomeStructuredData } from "@/components/home-structured-data";

export default function HomePage() {
  return (
    <main className="home-page">
      <HomeStructuredData />
      <Hero />
      <CategorySection />
      <BrandSection />
      <CompanyCapabilitySection />
      <HomeGuideSection />
      <CompanyContactCta />
    </main>
  );
}
