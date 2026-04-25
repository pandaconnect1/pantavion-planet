import type { MetadataRoute } from "next";
import { allPublicPaths } from "@/core/public/pantavion-public-surfaces";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://pantavion-planet.vercel.app";
  const now = new Date();

  return allPublicPaths.map((path) => ({
    url: new URL(path, site).toString(),
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
