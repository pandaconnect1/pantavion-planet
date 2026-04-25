export const securityHackerApiChecklist = {
  id: "security-hacker-api-checklist",
  title: "Security / Hacker / API Protection Checklist",
  status: "foundation",
  priority: "critical",
  summary:
    "Pantavion must treat security as a Kernel duty: identity, authorization, abuse prevention, provider safety, secrets, APIs and incident response.",
  gates: [
    "No secrets in client code.",
    "Protect admin and founder routes.",
    "Validate all API input.",
    "Rate limit expensive AI/provider routes.",
    "Audit object-level authorization before private data access.",
    "Audit function-level authorization before privileged actions.",
    "Restrict webhook endpoints and verify signatures.",
    "Validate third-party API responses.",
    "Do not trust provider output blindly.",
    "Prepare incident response flow.",
    "Prepare backup and continuity mode.",
    "Log sensitive actions without exposing private content.",
    "Add security headers.",
    "Prepare abuse bot protection.",
    "Monitor route and provider failures."
  ],
  owaspCoverage: [
    "Broken Object Level Authorization",
    "Broken Authentication",
    "Broken Object Property Level Authorization",
    "Unrestricted Resource Consumption",
    "Broken Function Level Authorization",
    "Unrestricted Access to Sensitive Business Flows",
    "Server Side Request Forgery",
    "Security Misconfiguration",
    "Improper Inventory Management",
    "Unsafe Consumption of APIs"
  ]
} as const;
