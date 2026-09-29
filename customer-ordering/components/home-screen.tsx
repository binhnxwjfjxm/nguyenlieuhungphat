import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Boxes, ChevronRight, ClipboardList, MessageCircleQuestion, PackageSearch, ShoppingBasket } from "lucide-react";
import { ManagedHomeBanner } from "@/components/managed-home-banner";
import { MOCK_CATEGORIES } from "@/lib/adapters/mock/mock-catalog";
import { sortCustomerCategories } from "@/lib/category-order";
import styles from "./home-screen.module.css";

const R2_IMAGE_BASE = "https://pub-7d2987fab97d4e3ebb2021a823973862.r2.dev/app-customer/image-system";
const HERO_IMAGE_URL = `${R2_IMAGE_BASE}/hero-app-customer.jpg`;
const CATEGORY_ICON_BY_ID: Readonly<Record<string, string>> = {
  "milk-tea": `${R2_IMAGE_BASE}/icon-tra-sua.webp`,
  "spicy-noodle": `${R2_IMAGE_BASE}/icon-mi-cay.webp`,
  frozen: `${R2_IMAGE_BASE}/icon-dong-lanh.webp`,
  snacks: `${R2_IMAGE_BASE}/icon-an-vat.webp`,
  packaging: `${R2_IMAGE_BASE}/icon-bao-bi.webp`,
  "sauce-seasoning": `${R2_IMAGE_BASE}/icon-gia-vi.webp`,
};


export function HomeScreen() {
  const categories = sortCustomerCategories(MOCK_CATEGORIES);

  return (
    <div className="screen-stack home-depth-stack">
      <Link className="search-field home-search-link" href="/products">
        <PackageSearch aria-hidden="true" size={19} />
        <span>Tìm sản phẩm theo tên hoặc nhãn</span>
      </Link>

      <section className="hero-card hero-card-r2">
        <Image alt="Nguyên liệu Hưng Phát" className="hero-r2-image" fill priority sizes="(max-width: 520px) calc(100vw - 36px), 484px" src={HERO_IMAGE_URL} unoptimized />
        <span aria-hidden="true" className="hero-r2-shade" />
        <div className="hero-copy"><span className="hero-kicker">Nguyên liệu chất lượng</span><h2>Cho món ngon trọn vị</h2><Link className="hero-button" href="/products">Xem sản phẩm <ArrowRight aria-hidden="true" size={16} /></Link></div>
      </section>

      <section className="quick-actions" aria-label="Truy cập nhanh">
        <Link href="/products"><Boxes aria-hidden="true" /><span>Sản phẩm</span></Link>
        <Link href="/quick-order"><ShoppingBasket aria-hidden="true" /><span>Đặt nhanh</span></Link>
        <Link href="/orders"><ClipboardList aria-hidden="true" /><span>Đơn hàng</span></Link>
        <Link aria-label="Hỏi Hưng Phát" className={styles.assistantAction} href="/assistant"><MessageCircleQuestion aria-hidden="true" /><span>Hỏi Hưng Phát</span></Link>
      </section>

      <section className="content-section home-category-section"><div className="section-heading"><h2>Ngành hàng</h2><Link href="/products">Xem tất cả <ChevronRight aria-hidden="true" size={16} /></Link></div><div className="category-scroller">{categories.map((category) => {
        const iconUrl = CATEGORY_ICON_BY_ID[category.id];
        return <Link className="category-chip home-category-card" href={`/products?category=${encodeURIComponent(category.id)}`} key={category.id}>
          {iconUrl ? <Image alt="" aria-hidden="true" className="home-category-image" fill sizes="82px" src={iconUrl} unoptimized /> : null}
          <span className="home-category-label">{category.shortName}</span>
        </Link>;
      })}</div></section>

      <ManagedHomeBanner />
    </div>
  );
}
