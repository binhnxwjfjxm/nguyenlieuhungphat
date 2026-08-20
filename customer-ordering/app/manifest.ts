import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hưng Phát Đặt Hàng",
    short_name: "Hưng Phát",
    description: "Ứng dụng đặt hàng dành cho khách hàng Hưng Phát.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F7F8F6",
    theme_color: "#198754",
    orientation: "portrait",
    lang: "vi",
    icons: [
      {
        src: "/icon-192-20260809.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-20260809.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512-20260820.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
