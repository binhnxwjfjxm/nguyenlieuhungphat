import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hưng Phát | Nguyên liệu chất lượng",
  description:
    "Công ty TNHH TM Nguyên Liệu Hưng Phát - nguồn nguyên liệu chất lượng, nền tảng cho phát triển bền vững.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f1e7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
