import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link className="brand" href="/" aria-label="Hưng Phát - về trang chủ">
      <Image src="/logo-transparent.png" alt="" width={56} height={56} priority />
      <span className="brand-copy">
        <strong>HƯNG PHÁT</strong>
        <small>NGUYÊN LIỆU CHẤT LƯỢNG</small>
      </span>
    </Link>
  );
}
