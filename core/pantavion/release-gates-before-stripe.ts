export const releaseGatesBeforeStripe = {
  id: "release-gates-before-stripe",
  title: "Release Gates Before Stripe",
  status: "required-before-payments",
  priority: "critical",
  summary:
    "Stripe and banking should begin only after public trust, route safety, legal, privacy, refund, pricing and risk boundaries are clean.",
  gates: [
    "Premium homepage locked.",
    "All core routes open without crash.",
    "Pricing page explains Founding Access and fair-use limits.",
    "Checkout page is honest until Stripe product and price IDs exist.",
    "Terms, Privacy, Refund, Minors and Legal Center live.",
    "Adult restricted system excluded from Stripe-first flow.",
    "Marketplace risky categories blocked until rules exist.",
    "No user-income guarantee.",
    "No high-risk finance/forex/trading products.",
    "No medical/legal diagnosis or advice claims.",
    "Security checklist created.",
    "Custom domain checklist ready."
  ],
  stripeFirstProducts: ["Pantavion Founding Access", "Pantavion Business Listing", "Pantavion Featured Listing", "Pantavion Build Brief"],
  excludedUntilReview: ["Adult Connect", "Forex/trading signals", "Regulated medical services", "Legal representation", "Government/emergency authority channels", "Crypto/wallet/money transmission"]
} as const;
