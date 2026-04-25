import type { MetadataRoute } from "next";
import { pantavionPublicIndexableRoutes } from "@/core/pantavion/public-indexing-policy";

const fallbackSiteUrl = "https://pantavion-planet.vercel.app";

function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || fallbackSiteUrl;

  try {
    return new URL(raw).origin;
  } catch {
    return fallbackSiteUrl;
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  return pantavionPublicIndexableRoutes.map((route) => ({
    url: siteUrl + route,
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : route === "/readiness" || route === "/deep-audit" ? 0.9 : 0.7
  }));
}
