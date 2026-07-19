import type { Metadata, Viewport } from "next";
import { Chatbot } from "@/components/chatbot";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { QuoteProvider } from "@/components/quote-provider";
import { ToastProvider } from "@/components/toast-provider";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";
import "./sprint2.css";
import "./sprint3.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Hưng Phát | Nguyên liệu chất lượng",
    template: "%s | Hưng Phát",
  },
  description:
    "Công ty TNHH TM Nguyên Liệu Hưng Phát cung ứng nguyên liệu công nghiệp, thực phẩm, hóa chất và phụ gia cho doanh nghiệp.",
  keywords: [
    "nguyên liệu Hưng Phát",
    "nguyên liệu công nghiệp",
    "hóa chất phụ gia",
    "nguyên liệu thực phẩm",
    "báo giá nguyên liệu",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: siteUrl,
    siteName: "Nguyên Liệu Hưng Phát",
    title: "Hưng Phát | Nguyên liệu chất lượng",
    description: "Nguồn nguyên liệu chất lượng, nền tảng cho phát triển bền vững.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hưng Phát | Nguyên liệu chất lượng",
    description: "Nguồn nguyên liệu chất lượng, nền tảng cho phát triển bền vững.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f1e7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <ToastProvider>
          <QuoteProvider>
            <Header />
            {children}
            <Footer />
            <MobileBottomNav />
            <Chatbot />
          </QuoteProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
