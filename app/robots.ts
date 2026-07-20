import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/admin/",
        "/professional/infrastructure/water/admin",
        "/professional/infrastructure/water/admin/",
        "/professional/infrastructure/water/mobile-founder",
        "/professional/infrastructure/water/master",
        "/professional/infrastructure/water/master/",
      ],
    },
    sitemap: "https://www.pantavion.com/sitemap.xml",
  };
}
