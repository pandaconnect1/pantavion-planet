import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://pantavion-planet.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/adult-connect"],
    },
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
