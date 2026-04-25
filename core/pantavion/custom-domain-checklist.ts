export const customDomainChecklist = {
  id: "custom-domain-checklist",
  title: "Custom Domain Checklist",
  status: "ready-after-route-stability",
  priority: "high",
  summary:
    "pantavion-planet.vercel.app is public testing. Serious launch requires pantavion.com or official Pantavion domain connected to Vercel.",
  gates: [
    "Confirm registrar account.",
    "Add pantavion.com and www.pantavion.com in Vercel project domains.",
    "Add DNS records exactly as Vercel instructs.",
    "Wait for SSL and domain Ready status.",
    "Set NEXT_PUBLIC_SITE_URL to production domain.",
    "Redeploy.",
    "Update Stripe business website.",
    "Add Google Search Console.",
    "Submit sitemap.",
    "Create canonical redirects if .net/.info also exist."
  ]
} as const;
