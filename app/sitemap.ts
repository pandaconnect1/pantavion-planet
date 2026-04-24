import type { MetadataRoute } from "next";
import { pantavionRoutes } from "@/core/platform/pantavion-registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://pantavion.com";

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/dashboard`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...pantavionRoutes.map((route) => ({
      url: `${base}${route.path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route.status === "live-foundation" ? 0.8 : 0.55,
    })),
  ];
}
