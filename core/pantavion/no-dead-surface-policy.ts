export const noDeadSurfacePolicy = {
  id: "no-dead-surface-policy",
  title: "Pantavion No Dead Surface Policy",
  status: "mandatory-deep-audit-foundation",
  priority: "critical",
  summary:
    "Every visible button, card, form, link or call-to-action must be live, disabled with a clear label, beta, restricted, provider-required, legal-review-required or future-roadmap.",
  surfacesToAudit: [
    "homepage",
    "navbar",
    "footer",
    "cards",
    "CTAs",
    "forms",
    "dashboard buttons",
    "legal links",
    "pricing links",
    "SOS links",
    "AI buttons",
    "marketplace buttons",
    "radio buttons",
    "import buttons",
    "elite buttons",
    "adult/restricted links"
  ],
  allowedStates: [
    "real_route",
    "real_action",
    "disabled_with_label",
    "beta_with_warning",
    "restricted",
    "legal_review_required",
    "provider_required",
    "future_roadmap"
  ],
  blockedStates: [
    "dead_button",
    "empty_route",
    "fake_live",
    "silent_failure",
    "payment_without_terms",
    "SOS_without_disclaimer",
    "import_without_consent",
    "AI_without_risk_label"
  ],
  gates: [
    "No public CTA without route/action/status.",
    "No pricing CTA without legal/payment gate.",
    "No SOS CTA without safety boundary.",
    "No import CTA without consent and connector matrix.",
    "No AI action button without risk classification.",
    "No adult or elite button without access policy."
  ],
  motto:
    "Every surface tells the truth."
} as const;
