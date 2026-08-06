"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Trang chủ", icon: "⌂" },
  { href: "/products", label: "Sản phẩm", icon: "◉" },
  { href: "/quick-order", label: "Đặt nhanh", icon: "🛒" },
  { href: "/orders", label: "Đơn hàng", icon: "▣" },
  { href: "/account", label: "Tài khoản", icon: "○" },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Điều hướng chính">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`nav-item${active ? " active" : ""}`}>
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
