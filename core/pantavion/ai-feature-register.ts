export const pantavionAiFeatureRegister = {
  id: "pantavion-ai-feature-register",
  title: "Pantavion AI Feature Register",
  status: "mandatory-foundation",
  priority: "critical",
  summary:
    "AI inside Pantavion is not a generic bot. It is a governed system of AI capabilities by module, user role, risk zone, fallback path, accountability state and release gate.",
  supremeRule:
    "No AI feature may enter Pantavion uncontrolled, unclassified, unbounded or silent.",
  zones: [
    {
      key: "green",
      name: "Green Zone",
      risk: "low",
      rule:
        "AI may operate automatically where risk is low, with user control, correction, undo or regeneration where relevant.",
      examples: [
        "translation",
        "spell correction",
        "summaries",
        "tagging",
        "categorization",
        "writing assistance",
        "semantic search",
        "voice transcription",
        "UI assistance"
      ]
    },
    {
      key: "yellow",
      name: "Yellow Zone",
      risk: "medium",
      rule:
        "AI may suggest, rank, flag or filter, but must not silently make final critical judgments.",
      examples: [
        "content ranking",
        "friend/professional suggestions",
        "credibility hints",
        "moderation assistance",
        "sports analysis",
        "journalist research assist",
        "trend detection",
        "fraud and spam signals"
      ]
    },
    {
      key: "red",
      name: "Red Zone",
      risk: "high",
      rule:
        "AI must not decide alone. It may detect, assist, alert, draft, recommend or escalate, but human/professional/institutional control remains required.",
      examples: [
        "SOS logic",
        "minors safety",
        "identity-risk judgments",
        "serious allegations",
        "war/conflict verification",
        "bans",
        "legal/medical-sensitive outputs",
        "public safety alerts",
        "adult restricted safety",
        "elite security decisions"
      ]
    }
  ],
  moduleRegister: [
    "Pulse / News / Media",
    "Sports",
    "Messages & Global Communication",
    "Language / Translation / Voice",
    "PantaAI Execution Center",
    "Marketplace / Ads / Listings",
    "Creator Studio / Media / Radio",
    "Work / Services / Build Services",
    "Safety / Law / Identity / Minors",
    "SOS / Emergency / Off-grid",
    "Import My World",
    "Elite Secure Environments",
    "Adult Restricted 18+",
    "Competitive Intelligence Layer"
  ],
  globalRequirements: [
    "Every AI feature has module owner.",
    "Every AI feature has user benefit.",
    "Every AI feature has risk zone.",
    "Every AI feature has allowed and blocked actions.",
    "Every AI feature has fallback.",
    "Every AI feature has logging/accountability status.",
    "Every Yellow/Red feature has human review path.",
    "Every provider-backed feature is provider-required until connected.",
    "No fake completion."
  ],
  gates: [
    "Feature has owner.",
    "Feature has purpose.",
    "Feature has risk zone.",
    "Feature has fallback.",
    "Feature has privacy note.",
    "Feature has human review path when required.",
    "Feature avoids fake completion."
  ],
  motto:
    "AI everywhere. Chaos nowhere. Every AI capability is classified, bounded, accountable and governed by the Kernel."
} as const;
