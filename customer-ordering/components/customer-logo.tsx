"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

const DEFAULT_R2_LOGO_URL = "https://pub-7d2987fab97d4e3ebb2021a823973862.r2.dev/app-customer/image-system/logo-app-customer.png";
const CUSTOMER_LOGO_FALLBACK = "/logo-transparent.png";

export function CustomerLogo({
  className,
  height,
  priority = false,
  width,
}: Readonly<{ className: string; height: number; priority?: boolean; width: number }>) {
  const sources = useMemo(() => {
    const configured = process.env.NEXT_PUBLIC_CUSTOMER_LOGO_URL?.trim();
    return [...new Set([configured, DEFAULT_R2_LOGO_URL, CUSTOMER_LOGO_FALLBACK].filter((value): value is string => Boolean(value)))];
  }, []);
  const [sourceIndex, setSourceIndex] = useState(0);
  const source = sources[sourceIndex] ?? CUSTOMER_LOGO_FALLBACK;
  const remote = source.startsWith("https://");

  return (
    <Image
      alt="Logo Công ty Hưng Phát"
      className={className}
      height={height}
      onError={() => setSourceIndex((current) => Math.min(current + 1, sources.length - 1))}
      priority={priority}
      src={source}
      unoptimized={remote}
      width={width}
    />
  );
}
