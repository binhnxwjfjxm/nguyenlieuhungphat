"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { navigation } from "@/data/site";
import { HapticLink } from "./haptic-link";
import { Logo } from "./logo";
import { QuoteButton } from "./quote-trigger";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />

        <nav className="desktop-nav" aria-label="Điều hướng chính">
          {navigation.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="desktop-actions">
          <HapticLink className="icon-button" href="/san-pham" aria-label="Tìm ngành hàng">
            <Search size={19} />
          </HapticLink>
          <QuoteButton className="button button-primary">Nhận báo giá</QuoteButton>
        </div>

        <div className="mobile-actions">
          <HapticLink className="icon-button" href="/san-pham" aria-label="Tìm ngành hàng">
            <Search size={20} />
          </HapticLink>
          <button
            className="icon-button"
            type="button"
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 1, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <nav className="container mobile-menu-nav" aria-label="Điều hướng di động">
              {navigation.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              ))}
              <QuoteButton className="button button-primary mobile-quote" onClick={() => setOpen(false)}>
                Nhận báo giá
              </QuoteButton>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
