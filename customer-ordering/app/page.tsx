import Link from "next/link";
import { BottomNavigation } from "@/components/bottom-navigation";

const quickLinks = [
  { href: "/products", label: "Sản phẩm", icon: "◉" },
  { href: "/quick-order", label: "Đặt nhanh", icon: "🛒" },
  { href: "/orders", label: "Đơn hàng", icon: "▣" },
  { href: "/news", label: "Tin tức", icon: "▤" },
];

const categories = [
  ["🥣", "Bột"],
  ["🧂", "Phụ gia"],
  ["◻️", "Đường"],
  ["🧴", "Dầu mỡ"],
  ["🌾", "Hương liệu"],
];

const products = [
  { name: "Bột mì đa dụng", price: "25.000 đ/kg", icon: "🥣" },
  { name: "Đường kính trắng", price: "18.000 đ/kg", icon: "🧂" },
];

export default function HomePage() {
  return (
    <main className="app-frame">
      <div className="content">
        <header className="header">
          <div>
            <p className="eyebrow">Xin chào,</p>
            <h1 className="title">Khách hàng</h1>
          </div>
          <button className="icon-button" aria-label="Thông báo">🔔</button>
        </header>

        <div className="search">⌕ <span>Tìm sản phẩm, danh mục...</span></div>

        <section className="hero">
          <h2>Nguyên liệu chất lượng<br />Cho món ngon trọn vị</h2>
          <p>Khám phá sản phẩm và chương trình mới nhất từ Hưng Phát.</p>
          <button type="button">Xem ngay</button>
        </section>

        <section className="quick-grid" aria-label="Lối tắt">
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href} className="quick-card">
              <span className="quick-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </section>

        <section>
          <div className="section-head">
            <h3>Danh mục nổi bật</h3>
            <Link href="/products">Xem tất cả</Link>
          </div>
          <div className="category-row">
            {categories.map(([icon, label]) => (
              <div className="category" key={label}>
                <span aria-hidden="true">{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="section-head">
            <h3>Sản phẩm bán chạy</h3>
            <Link href="/products">Xem tất cả</Link>
          </div>
          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.name}>
                <div className="product-visual" aria-hidden="true">{product.icon}</div>
                <div className="product-body">
                  <h4>{product.name}</h4>
                  <div className="price">{product.price}</div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
      <BottomNavigation />
    </main>
  );
}
