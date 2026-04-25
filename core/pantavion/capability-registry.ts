export const capabilityRegistry = {
  id: "capability-registry",
  title: "Pantavion Capability Registry",
  status: "foundation",
  priority: "critical",
  summary:
    "All external tools, market patterns and AI abilities are converted into Pantavion-owned capability families, not copied as tool chaos.",
  gates: [
    "Every capability has a family, route, status, risk level and legal boundary.",
    "Every provider-heavy capability must be marked provider-required until connected.",
    "Every high-risk capability must route through safety, consent, jurisdiction and audit gates."
  ],
  families: [
    "AI Ask / Research / Write / Translate",
    "Build Apps / Websites / Automations",
    "Design / Image / Video / Cartoon / Voice / Music",
    "Messages / Secure Channels / Groups / Communities",
    "Import Contacts / Email / SMS / Chat Exports / Social Handles",
    "Marketplace / Listings / Ads Center / Business Directory",
    "Radio / Journalism / Sports / Culture / Emergency Broadcast",
    "Work / Office / Secretary / Documents / Proposals",
    "Learning / Culture / Education / Knowledge",
    "Elite / Private High-Trust Channels",
    "Adult 18+ Restricted - separate legal lane",
    "Safety / Reports / Minors / Abuse / Trust",
    "Finance Education - no regulated advice by default",
    "Health Information - no diagnosis by default",
    "Government / Public Services - verified channels only"
  ]
} as const;
