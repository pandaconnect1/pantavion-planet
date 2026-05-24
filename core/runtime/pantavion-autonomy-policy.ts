export const pantavionAutonomyPolicy = {
  id: "pantavion_github_autonomy_policy_v1",
  truth:
    "Pantavion GitHub autonomy may audit, verify, generate reports, run deterministic repair scripts, and open issues. It must not perform dangerous production, billing, identity, emergency, provider, or destructive actions without Founder approval.",
  allowedAutonomousActions: [
    "run audits",
    "run TypeScript",
    "run build",
    "generate runtime reports",
    "run deterministic compatibility repair",
    "open GitHub issues on failure",
    "upload artifacts",
  ],
  blockedWithoutFounderApproval: [
    "production deploy",
    "database destructive action",
    "provider activation",
    "billing change",
    "emergency authority dispatch claim",
    "private infrastructure exposure",
    "force push",
    "direct unsafe source rewrite",
  ],
} as const;
