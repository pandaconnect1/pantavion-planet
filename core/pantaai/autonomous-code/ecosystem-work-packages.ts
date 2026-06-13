export type PantavionWorkPackagePriority = 1 | 2 | 3 | 4 | 5;

export type PantavionWorkPackageStatus =
  | "ready_for_generation"
  | "requires_provider"
  | "requires_legal_review"
  | "protected_kernel";

export type PantavionEcosystemWorkPackage = {
  readonly id: string;
  readonly title: string;
  readonly priority: PantavionWorkPackagePriority;
  readonly status: PantavionWorkPackageStatus;
  readonly kernelFamily: string;
  readonly purpose: string;
  readonly targetFiles: readonly string[];
  readonly dependencies: readonly string[];
  readonly protectedDomains: readonly string[];
  readonly executionRules: readonly string[];
};

function workPackage(input: PantavionEcosystemWorkPackage): PantavionEcosystemWorkPackage {
  return input;
}

export const PANTAVION_ECOSYSTEM_WORK_PACKAGES: readonly PantavionEcosystemWorkPackage[] = [
  workPackage({
    id: "pantaai-model-provider-router",
    title: "PantaAI model provider router",
    priority: 5,
    status: "ready_for_generation",
    kernelFamily: "PantaAI Intelligence Kernel",
    purpose: "Route ChatGPT, Claude, Gemini, Grok, Perplexity, DeepSeek, Gemma, Bard and Bing AI style providers by speed, reasoning, research, coding, translation, privacy, cost and fallback.",
    targetFiles: [
      "core/pantaai/model-router/model-selection-kernel.ts",
      "core/pantaai/model-router/provider-health-kernel.ts",
      "core/pantaai/model-router/provider-cost-guard.ts"
    ],
    dependencies: ["provider-capability-matrix", "agent-task-router", "tool-substitution-advisor"],
    protectedDomains: ["private_data", "identity", "legal"],
    executionRules: [
      "No provider is marked active without API or connector evidence.",
      "Protected data requires privacy gate.",
      "No external brand or UI copying."
    ]
  }),
  workPackage({
    id: "pandadev-coding-agent-executor",
    title: "PandaDev autonomous coding executor",
    priority: 5,
    status: "ready_for_generation",
    kernelFamily: "PandaDev Autonomous Coding Kernel",
    purpose: "Turn Cursor, Claude Code, Codex, Windsurf, Copilot, Replit, Devin and Amazon Q patterns into Pantavion-owned coding lanes.",
    targetFiles: [
      "core/pantaai/autonomous-code/coding-task-executor.ts",
      "core/pantaai/autonomous-code/repo-truth-reader.ts",
      "core/pantaai/autonomous-code/build-audit-runner.ts"
    ],
    dependencies: ["coding-provider-matrix", "protected-path-policy", "github-autonomous-writer"],
    protectedDomains: ["water", "users", "access", "secrets", "production"],
    executionRules: [
      "No git add dot.",
      "No direct protected production mutation.",
      "Every generated patch must pass audit, build and typecheck."
    ]
  }),
  workPackage({
    id: "pantarag-memory-source-vault",
    title: "PantaRAG memory and source vault",
    priority: 5,
    status: "ready_for_generation",
    kernelFamily: "PantaRAG Memory Kernel",
    purpose: "Transform Pinecone, LlamaIndex, Haystack and Milvus patterns into Pantavion-owned retrieval, source vault, code memory and private/public memory separation.",
    targetFiles: [
      "core/pantaai/rag/source-vault-contract.ts",
      "core/pantaai/rag/retrieval-policy.ts",
      "core/pantaai/rag/private-memory-guard.ts"
    ],
    dependencies: ["capability-gap-scanner", "protected-path-policy"],
    protectedDomains: ["private_data", "water", "identity", "legal"],
    executionRules: [
      "Private data must not be indexed externally without consent.",
      "Water and private infrastructure sources require protected memory lane.",
      "Source memory requires evidence tracking."
    ]
  }),
  workPackage({
    id: "pantaflow-workflow-automation",
    title: "PantaFlow workflow automation",
    priority: 4,
    status: "ready_for_generation",
    kernelFamily: "PantaFlow Automation Kernel",
    purpose: "Convert Make, Zapier, n8n and Gumloop patterns into internal triggers, actions, approvals, retries, schedules and connector audit logs.",
    targetFiles: [
      "core/pantaai/workflows/workflow-runner.ts",
      "core/pantaai/workflows/connector-permission-policy.ts",
      "core/pantaai/workflows/external-effect-gate.ts"
    ],
    dependencies: ["tool-substitution-advisor"],
    protectedDomains: ["users", "payments", "identity", "private_data"],
    executionRules: [
      "No external effect without permission.",
      "All connector calls must be auditable.",
      "Retries must not duplicate payments, messages or destructive actions."
    ]
  }),
  workPackage({
    id: "pantalife-china-superapp-runtime",
    title: "PantaLife China-style super-app runtime",
    priority: 5,
    status: "ready_for_generation",
    kernelFamily: "PantaLife Super-App Kernel",
    purpose: "Unify WeChat, Weibo, RedNote, QQ, Qzone, Bilibili, Alipay, Baidu, AMAP, Didi, Dianping, Douyin and Tantan patterns into Pantavion-owned ecosystem modules.",
    targetFiles: [
      "core/pantaai/ecosystem/china-superapp-runtime-map.ts",
      "core/pantalife/superapp-module-registry.ts",
      "core/pantalife/superapp-execution-policy.ts"
    ],
    dependencies: ["china-superapp-capability-map", "global-ecosystem-registry", "ecosystem-unification-kernel"],
    protectedDomains: ["identity", "payments", "minors", "location", "privacy", "legal"],
    executionRules: [
      "No Chinese brand or UI copying.",
      "Payments, dating, minors and location require legal gates.",
      "All modules must use Pantavion-owned names and execution contracts."
    ]
  }),
  workPackage({
    id: "seven-continent-localization-runtime",
    title: "Seven-continent ecosystem runtime",
    priority: 5,
    status: "ready_for_generation",
    kernelFamily: "Seven-Continent Ecosystem Kernel",
    purpose: "Turn Africa, Asia, Europe, North America, South America, Oceania and Antarctica ecosystem needs into language, law, service and culture modules.",
    targetFiles: [
      "core/pantaai/ecosystem/continent-runtime-registry.ts",
      "core/pantaai/ecosystem/regional-policy-router.ts",
      "core/pantaai/ecosystem/language-region-capability-map.ts"
    ],
    dependencies: ["seven-continent-ecosystem-map", "global-ecosystem-registry"],
    protectedDomains: ["legal", "payments", "identity", "minors", "privacy"],
    executionRules: [
      "Country law must be explicit or marked unknown.",
      "No stereotype-based localization.",
      "Payments, minors and identity must be region-gated."
    ]
  }),
  workPackage({
    id: "protected-domain-kernels-runtime",
    title: "Protected domain child kernels",
    priority: 5,
    status: "protected_kernel",
    kernelFamily: "Protected Domain Kernels",
    purpose: "Make Water, users, access, secret production, payments, legal, identity and SOS executable child kernels that listen to the central Kernel Orchestrator.",
    targetFiles: [
      "core/water/water-kernel.ts",
      "core/identity/identity-access-kernel.ts",
      "core/sos/sos-kernel.ts",
      "core/legal/legal-payments-kernel.ts",
      "core/security/secret-production-guard.ts"
    ],
    dependencies: ["protected-path-policy", "kernel-domain-cores", "autonomous-engineering-kernel"],
    protectedDomains: ["water", "users", "access", "secrets", "production", "payments", "legal", "identity", "sos"],
    executionRules: [
      "Protected domains are executable kernels, not excuses.",
      "Observe, plan, draft and PR are allowed.",
      "Direct mutation requires domain kernel and founder or release gate."
    ]
  })
];

export function getPantavionEcosystemWorkPackages(): readonly PantavionEcosystemWorkPackage[] {
  return PANTAVION_ECOSYSTEM_WORK_PACKAGES;
}

export function getReadyPantavionWorkPackages(): readonly PantavionEcosystemWorkPackage[] {
  return [...PANTAVION_ECOSYSTEM_WORK_PACKAGES]
    .filter((item) => item.status === "ready_for_generation" || item.status === "protected_kernel")
    .sort((a, b) => b.priority - a.priority);
}

export const pantavion_ecosystem_work_packages_marker_v1 =
  "pantavion_ecosystem_work_packages_c5_v1";
