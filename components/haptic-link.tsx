"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, PropsWithChildren } from "react";

function vibrate() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(12);
  }
}

type HapticLinkProps = PropsWithChildren<
  LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>
>;

export function HapticLink({ children, onPointerDown, ...props }: HapticLinkProps) {
  return (
    <Link
      {...props}
      onPointerDown={(event) => {
        vibrate();
        onPointerDown?.(event);
      }}
    >
      {children}
    </Link>
  );
}
