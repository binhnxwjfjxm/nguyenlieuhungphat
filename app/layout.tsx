import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Chatbot } from "@/components/chatbot";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { QuoteProvider } from "@/components/quote-provider";
import { ToastProvider } from "@/components/toast-provider";
import { getSiteUrl } from "@/lib/site";
import { siteAssets } from "@/lib/site-assets";
import "./globals.css";
import "./sprint2.css";
import "./sprint3.css";
import "./hung-phat-warm-gold.css";
import "./chatbot.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-be-vietnam-pro",
});

const siteUrl = getSiteUrl();
const siteTitle = "Hưng Phát | Nguyên liệu F&B, đông lạnh, ăn vặt và bao bì";
const siteDescription =
  "Hưng Phát thương mại và phân phối trà sữa & pha chế, mì cay, đông lạnh, ăn vặt, bao bì và gia vị & sốt cho cửa hàng, đại lý và đối tác kinh doanh.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | Hưng Phát",
  },
  description: siteDescription,
  keywords: [
    "nguyên liệu trà sữa",
    "nguyên liệu pha chế",
    "nguyên liệu mì cay",
    "hàng đông lạnh",
    "đồ ăn vặt",
    "bao bì F&B",
    "gia vị và sốt",
    "phân phối nguyên liệu Hưng Phát",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: siteUrl,
    siteName: "Hưng Phát",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: siteAssets.seo.og,
        width: 1200,
        height: 630,
        alt: "Hưng Phát - nguồn hàng F&B cho cửa hàng và đại lý",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [siteAssets.seo.og],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#754706",
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
            <Chatbot />
          </QuoteProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
