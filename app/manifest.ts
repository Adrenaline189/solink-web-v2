// app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const name = "Solink";
  const short_name = "Solink";
  const description = "Share bandwidth. Earn rewards.";
  const theme_color = "#0b1220";
  const background_color = "#0b1220";

  return {
    name,
    short_name,
    description,
    start_url: "/",
    display: "standalone",
    theme_color,
    background_color,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    scope: "/",
    id: "/",
  };
}
