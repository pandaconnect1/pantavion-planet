import type { MetadataRoute } from "next";

const siteUrl = "https://pantavion.com";

const routes = [
  "",
  "/sos",
  "/translate",
  "/panta-ai",
  "/life-connector",
  "/communication",
  "/advertise",
  "/newspaper",
  "/discovery",
  "/product-status",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
