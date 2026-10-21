export const customDomainChecklist = {
  id: "custom-domain-checklist",
  title: "Custom Domain Checklist",
  status: "ready-after-route-stability",
  priority: "high",
  summary:
    "The production application is hosted on Render at pantavion-planet.onrender.com. Validate pantavion.com and www.pantavion.com against the Render service before declaring domain readiness.",
  gates: [
    "Confirm registrar account.",
    "Confirm pantavion.com and www.pantavion.com are registered on the Render production service.",
    "Validate registrar DNS records against Render custom domain requirements.",
    "Wait for SSL and domain Ready status.",
    "Set NEXT_PUBLIC_SITE_URL to production domain.",
    "Redeploy.",
    "Update Stripe business website.",
    "Add Google Search Console.",
    "Submit sitemap.",
    "Create canonical redirects if .net/.info also exist."
  ]
} as const;
