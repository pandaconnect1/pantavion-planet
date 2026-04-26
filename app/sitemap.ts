import type { MetadataRoute } from "next";

const siteUrl = "https://pantavion-planet.vercel.app";

const publicRoutes = [
  {
    path: "/",
    priority: 1.0,
  },
  {
    path: "/readiness",
    priority: 0.8,
  },
  {
    path: "/architecture",
    priority: 0.8,
  },
  {
    path: "/kernel/audit",
    priority: 0.7,
  },
  {
    path: "/ai-feature-register",
    priority: 0.7,
  },
  {
    path: "/sos-interpreter",
    priority: 0.7,
  },
  {
    path: "/access-model",
    priority: 0.7,
  },
  {
    path: "/deep-audit",
    priority: 0.7,
  },
  {
    path: "/backend-claims",
    priority: 0.6,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: route.priority,
  }));
}
