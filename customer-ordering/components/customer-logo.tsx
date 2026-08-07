import Image from "next/image";

const CUSTOMER_LOGO_SRC = "/logo-transparent.png";

export function CustomerLogo({
  className,
  height,
  priority = false,
  width,
}: Readonly<{ className: string; height: number; priority?: boolean; width: number }>) {
  return (
    <Image
      alt="Logo Công ty Hưng Phát"
      className={className}
      height={height}
      priority={priority}
      sizes={`${width}px`}
      src={CUSTOMER_LOGO_SRC}
      width={width}
    />
  );
}
