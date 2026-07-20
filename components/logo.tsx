import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link className="brand" href="/" aria-label="Hưng Phát - về trang chủ">
      <Image src="/logo.jpg" alt="" width={44} height={44} priority />
      <span className="brand-copy">
        <strong>HƯNG PHÁT</strong>
        <small>NGUYÊN LIỆU CHẤT LƯỢNG</small>
      </span>
    </Link>
  );
}
