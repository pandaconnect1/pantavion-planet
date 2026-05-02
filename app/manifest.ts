import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pantavion LifeShield Emergency System",
    short_name: "LifeShield",
    description:
      "Pantavion emergency layer for phones, tablets, desktops, PWA, offline identity, and truth-governed rescue workflows.",
    start_url: "/pantavion/emergency",
    scope: "/",
    display: "standalone",
    background_color: "#050816",
    theme_color: "#050816",
    orientation: "any",
    categories: ["utilities", "health", "safety", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
