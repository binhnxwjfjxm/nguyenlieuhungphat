"use client";

import { Home, Newspaper, PackageSearch, UserRound } from "lucide-react";
import { HapticLink } from "./haptic-link";

const items = [
  { label: "Trang chủ", href: "#trang-chu", icon: Home },
  { label: "Sản phẩm", href: "#san-pham", icon: PackageSearch },
  { label: "Tin tức", href: "#tin-tuc", icon: Newspaper },
  { label: "Tài khoản", href: "#lien-he", icon: UserRound },
];

export function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav" aria-label="Điều hướng nhanh trên điện thoại">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <HapticLink className={index === 0 ? "active" : ""} href={item.href} key={item.label}>
            <Icon size={20} />
            <span>{item.label}</span>
          </HapticLink>
        );
      })}
    </nav>
  );
}
