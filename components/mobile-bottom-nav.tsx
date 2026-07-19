"use client";

import { Home, MessageCircleMore, PackageSearch, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { HapticLink } from "./haptic-link";

const items = [
  { label: "Trang chủ", href: "/", icon: Home },
  { label: "Sản phẩm", href: "/san-pham", icon: PackageSearch },
  { label: "Báo giá", href: "/#bao-gia", icon: MessageCircleMore },
  { label: "Liên hệ", href: "/#lien-he", icon: UserRound },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav" aria-label="Điều hướng nhanh trên điện thoại">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <HapticLink className={active ? "active" : ""} href={item.href} key={item.label}>
            <Icon size={20} />
            <span>{item.label}</span>
          </HapticLink>
        );
      })}
    </nav>
  );
}
