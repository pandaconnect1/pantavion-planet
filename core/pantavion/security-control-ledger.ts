export const securityControlLedger = {
  id: "security-control-ledger",
  title: "Pantavion Security Control Ledger",
  status: "mandatory-deep-audit-foundation",
  priority: "critical",
  summary:
    "Pantavion must use defense-in-depth: identify, protect, detect, respond and recover. No system is called invulnerable; every control has owner, status and release gate.",
  doctrine:
    "Military-grade language may be used internally as discipline, but public claims must be precise: resilient, hardened, monitored and auditable, not impossible to breach.",
  controls: [
    {
      id: "rbac",
      name: "RBAC / roles",
      status: "needed",
      blocks: "admin, elite, institutions, responders, authorities"
    },
    {
      id: "admin-protection",
      name: "Admin route protection",
      status: "needed",
      blocks: "operator dashboards and sensitive controls"
    },
    {
      id: "rate-limiting",
      name: "Rate limiting",
      status: "needed",
      blocks: "auth, APIs, forms, AI endpoints, SOS endpoints"
    },
    {
      id: "bot-protection",
      name: "Bot / abuse protection",
      status: "needed",
      blocks: "signup, messaging, marketplace, radio submissions"
    },
    {
      id: "csrf-cors",
      name: "CSRF / CORS policy",
      status: "needed",
      blocks: "authenticated forms and APIs"
    },
    {
      id: "csp-headers",
      name: "CSP and security headers",
      status: "partial",
      blocks: "production hardening"
    },
    {
      id: "secret-management",
      name: "Secret management",
      status: "needed",
      blocks: "Stripe, AI providers, OAuth, email providers"
    },
    {
      id: "audit-logs",
      name: "Audit logs",
      status: "needed",
      blocks: "SOS, admin, payments, moderation, import, elite"
    },
    {
      id: "incident-response",
      name: "Incident response",
      status: "needed",
      blocks: "public launch"
    },
    {
      id: "backup-restore",
      name: "Backup / restore",
      status: "needed",
      blocks: "real accounts and data"
    },
    {
      id: "dependency-scanning",
      name: "Dependency scanning",
      status: "needed",
      blocks: "production governance"
    },
    {
      id: "mfa-roadmap",
      name: "MFA roadmap",
      status: "needed",
      blocks: "admin, elite, institutions, business accounts"
    }
  ],
  gates: [
    "No admin dashboard without RBAC and MFA plan.",
    "No payment live without secrets policy and audit logs.",
    "No real SOS backend without rate limits, logs and incident response.",
    "No user account launch without session/token policy.",
    "No public API without abuse controls."
  ],
  motto:
    "Not invulnerable. Hardened, monitored, auditable and recoverable."
} as const;
