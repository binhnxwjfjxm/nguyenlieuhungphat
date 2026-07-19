import Image from "next/image";

export function Logo() {
  return (
    <a className="brand" href="#trang-chu" aria-label="Hưng Phát - về trang chủ">
      <Image src="/images/logo-mark.svg" alt="" width={44} height={44} priority />
      <span className="brand-copy">
        <strong>HƯNG PHÁT</strong>
        <small>NGUYÊN LIỆU CHẤT LƯỢNG</small>
      </span>
    </a>
  );
}
