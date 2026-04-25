export const adultRestrictedPolicy = {
  id: "adult-restricted-policy",
  title: "Adult Connect 18+ Restricted Policy",
  status: "restricted-policy-only",
  priority: "critical",
  summary:
    "Adult Connect is a future isolated 18+ subsystem, not part of mainstream social, minors, public feed or Stripe-first payment flow.",
  gates: [
    "No minors ever.",
    "No simple checkbox-only age gate.",
    "Separate age verification.",
    "Separate legal terms.",
    "Separate processor/legal review before monetization.",
    "No adult ads outside adult zone.",
    "No adult content in public feed.",
    "No child exploitation, trafficking, coercion, hidden camera, revenge content or non-consensual intimate media.",
    "Country-by-country law map required.",
    "No Stripe integration until explicitly reviewed and approved for allowed business category."
  ],
  profiles: ["main profile", "work profile", "creator profile", "adult private profile"],
  statusModel: ["blocked", "restricted", "legal-review", "age-verification-required", "processor-review-required", "not-public"]
} as const;
