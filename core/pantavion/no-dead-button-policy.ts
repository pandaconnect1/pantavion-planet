export const noDeadButtonPolicy = {
  id: "no-dead-button-policy",
  title: "No Dead Button Policy",
  status: "locked",
  priority: "critical",
  summary:
    "Every visible button, title and section must have a real route, visible status and user value.",
  gates: [
    "Every button must route to a real page.",
    "Every section must have content.",
    "Every non-live feature must show foundation, beta, provider-required, legal-review or restricted status.",
    "No fake payment buttons.",
    "No fake AI execution.",
    "No fake import from external apps.",
    "No placeholder without explanation.",
    "No route that crashes in browser.",
    "No empty category title."
  ],
  allowedStatuses: ["live", "foundation", "beta", "provider-required", "legal-review", "restricted", "admin-only", "coming-next-with-route"],
  forbiddenStatuses: ["dead", "empty", "fake-live", "href-only", "broken", "unexplained-placeholder"]
} as const;
