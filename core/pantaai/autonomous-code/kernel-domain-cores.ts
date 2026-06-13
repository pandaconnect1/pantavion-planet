export type PantavionDomainCore = {
  id: string;
  title: string;
  authority: "kernel_child" | "kernel_guardian" | "kernel_execution";
  listensTo: "pantavion_autonomous_engineering_kernel";
  executionLanes: string[];
  directMutationAllowed: boolean;
  founderGateRequiredFor: string[];
  continuousResponsibilities: string[];
};

export const PANTAVION_DOMAIN_CORES: PantavionDomainCore[] = [
  {
    id: "water_kernel",
    title: "Water Kernel",
    authority: "kernel_guardian",
    listensTo: "pantavion_autonomous_engineering_kernel",
    executionLanes: ["observe", "diagnose", "map_audit", "access_audit", "patch_draft", "pr"],
    directMutationAllowed: false,
    founderGateRequiredFor: [
      "raw_water_data",
      "dwg_dxf_kmz_sources",
      "production_map",
      "approved_users",
      "access_records",
      "private_blob_urls",
    ],
    continuousResponsibilities: [
      "Protect infrastructure data",
      "Preserve users and access records",
      "Detect map rendering regressions",
      "Generate safe repair PRs",
      "Maintain rollback evidence",
    ],
  },
  {
    id: "identity_access_kernel",
    title: "Identity and Access Kernel",
    authority: "kernel_guardian",
    listensTo: "pantavion_autonomous_engineering_kernel",
    executionLanes: ["observe", "session_audit", "role_audit", "approval_queue", "patch_draft", "pr"],
    directMutationAllowed: false,
    founderGateRequiredFor: ["roles", "sessions", "approvals", "revoke", "admin_access"],
    continuousResponsibilities: [
      "Protect users",
      "Protect admin/founder role",
      "Detect broken access flows",
      "Preserve approval history",
    ],
  },
  {
    id: "sos_kernel",
    title: "SOS Kernel",
    authority: "kernel_guardian",
    listensTo: "pantavion_autonomous_engineering_kernel",
    executionLanes: ["observe", "language_audit", "safety_audit", "offline_pack_plan", "patch_draft", "pr"],
    directMutationAllowed: false,
    founderGateRequiredFor: ["emergency_claims", "authority_dispatch", "medical_claims", "minor_flows"],
    continuousResponsibilities: [
      "Keep SOS simple",
      "Protect elder/minor safety",
      "Preserve translation logic",
      "Avoid false emergency guarantees",
    ],
  },
  {
    id: "legal_payments_kernel",
    title: "Legal and Payments Kernel",
    authority: "kernel_guardian",
    listensTo: "pantavion_autonomous_engineering_kernel",
    executionLanes: ["observe", "policy_audit", "billing_audit", "patch_draft", "pr"],
    directMutationAllowed: false,
    founderGateRequiredFor: ["terms", "privacy", "payments", "subscriptions", "refunds", "claims"],
    continuousResponsibilities: [
      "Protect consent",
      "Protect billing accuracy",
      "Prevent unsafe legal or financial claims",
      "Maintain provider limitations",
    ],
  },
  {
    id: "pantaai_autonomous_coding_kernel",
    title: "PantaAI Autonomous Coding Kernel",
    authority: "kernel_execution",
    listensTo: "pantavion_autonomous_engineering_kernel",
    executionLanes: ["observe", "plan", "code", "audit", "branch", "pr", "repair"],
    directMutationAllowed: true,
    founderGateRequiredFor: ["protected_domains", "production_deploy", "secrets", "payments"],
    continuousResponsibilities: [
      "Write code",
      "Run audits",
      "Create PRs",
      "Repair failed builds",
      "Expand registry",
      "Detect dead/static capabilities",
    ],
  },
  {
    id: "china_superapp_kernel",
    title: "China Super-App Capability Kernel",
    authority: "kernel_child",
    listensTo: "pantavion_autonomous_engineering_kernel",
    executionLanes: ["observe", "capability_map", "legal_transform", "module_plan", "patch_draft", "pr"],
    directMutationAllowed: true,
    founderGateRequiredFor: ["payments", "dating", "identity", "minors", "location"],
    continuousResponsibilities: [
      "Unify super-app patterns legally",
      "Map Chinese ecosystem capabilities",
      "Create Pantavion-owned modules",
      "Avoid copying brands or UI",
    ],
  },
  {
    id: "seven_continent_kernel",
    title: "Seven-Continent Ecosystem Kernel",
    authority: "kernel_child",
    listensTo: "pantavion_autonomous_engineering_kernel",
    executionLanes: ["observe", "regionalize", "translate", "culture_policy", "patch_draft", "pr"],
    directMutationAllowed: true,
    founderGateRequiredFor: ["regional_law", "payments", "identity", "minors"],
    continuousResponsibilities: [
      "Support all continents",
      "Localize language and culture",
      "Respect regional law",
      "Keep global Pantavion unified",
    ],
  },
];

export const pantavion_domain_cores_marker_v1 =
  "pantavion_domain_cores_c1_v1";
