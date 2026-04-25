export const riskRegistry = {
  id: "risk-registry",
  title: "Pantavion Risk Registry",
  status: "foundation",
  priority: "critical",
  summary:
    "Every capability is classified before public exposure, payment, provider connection, AI automation or data import.",
  gates: [
    "Low risk may be public foundation.",
    "Medium risk needs clear disclaimer and abuse controls.",
    "High risk needs identity, consent, logging and human/professional escalation.",
    "Very high risk needs legal review, jurisdiction checks and restricted infrastructure."
  ],
  classes: [
    { level: "low", examples: ["public pages", "general information", "non-sensitive navigation"] },
    { level: "medium", examples: ["creator tools", "business listings", "marketplace visibility", "radio shows"] },
    { level: "high", examples: ["messages", "data import", "identity", "minors", "payments", "health/legal/finance information"] },
    { level: "very-high", examples: ["adult explicit content", "age verification", "emergency public alerts", "government channels", "elite secure channels"] },
    { level: "blocked", examples: ["illegal goods", "non-consensual intimate media", "child exploitation", "trafficking", "unauthorized credential scraping", "fake investment guarantees"] }
  ]
} as const;
