"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Bell, ClipboardList, Home, LayoutGrid, ShoppingCart, UserRound } from "lucide-react";
import { CartBadge } from "@/components/cart-badge";
import { CustomerAuthGate } from "@/components/customer-auth-gate";

const navigation = [
  { href: "/", label: "Trang chủ", icon: Home, emphasized: false },
  { href: "/products", label: "Sản phẩm", icon: LayoutGrid, emphasized: false },
  { href: "/quick-order", label: "Đặt nhanh", icon: ShoppingCart, emphasized: true },
  { href: "/orders", label: "Đơn hàng", icon: ClipboardList, emphasized: false },
  { href: "/account", label: "Tài khoản", icon: UserRound, emphasized: false },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children, title }: Readonly<{ children: ReactNode; title?: string }>) {
  const pathname = usePathname();

  return (
    <CustomerAuthGate>
      <div className="app-frame">
        <header className="app-header">
          <Link className="brand-link" href="/" aria-label="Về trang chủ Hưng Phát">
            <Image
              alt="Logo Công ty Hưng Phát"
              className="brand-logo"
              height={52}
              priority
              src="/logo-transparent.png"
              width={132}
            />
          </Link>
          {title ? <strong className="app-header-title">{title}</strong> : <span />}
          <div className="header-actions">
            <Link className="icon-button" href="/news" aria-label="Thông báo">
              <Bell aria-hidden="true" size={20} strokeWidth={1.8} />
              <span className="notification-dot" />
            </Link>
            <CartBadge />
          </div>
        </header>

        <main className="app-content">{children}</main>

        <nav className="bottom-navigation" aria-label="Điều hướng chính">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={[
                  "bottom-navigation-item",
                  active ? "is-active" : "",
                  item.emphasized ? "is-emphasized" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                href={item.href}
                key={item.href}
              >
                <span className="bottom-navigation-icon">
                  <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </CustomerAuthGate>
  );
}
