import Link from "next/link";
import { ArrowRight, Boxes, ChevronRight, ClipboardList, Newspaper, PackageSearch, ShoppingBasket } from "lucide-react";

const categories = [
  { name: "Bột", emoji: "🌾" },
  { name: "Phụ gia", emoji: "🧪" },
  { name: "Đường", emoji: "◇" },
  { name: "Dầu mỡ", emoji: "🫙" },
  { name: "Hương liệu", emoji: "🍯" },
];

const products = [
  { code: "HP-BOT-001", name: "Bột mì đa dụng", detail: "Bao 25 kg", price: "25.000 đ/kg", tone: "wheat" },
  { code: "HP-DUONG-012", name: "Đường kính trắng", detail: "Bao 50 kg", price: "18.000 đ/kg", tone: "sugar" },
];

export function HomeScreen() {
  return (
    <div className="screen-stack">
      <section className="welcome-row">
        <div><p className="eyebrow">Xin chào,</p><h1>Khách hàng Hưng Phát</h1></div>
        <span className="status-pill">Mock UI</span>
      </section>

      <label className="search-field">
        <PackageSearch aria-hidden="true" size={19} />
        <input aria-label="Tìm sản phẩm và danh mục" placeholder="Tìm sản phẩm, danh mục..." />
      </label>

      <section className="hero-card">
        <div className="hero-copy">
          <span className="hero-kicker">Nguyên liệu chất lượng</span>
          <h2>Cho món ngon trọn vị</h2>
          <Link className="hero-button" href="/products">Xem ngay <ArrowRight aria-hidden="true" size={16} /></Link>
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <span className="bottle bottle-one" /><span className="bottle bottle-two" />
          <span className="grain grain-one" /><span className="grain grain-two" />
        </div>
      </section>

      <section className="quick-actions" aria-label="Truy cập nhanh">
        <Link href="/products"><Boxes aria-hidden="true" /><span>Sản phẩm</span></Link>
        <Link href="/quick-order"><ShoppingBasket aria-hidden="true" /><span>Đặt nhanh</span></Link>
        <Link href="/orders"><ClipboardList aria-hidden="true" /><span>Đơn hàng</span></Link>
        <Link href="/news"><Newspaper aria-hidden="true" /><span>Tin tức</span></Link>
      </section>

      <section className="content-section">
        <div className="section-heading"><h2>Danh mục nổi bật</h2><Link href="/products">Xem tất cả <ChevronRight aria-hidden="true" size={16} /></Link></div>
        <div className="category-scroller">
          {categories.map((category) => <button className="category-chip" key={category.name} type="button"><span aria-hidden="true">{category.emoji}</span>{category.name}</button>)}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading"><h2>Sản phẩm bán chạy</h2><Link href="/products">Xem tất cả <ChevronRight aria-hidden="true" size={16} /></Link></div>
        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.code}>
              <div className={`product-visual ${product.tone}`} aria-hidden="true"><span className="product-bag" /></div>
              <div className="product-card-body"><span className="product-code">{product.code}</span><h3>{product.name}</h3><p>{product.detail}</p><strong>{product.price}</strong></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
