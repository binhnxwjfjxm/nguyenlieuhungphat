"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { CART_UPDATED_EVENT } from "@/lib/cart-events";

const SCREEN_SELECTOR = ".app-content";
const CART_TARGET_SELECTOR = ".header-cart-status";
const PRODUCT_VISUAL_SELECTOR = ".catalog-product-visual";
const PRODUCT_SHELL_SELECTOR = ".catalog-product-card, .product-quick-view";
const PRODUCT_ADD_SELECTOR = ".catalog-add-icon, .product-quick-view-add";
const SHEET_BACKDROP_SELECTOR = ".product-quick-view-backdrop";
const SHEET_SELECTOR = ".product-quick-view";
const SHEET_CLOSE_SELECTOR = ".product-quick-view-close";

function reducedMotionEnabled(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function cssMilliseconds(token: string, fallback: number): number {
  const raw = window.getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cssEasing(token: string, fallback: string): string {
  return window.getComputedStyle(document.documentElement).getPropertyValue(token).trim() || fallback;
}

function animateScreenEntry(): void {
  if (reducedMotionEnabled()) return;
  const screen = document.querySelector<HTMLElement>(SCREEN_SELECTOR);
  if (!screen) return;
  screen.animate(
    [
      { opacity: 0.86, transform: "translate3d(0, 4px, 0)" },
      { opacity: 1, transform: "translate3d(0, 0, 0)" },
    ],
    {
      duration: cssMilliseconds("--hp-motion-screen-duration", 160),
      easing: cssEasing("--hp-motion-ease-enter", "cubic-bezier(0.22, 0.61, 0.36, 1)"),
    },
  );
}

function animateCartBump(): void {
  if (reducedMotionEnabled()) return;
  const cart = document.querySelector<HTMLElement>(CART_TARGET_SELECTOR);
  if (!cart) return;
  cart.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.11)", offset: 0.42 },
      { transform: "scale(0.985)", offset: 0.72 },
      { transform: "scale(1)" },
    ],
    {
      duration: cssMilliseconds("--hp-motion-cart-bump-duration", 180),
      easing: cssEasing("--hp-motion-ease-action", "ease-out"),
    },
  );
}

