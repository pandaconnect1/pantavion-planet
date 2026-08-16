export const PANTAVION_CANONICAL_ARCHIVE_ID =
  "pantavion_canonical_archive_orchestrator_v1";

export type PantavionArchiveRiskZone = "Z1" | "Z2" | "Z3" | "Z4";

export type PantavionArchiveDomain = {
  id: string;
  title: string;
  riskZone: PantavionArchiveRiskZone;
  requiredOutcome: string;
  routeTargets: string[];
  scriptTargets: string[];
  approvalRequired: boolean;
};

export const PANTAVION_ARCHIVE_DOMAINS: PantavionArchiveDomain[] = [
  {
    id: "kernel_agent_runtime",
    title: "Kernel, Agent Runtime, Supervisor, Work Orders and Self Evolution",
    riskZone: "Z2",
    requiredOutcome:
      "Kernel and agents read the canonical archive, produce safe work orders, run checks and prepare repo plans.",
    routeTargets: [
      "/api/pantavion/agents/runtime/archive",
      "/api/pantavion/agents/runtime/supervisor",
      "/api/pantavion/agents/runtime/work-orders"
    ],
    scriptTargets: ["agent:archive", "agent:supervisor", "agent:work-orders"],
    approvalRequired: false
  },
  {
    id: "universal_entry_user_gateway",
    title: "Universal Entry for Chat, Voice, Search, Social, Messaging, Dating, Payments, VIP and Tools",
    riskZone: "Z2",
    requiredOutcome:
      "Every user request enters one gateway, receives capability status, policy status and work-order path.",
    routeTargets: ["/pantavion/entry", "/api/pantavion/entry"],
    scriptTargets: ["audit:entry"],
    approvalRequired: false
  },
  {
    id: "legacy_two_year_recovery",
    title: "Two-Year Recovery Canon and Legacy Source Intake",
    riskZone: "Z2",
    requiredOutcome:
      "Old repos, docs, patches, screenshots and doctrine are indexed as source intelligence and implementation work orders.",
    routeTargets: [
      "/api/pantavion/agents/runtime/legacy-intake",
      "/api/pantavion/agents/runtime/two-year-recovery"
    ],
    scriptTargets: ["agent:legacy-intake", "agent:two-year-recovery"],
    approvalRequired: false
  },
  {
    id: "auth_identity_memory",
    title: "Auth, Identity, Profiles, Saved Chat and Memory Sovereignty",
    riskZone: "Z3",
    requiredOutcome:
      "Real login, profiles, consent memory, saved chat, privacy classes, export/delete and audit.",
    routeTargets: ["/api/pantavion/auth/status", "/pantavion/profile"],
    scriptTargets: ["audit:auth-plan"],
    approvalRequired: true
  },
  {
    id: "billing_vip_payments",
    title: "Stripe, Billing, VIP and Entitlements",
    riskZone: "Z3",
    requiredOutcome:
      "Billing provider gate, VIP entitlements, plans, receipts, tax/legal review and production approval.",
    routeTargets: ["/api/pantavion/billing/status", "/api/pantavion/vip/status"],
    scriptTargets: ["audit:billing-plan"],
    approvalRequired: true
  },
  {
    id: "dwg_water_source_truth",
    title: "DWG, Water, CAD, GIS and Source Truth",
    riskZone: "Z3",
    requiredOutcome:
      "Original DWG read-only viewer, private vault, licensed adapter, no fake map, no source transformation.",
    routeTargets: [
      "/professional/infrastructure/water/b",
      "/professional/infrastructure/water/c"
    ],
    scriptTargets: ["kernel:dwg", "kernel:dwg-adapter", "audit:water"],
    approvalRequired: true
  },
  {
    id: "social_messaging_dating_safety",
    title: "Social, Messaging, Dating and Safety",
    riskZone: "Z3",
    requiredOutcome:
      "People, messaging and dating need identity, consent, moderation, report/block, age gates and legal boundaries.",
    routeTargets: [
      "/api/pantavion/people/status",
      "/api/pantavion/messaging/status",
      "/api/pantavion/dating/status"
    ],
    scriptTargets: ["audit:social-safety"],
    approvalRequired: true
  },
  {
    id: "repo_github_deploy",
    title: "Repo, GitHub, PR, Preview Deploy and Production Deploy Gate",
    riskZone: "Z3",
    requiredOutcome:
      "Pantavion prepares scoped repo plans, safe commits and preview deploys. Production requires founder approval.",
    routeTargets: [
      "/api/pantavion/agents/runtime/repo-plan",
      "/api/pantavion/agents/runtime/deploy-plan"
    ],
    scriptTargets: ["kernel:repo"],
    approvalRequired: true
  }
];

export function getPantavionCanonicalArchiveContract() {
  return {
    ok: true,
    id: PANTAVION_CANONICAL_ARCHIVE_ID,
    status: "archive_orchestrator_contract",
    rule:
      "Pantavion archives all recovered source material into evidence, work orders, GitHub sync plans and implementation queues. It does not raw-add old repos blindly.",
    domains: PANTAVION_ARCHIVE_DOMAINS
  };
}
