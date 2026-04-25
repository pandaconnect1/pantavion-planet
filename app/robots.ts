import type { MetadataRoute } from "next";
import { pantavionPrivateNoIndexRoutes } from "@/core/pantavion/public-indexing-policy";

const fallbackSiteUrl = "https://pantavion-planet.vercel.app";

function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || fallbackSiteUrl;

  try {
    return new URL(raw).origin;
  } catch {
    return fallbackSiteUrl;
  }
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...pantavionPrivateNoIndexRoutes]
      }
    ],
    sitemap: siteUrl + "/sitemap.xml",
    host: siteUrl
  };
}
