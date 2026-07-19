import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Chatbot } from "@/components/chatbot";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { QuoteProvider } from "@/components/quote-provider";
import { ToastProvider } from "@/components/toast-provider";
import { getSiteUrl } from "@/lib/site";
import { siteAssets } from "@/lib/site-assets";
import "./globals.css";
import "./sprint2.css";
import "./sprint3.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-be-vietnam-pro",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Hưng Phát | Nguyên liệu pha chế, mì cay và hàng đông lạnh",
    template: "%s | Hưng Phát",
  },
  description:
    "Hưng Phát chuyên thương mại và phân phối nguyên liệu pha chế, nguyên liệu mì cay và hàng đông lạnh cho cửa hàng, đại lý và đối tác kinh doanh.",
  keywords: [
    "nguyên liệu pha chế",
    "nguyên liệu mì cay",
    "hàng đông lạnh",
    "nguyên liệu quán ăn",
    "nguyên liệu quán trà sữa",
    "phân phối nguyên liệu Hưng Phát",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: siteUrl,
    siteName: "Hưng Phát",
    title: "Hưng Phát | Nguyên liệu pha chế, mì cay và hàng đông lạnh",
    description:
      "Hưng Phát chuyên thương mại và phân phối nguyên liệu pha chế, nguyên liệu mì cay và hàng đông lạnh cho cửa hàng, đại lý và đối tác kinh doanh.",
    images: [
      {
        url: siteAssets.seo.og,
        width: 1200,
        height: 630,
        alt: "Hưng Phát - Nguyên liệu pha chế, mì cay và hàng đông lạnh",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hưng Phát | Nguyên liệu pha chế, mì cay và hàng đông lạnh",
    description:
      "Hưng Phát chuyên thương mại và phân phối nguyên liệu pha chế, nguyên liệu mì cay và hàng đông lạnh cho cửa hàng, đại lý và đối tác kinh doanh.",
    images: [siteAssets.seo.og],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f1e7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
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
