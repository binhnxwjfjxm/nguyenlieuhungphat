import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ClerkAuthProvider } from "@/components/clerk-auth-provider";
import { OneSignalProvider } from "@/components/onesignal-provider";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";
import "./clerk-auth.css";
import "./ui2.css";
import "./ui3.css";
import "./ui4.css";
import "./ui5.css";
import "./ui6.css";
import "./catalog-polish.css";
import "./experience-polish.css";
import "./product-grouping.css";
import "./home-category-icons.css";
import "./interaction-polish.css";
import "./ui-hotfix.css";

export const metadata: Metadata = {
  title: { default: "Hưng Phát Đặt Hàng", template: "%s | Hưng Phát" },
  description: "PWA đặt hàng dành cho khách hàng Hưng Phát.",
  applicationName: "Hưng Phát Đặt Hàng",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Hưng Phát" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, viewportFit: "cover", themeColor: "#198754" };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="vi"><body><ClerkAuthProvider><OneSignalProvider>{children}</OneSignalProvider></ClerkAuthProvider><ServiceWorkerRegistration /></body></html>;
}
