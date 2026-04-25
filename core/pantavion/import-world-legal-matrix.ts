export const importWorldLegalMatrix = {
  id: "import-world-legal-matrix",
  title: "Import World Legal Matrix",
  status: "foundation",
  priority: "critical",
  summary:
    "Pantavion can win ground if users lawfully bring contacts, messages, emails and digital history into one ecosystem. This must be consent-first and provider-lawful.",
  gates: [
    "No password collection for third-party apps.",
    "No scraping private accounts.",
    "No hidden message extraction.",
    "Use official API, OAuth, device permission, user export upload, CSV, vCard, JSON or ZIP where lawful.",
    "Respect rights and freedoms of other people inside imported conversations.",
    "Allow disconnect, delete and export."
  ],
  lanes: [
    { source: "Phone contacts", method: "device permission / vCard / CSV", status: "allowed-with-consent" },
    { source: "Email accounts", method: "OAuth / IMAP where permitted / user export", status: "allowed-with-consent" },
    { source: "SMS/MMS", method: "mobile permission where OS and country allow", status: "restricted" },
    { source: "WhatsApp/Viber/Telegram/Signal/LINE/WeChat/etc.", method: "official API or user export only", status: "provider-dependent" },
    { source: "Facebook/Instagram/X/TikTok/LinkedIn/etc.", method: "official API, data export or handle linking", status: "provider-dependent" },
    { source: "Dating/adult apps", method: "manual link/export only with separate sensitive-data policy", status: "high-risk" },
    { source: "Business/work apps", method: "OAuth/API/export with company permission", status: "business-review" }
  ]
} as const;
