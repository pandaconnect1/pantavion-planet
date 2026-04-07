export type IntelligenceRole =
  | "planner"
  | "memory-governor"
  | "code-builder"
  | "schema-architect"
  | "ui-builder"
  | "voice-architect"
  | "market-radar"
  | "safety-governor"
  | "deployment-prep"
  | "module-auditor";

export type IntelligenceRecord = {
  id: string;
  name: string;
  role: IntelligenceRole;
  purpose: string;
  capabilities: string[];
  controlledByKernel: boolean;
  status: "active" | "standby" | "planned";
  priority: "critical" | "high" | "medium";
};

export const pantavionIntelligenceRegistry: IntelligenceRecord[] = [
  {
    id: "kernel-planner",
    name: "Kernel Planner",
    role: "planner",
    purpose: "Breaks large requests into modules, tasks, dependencies and next actions.",
    capabilities: ["task decomposition", "module planning", "dependency mapping", "build sequencing"],
    controlledByKernel: true,
    status: "active",
    priority: "critical"
  },
  {
    id: "memory-governor",
    name: "Memory Governor",
    role: "memory-governor",
    purpose: "Keeps canonical memory, project state, decisions and recovery continuity.",
    capabilities: ["project memory", "decision tracking", "history retention", "status continuity"],
    controlledByKernel: true,
    status: "active",
    priority: "critical"
  },
  {
    id: "code-builder",
    name: "Code Builder",
    role: "code-builder",
    purpose: "Generates code files, module scaffolds and implementation outputs.",
    capabilities: ["file writing", "code generation", "module scaffolding", "output packaging"],
    controlledByKernel: true,
    status: "active",
    priority: "critical"
  },
  {
    id: "schema-architect",
    name: "Schema Architect",
    role: "schema-architect",
    purpose: "Designs data models, memory structures, registries and future database layouts.",
    capabilities: ["schema design", "state models", "registry structures", "data contracts"],
    controlledByKernel: true,
    status: "active",
    priority: "high"
  },
  {
    id: "ui-builder",
    name: "UI Builder",
    role: "ui-builder",
    purpose: "Builds user interfaces, admin surfaces, workstations and controlled visual systems.",
    capabilities: ["page composition", "admin panels", "design system implementation", "layout generation"],
    controlledByKernel: true,
    status: "active",
    priority: "high"
  },
  {
    id: "voice-runtime-architect",
    name: "Voice Runtime Architect",
    role: "voice-architect",
    purpose: "Designs the voice spine: STT, detect, translation routing, TTS, fallback and privacy logic.",
    capabilities: ["voice routing", "translation spine planning", "latency handling", "privacy-safe audio flow"],
    controlledByKernel: true,
    status: "planned",
    priority: "critical"
  },
  {
    id: "market-radar",
    name: "Market Radar",
    role: "market-radar",
    purpose: "Tracks tools, trends, software stacks, signals, opportunities and external ecosystem shifts.",
    capabilities: ["signal intake", "tool discovery", "market comparison", "technology mapping"],
    controlledByKernel: true,
    status: "active",
    priority: "high"
  },
  {
    id: "safety-governor",
    name: "Safety Governor",
    role: "safety-governor",
    purpose: "Protects the core against unsafe, unstable or policy-breaking evolution.",
    capabilities: ["policy review", "risk scoring", "admission checks", "guardrails"],
    controlledByKernel: true,
    status: "active",
    priority: "critical"
  },
  {
    id: "deployment-prep",
    name: "Deployment Preparation",
    role: "deployment-prep",
    purpose: "Prepares outputs for delivery, release readiness and operational handoff.",
    capabilities: ["release packaging", "environment notes", "delivery readiness", "deployment prep"],
    controlledByKernel: true,
    status: "planned",
    priority: "medium"
  },
  {
    id: "module-auditor",
    name: "Module Auditor",
    role: "module-auditor",
    purpose: "Checks modules for missing layers, regressions, incomplete states and architecture drift.",
    capabilities: ["gap audit", "regression detection", "module state review", "consistency checks"],
    controlledByKernel: true,
    status: "active",
    priority: "high"
  }
];

export function getActiveIntelligences() {
  return pantavionIntelligenceRegistry.filter((item) => item.status === "active");
}

export function getCriticalIntelligences() {
  return pantavionIntelligenceRegistry.filter((item) => item.priority === "critical");
}

export function findIntelligencesByCapability(query: string) {
  const q = query.toLowerCase().trim();
  return pantavionIntelligenceRegistry.filter((item) =>
    item.capabilities.some((capability) => capability.toLowerCase().includes(q)) ||
    item.name.toLowerCase().includes(q) ||
    item.purpose.toLowerCase().includes(q)
  );
}
