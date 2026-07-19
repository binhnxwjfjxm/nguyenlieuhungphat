import { CategorySection } from "@/components/category-section";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ProductSection } from "@/components/product-section";
import { TrustSection } from "@/components/trust-section";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustSection />
        <CategorySection />
        <ProductSection />
      </main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}
