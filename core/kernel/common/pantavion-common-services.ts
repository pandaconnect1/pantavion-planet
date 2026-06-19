export type PantavionCommonServiceId =
  | "universal_language"
  | "identity"
  | "permissions"
  | "safety_legal"
  | "provider_cost"
  | "memory"
  | "event_bus"
  | "realness_gate"
  | "project_intake"
  | "user_demand"
  | "global_benchmark"
  | "search_retrieval"
  | "notifications"
  | "audit_deploy"
  | "recovery_rollback"
  | "security_abuse"
  | "data_sovereignty"
  | "offline_weak_network";

export type PantavionCommonService = {
  id: PantavionCommonServiceId;
  title: string;
  purpose: string;
  sharedByEveryKernel: boolean;
  founderCritical: boolean;
  notes: string[];
};

export const PANTAVION_COMMON_SERVICES: PantavionCommonService[] = [
  {
    id: "universal_language",
    title: "Universal Language Kernel",
    purpose: "Shared multilingual layer for the whole Pantavion ecosystem, targeting all natural languages and dialect families over time.",
    sharedByEveryKernel: true,
    founderCritical: true,
    notes: [
      "Long-term target: thousands of natural languages and dialects.",
      "Supports UI language, helper language, translation, speech, subtitles, emergency phrases, RTL/LTR and language memory.",
      "Every autonomous kernel must use this shared language layer instead of inventing its own."
    ]
  },
  {
    id: "identity",
    title: "Identity Kernel",
    purpose: "Global user, role, device and organization identity.",
    sharedByEveryKernel: true,
    founderCritical: true,
    notes: [
      "Global User ID.",
      "Age group, guardian, trusted contacts, professional roles, device trust and organization verification.",
      "Required before sensitive capabilities become live."
    ]
  },
  {
    id: "permissions",
    title: "Permissions and Access Kernel",
    purpose: "Shared access control for public, private, founder-only, admin-only, professional and approved-user-only areas.",
    sharedByEveryKernel: true,
    founderCritical: true,
    notes: [
      "Prevents a section kernel from touching protected areas.",
      "Controls user-visible access, admin access and critical infrastructure access."
    ]
  },
  {
    id: "safety_legal",
    title: "Safety and Legal Kernel",
    purpose: "Shared governance for minors, health, finance, dating, emergency, copyright, privacy and jurisdictional rules.",
    sharedByEveryKernel: true,
    founderCritical: true,
    notes: [
      "No medical, financial, emergency or legal claim can go public without this gate.",
      "Critical for global expansion across regions."
    ]
  },
  {
    id: "provider_cost",
    title: "Provider and Cost Kernel",
    purpose: "Controls AI, speech, translation, video, storage, maps, payments, notifications, OCR and external provider usage.",
    sharedByEveryKernel: true,
    founderCritical: true,
    notes: [
      "Tracks provider need, cost, fallback, rate limits and approval requirements.",
      "Prevents hidden uncontrolled API cost."
    ]
  },
  {
    id: "memory",
    title: "Kernel Memory",
    purpose: "Shared memory framework with local memory per autonomous kernel.",
    sharedByEveryKernel: true,
    founderCritical: true,
    notes: [
      "Stores decisions, errors, last known good state, founder instructions, build history and recovery lessons.",
      "Prevents repeating old mistakes."
    ]
  },
  {
    id: "event_bus",
    title: "Kernel Event Bus",
    purpose: "Allows kernels to communicate through controlled events instead of direct uncontrolled coupling.",
    sharedByEveryKernel: true,
    founderCritical: true,
    notes: [
      "Supports demand events, build events, error events, dependency events, approval events and deployment events."
    ]
  },
  {
    id: "realness_gate",
    title: "Realness Gate",
    purpose: "Blocks fake/static capabilities from being presented as live.",
    sharedByEveryKernel: true,
    founderCritical: true,
    notes: [
      "Checks route, UI, state, data, API, provider, permission, loading, empty, error, tests, build and TypeScript status.",
      "No fake buttons."
    ]
  },
  {
    id: "project_intake",
    title: "Project Intake Kernel",
    purpose: "Ingests old Pantavion files, unfinished projects, legacy repos, Vercel remnants and prototypes into Pantavion Planet.",
    sharedByEveryKernel: true,
    founderCritical: true,
    notes: [
      "Nothing useful is left outside.",
      "Everything becomes capability, kernel candidate, work order or real implementation requirement."
    ]
  },
  {
    id: "user_demand",
    title: "User Demand Kernel",
    purpose: "Turns missing user needs into proposed capabilities and new autonomous kernel candidates.",
    sharedByEveryKernel: true,
    founderCritical: false,
    notes: [
      "User asks for something missing.",
      "Pantavion searches existing capabilities.",
      "If missing, it creates demand signal, candidate capability and founder-visible work order."
    ]
  },
  {
    id: "global_benchmark",
    title: "Global Benchmark Kernel",
    purpose: "Compares each kernel with global ecosystems legally and fills their gaps with Pantavion-owned patterns.",
    sharedByEveryKernel: true,
    founderCritical: true,
    notes: [
      "China, USA, Europe, Japan, Korea, Russia, India, Southeast Asia, Africa, Latin America and global platforms.",
      "Benchmark patterns, do not copy brands, UI, code or protected IP."
    ]
  },
  {
    id: "search_retrieval",
    title: "Search and Retrieval Kernel",
    purpose: "Shared search, indexing, retrieval and source reliability layer.",
    sharedByEveryKernel: true,
    founderCritical: false,
    notes: [
      "Needed for research, user demand, old project intake and global benchmark analysis."
    ]
  },
  {
    id: "notifications",
    title: "Notification Kernel",
    purpose: "Shared notification layer for reminders, alerts, approvals, care, build status and system events.",
    sharedByEveryKernel: true,
    founderCritical: false,
    notes: [
      "Must respect consent, quiet hours, critical alerts and user preferences."
    ]
  },
  {
    id: "audit_deploy",
    title: "Audit and Deployment Kernel",
    purpose: "Shared build, TypeScript, tests, route checks, GitHub, Vercel and post-deploy verification.",
    sharedByEveryKernel: true,
    founderCritical: true,
    notes: [
      "Every kernel reports what entered GitHub, what passed Vercel, what failed build and what founder must know."
    ]
  },
  {
    id: "recovery_rollback",
    title: "Recovery and Rollback Kernel",
    purpose: "Shared recovery plan for failed patches, bad deploys and isolated kernel errors.",
    sharedByEveryKernel: true,
    founderCritical: true,
    notes: [
      "Tracks last known good commit, affected files, rollback plan and critical data protection."
    ]
  },
  {
    id: "security_abuse",
    title: "Security and Abuse Kernel",
    purpose: "Shared abuse detection for spam, scams, harassment, misinformation, fraud, copyright, sensitive data and critical infrastructure exposure.",
    sharedByEveryKernel: true,
    founderCritical: true,
    notes: [
      "Every autonomous kernel must declare its abuse model before becoming live."
    ]
  },
  {
    id: "data_sovereignty",
    title: "Data Sovereignty Kernel",
    purpose: "Controls what data is stored, where, for how long, who can see it and what can be exported or deleted.",
    sharedByEveryKernel: true,
    founderCritical: true,
    notes: [
      "Required for global regions, privacy, professional infrastructure and user trust."
    ]
  },
  {
    id: "offline_weak_network",
    title: "Offline and Weak-Network Kernel",
    purpose: "Defines what each section can do offline, in weak network or future satellite-supported states.",
    sharedByEveryKernel: true,
    founderCritical: false,
    notes: [
      "Important for SOS, travel, water, field work, translation and vulnerable users."
    ]
  }
];

export const PANTAVION_COMMON_SERVICE_IDS = PANTAVION_COMMON_SERVICES.map(
  (service) => service.id
);
