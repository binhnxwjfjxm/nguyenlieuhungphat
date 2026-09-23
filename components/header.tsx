"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { navigation } from "@/data/site";
import { HapticLink } from "./haptic-link";
import { Logo } from "./logo";

export function Header() {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButtonRef.current?.focus();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />

        <nav className="desktop-nav" aria-label="Điều hướng chính">
          {navigation.map((item) => (
            <HapticLink key={item.href} className="desktop-nav-link" href={item.href}>
              {item.label}
            </HapticLink>
          ))}
        </nav>

        <div className="desktop-actions">
          <HapticLink className="icon-button" href="/san-pham" aria-label="Tìm trong danh mục">
            <Search size={18} />
          </HapticLink>
          <HapticLink className="button button-primary header-contact-button" href="/lien-he">
            Liên hệ
          </HapticLink>
        </div>

        <div className="mobile-actions">
          <HapticLink className="icon-button" href="/san-pham" aria-label="Tìm trong danh mục">
            <Search size={19} />
          </HapticLink>
          <button
            ref={menuButtonRef}
            className="icon-button"
            type="button"
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-expanded={open}
            aria-controls="mobile-primary-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="mobile-menu"
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <nav id="mobile-primary-navigation" className="container mobile-menu-nav" aria-label="Điều hướng di động">
              {navigation.map((item) => (
                <HapticLink
                  key={item.href}
                  className="mobile-menu-link"
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </HapticLink>
              ))}
              <HapticLink
                className="button button-primary mobile-contact-button"
                href="/lien-he"
                onClick={() => setOpen(false)}
              >
                Liên hệ Công Ty
              </HapticLink>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
