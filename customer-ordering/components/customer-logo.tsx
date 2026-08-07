"use client";

import Image from "next/image";
import { useState } from "react";

const CUSTOMER_LOGO_R2_URL = "https://pub-7d2987fab97d4e3ebb2021a823973862.r2.dev/app-customer/image-system/logo-app-customer.png";
const CUSTOMER_LOGO_FALLBACK = "/logo-transparent.png";

export function CustomerLogo({
  className,
  height,
  priority = false,
  width,
}: Readonly<{ className: string; height: number; priority?: boolean; width: number }>) {
  const [source, setSource] = useState(CUSTOMER_LOGO_R2_URL);
  const remote = source.startsWith("https://");

  return (
    <Image
      alt="Logo Công ty Hưng Phát"
      className={className}
      height={height}
      onError={() => {
        if (source !== CUSTOMER_LOGO_FALLBACK) setSource(CUSTOMER_LOGO_FALLBACK);
      }}
      priority={priority}
      src={source}
      unoptimized={remote}
      width={width}
    />
  );
}