function animateProductToCart(origin: HTMLElement): void {
  if (reducedMotionEnabled()) return;
  const productShell = origin.closest<HTMLElement>(PRODUCT_SHELL_SELECTOR);
  const visual = productShell?.querySelector<HTMLElement>(PRODUCT_VISUAL_SELECTOR);
  const cart = document.querySelector<HTMLElement>(CART_TARGET_SELECTOR);
  if (!visual || !cart) return;

  const sourceRect = visual.getBoundingClientRect();
  const targetRect = cart.getBoundingClientRect();
  if (sourceRect.width <= 0 || sourceRect.height <= 0 || targetRect.width <= 0 || targetRect.height <= 0) return;

  const clone = visual.cloneNode(true) as HTMLElement;
  clone.setAttribute("aria-hidden", "true");
  clone.classList.add("hp-cart-flight");
  Object.assign(clone.style, {
    position: "fixed",
    zIndex: "9999",
    left: `${sourceRect.left}px`,
    top: `${sourceRect.top}px`,
    width: `${sourceRect.width}px`,
    height: `${sourceRect.height}px`,
    margin: "0",
    pointerEvents: "none",
    transformOrigin: "center center",
    willChange: "transform, opacity",
  });
  document.body.append(clone);

  const sourceCenterX = sourceRect.left + sourceRect.width / 2;
  const sourceCenterY = sourceRect.top + sourceRect.height / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;
  const deltaX = targetCenterX - sourceCenterX;
  const deltaY = targetCenterY - sourceCenterY;

  const animation = clone.animate(
    [
      { opacity: 0.98, transform: "translate3d(0, 0, 0) scale(0.76)", offset: 0 },
      { opacity: 1, transform: `translate3d(${deltaX * 0.30}px, ${deltaY * 0.18 - 30}px, 0) scale(0.60)`, offset: 0.38 },
      { opacity: 0.9, transform: `translate3d(${deltaX * 0.72}px, ${deltaY * 0.64 - 16}px, 0) scale(0.36)`, offset: 0.76 },
      { opacity: 0.18, transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.14)`, offset: 1 },
    ],
    {
      duration: cssMilliseconds("--hp-motion-cart-flight-duration", 280),
      easing: cssEasing("--hp-motion-ease-cart", "cubic-bezier(0.2, 0.78, 0.2, 1)"),
    },
  );

  const removeClone = () => clone.remove();
  animation.addEventListener("finish", removeClone, { once: true });
  animation.addEventListener("cancel", removeClone, { once: true });
}

function animateSheetIn(backdrop: HTMLElement): void {
  if (reducedMotionEnabled()) return;
  const sheet = backdrop.querySelector<HTMLElement>(SHEET_SELECTOR);
  const easing = cssEasing("--hp-motion-ease-enter", "cubic-bezier(0.22, 0.61, 0.36, 1)");
  backdrop.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: cssMilliseconds("--hp-motion-backdrop-duration", 140),
    easing,
  });
  sheet?.animate(
    [
      { opacity: 0.88, transform: "translate3d(0, 28px, 0) scale(0.992)" },
      { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
    ],
    {
      duration: cssMilliseconds("--hp-motion-sheet-duration", 220),
      easing,
    },
  );
}

function animateSheetOut(backdrop: HTMLElement): number {
  const duration = cssMilliseconds("--hp-motion-sheet-exit-duration", 170);
  const easing = cssEasing("--hp-motion-ease-action", "ease-out");
  const sheet = backdrop.querySelector<HTMLElement>(SHEET_SELECTOR);
  backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing, fill: "forwards" });
  sheet?.animate(
    [
      { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
      { opacity: 0.92, transform: "translate3d(0, 18px, 0) scale(0.996)" },
    ],
    { duration, easing, fill: "forwards" },
  );
  return duration;
}

function animateAddedBackdrops(node: Node): void {
  if (!(node instanceof Element)) return;
  if (node.matches(SHEET_BACKDROP_SELECTOR)) animateSheetIn(node as HTMLElement);
  node.querySelectorAll<HTMLElement>(SHEET_BACKDROP_SELECTOR).forEach(animateSheetIn);
}

export function MobileMotionProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const frame = window.requestAnimationFrame(animateScreenEntry);
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    let bypassClickTarget: HTMLElement | null = null;
    let bypassEscape = false;
    let closeInProgress = false;

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach(animateAddedBackdrops);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const addControl = target.closest<HTMLElement>(PRODUCT_ADD_SELECTOR);
      if (addControl) {
        if (!addControl.matches(":disabled")) animateProductToCart(addControl);
        return;
      }

      if (reducedMotionEnabled()) return;
      const backdrop = document.querySelector<HTMLElement>(SHEET_BACKDROP_SELECTOR);
      if (!backdrop) return;
      const closeControl = target.closest<HTMLElement>(SHEET_CLOSE_SELECTOR);
      const clickedBackdrop = target === backdrop;
      if (!closeControl && !clickedBackdrop) return;
      const control = closeControl ?? backdrop;

      if (bypassClickTarget === control) {
        bypassClickTarget = null;
        return;
      }
      if (closeInProgress) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      closeInProgress = true;
      const duration = animateSheetOut(backdrop);
      window.setTimeout(() => {
        closeInProgress = false;
        if (!control.isConnected) return;
        bypassClickTarget = control;
        control.click();
      }, duration);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || reducedMotionEnabled()) return;
      const backdrop = document.querySelector<HTMLElement>(SHEET_BACKDROP_SELECTOR);
      if (!backdrop) return;
      if (bypassEscape) {
        bypassEscape = false;
        return;
      }
      if (closeInProgress) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      closeInProgress = true;
      const duration = animateSheetOut(backdrop);
      window.setTimeout(() => {
        closeInProgress = false;
        bypassEscape = true;
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
      }, duration);
    };

    const handleCartUpdated = () => animateCartBump();

    document.addEventListener("click", handleClick, true);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
      document.querySelectorAll(".hp-cart-flight").forEach((node) => node.remove());
    };
  }, []);

  return null;
}
