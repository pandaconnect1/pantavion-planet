export type PantavionInteroperabilityLayerKind =
  | "capability_access"
  | "agent_federation"
  | "identity_delegation"
  | "voice_audio"
  | "connectivity_resilience"
  | "security_trust"
  | "learning_knowledge"
  | "workspace_execution"
  | "market_radar";

export type PantavionRadarPriority = "critical" | "high" | "medium" | "watch";

export interface PantavionEcosystemStandardWatch {
  id: string;
  name: string;
  category: string;
  priority: PantavionRadarPriority;
  whyItMatters: string;
  pantavionMove: string;
  boundary: string;
}

export interface PantavionInteroperabilityLayer {
  id: string;
  kind: PantavionInteroperabilityLayerKind;
  name: string;
  purpose: string;
  mustSupport: string[];
  mustNeverClaim: string[];
  founderGate: boolean;
}

export interface PantavionEcosystemUpgradeWorkOrder {
  id: string;
  title: string;
  targetKernel: string;
  priority: PantavionRadarPriority;
  requiredContracts: PantavionInteroperabilityLayerKind[];
  acceptanceCriteria: string[];
  riskControls: string[];
}

export const PANTAVION_ECOSYSTEM_INTEROPERABILITY_CONTRACT_ID =
  "pantavion_ecosystem_interoperability_contract_v1";

export const ecosystemStandardWatch: PantavionEcosystemStandardWatch[] = [
  {
    id: "watch_mcp_capability_access",
    name: "MCP-ready capability access",
    category: "agent_tool_interoperability",
    priority: "critical",
    whyItMatters:
      "Tool and resource connectivity is becoming a core agent infrastructure layer. Pantavion needs a provider-neutral capability fabric instead of hard-coded tool wrappers.",
    pantavionMove:
      "Keep the Capability Registry ready for MCP-style tools, resources, permissions, streaming, and server discovery without exposing tool chaos to users.",
    boundary:
      "Do not claim full production compatibility until authentication, authorization, testing, provider terms, and runtime connectors exist.",
  },
  {
    id: "watch_a2a_agent_federation",
    name: "A2A-ready agent federation",
    category: "agent_collaboration",
    priority: "critical",
    whyItMatters:
      "Agent-to-agent coordination is becoming separate from tool access. Pantavion needs digital employees and specialist agents with scoped authority.",
    pantavionMove:
      "Repre      "circuit breakers",
      "provider fallback",
      "rollback",
      "private data vault boundaries",
    ],
    mustNeverClaim: [
      "uninterrupted availability",
      "public access to private infrastructure",
      "unguarded provider execution",
    ],
    founderGate: true,
  },
  {
    id: "layer_learning_workspace_execution",
    kind: "learning_knowledge",
    name: "Learning, Workspace, and Execution Layer",
    purpose:
      "Unify research, learning-to-income, workspaces, notes, source atlas, memory, projects, and execution verification.",
    mustSupport: [
      "source reliability tiers",
      "licensing awareness",
      "project memory",
      "execution checkpoints",
      "learning paths",
      "workspace state",
    ],
    mustNeverClaim: [
      "guaranteed income",
      "professional advice without review",
      "unverified source truth",
    ],
    founderGate: false,
  },
  {
    id: "layer_market_radar",
    kind: "market_radar",
    name: "Pantavion Ecosystem Radar",
    purpose:
      "Continuously watch models, protocols, voice, audio, satellite, security, learning, workspaces, social and media systems, and global competitors.",
    mustSupport: [
      "signal classification",
      "legal transformation",
      "capability gap detection",
      "competitive positioning",
      "architecture recommendations",
      "build queue proposals",
    ],
    mustNeverClaim: [
      "copied rankings",
      "copied proprietary data",
      "unstated sponsorship neutrality",
    ],
    founderGate: false,
  },
];

export const ecosystemUpgradeWorkOrders: PantavionEcosystemUpgradeWorkOrder[] = [
  {
    id: "upgrade_capability_registry_mcp_ready",
    title: "Make Capability Registry MCP-ready without exposing tool chaos",
    targetKernel: "Prime Kernel / Capability Registry",
    priority: "critical",
    requiredContracts: ["capability_access", "identity_delegation", "security_trust"],
    acceptanceCriteria: [
      "capabilities have stable ids, inputs, outputs, permissions, risk lanes, provider requirements, and audit rules",
      "tool-provider connectors are adapters, not product UI",
      "disabled or beta capabilities are visibly marked when not implemented",
    ],
    riskControls: [
      "least privilege",
      "provider terms review",
      "no fake connected-provider claims",
    ],
  },
  {
    id: "upgrade_agent_workforce_a2a_ready",
    title: "Make PantaAI Workforce A2A-ready with scoped delegation",
    targetKernel: "PantaAI Workforce / Guardian Kernel",
    priority: "critical",
    requiredContracts: ["agent_federation", "identity_delegation", "security_trust"],
    acceptanceCriteria: [
      "agents expose role, scope, authority, forbidden actions, approval requirements, and audit outputs",
      "multi-agent handoffs preserve provenance and founder escalation rules",
      "production-affecting work remains approval-gated",
    ],
    riskControls: ["founder approval", "audit replay", "temporary permission expiry"],
  },
  {
    id: "upgrade_voice_router_contract",
    title: "Create provider-agnostic Voice Router contract",
    targetKernel: "Voice / Translation / SOS / Elder",
    priority: "critical",
    requiredContracts: ["voice_audio", "connectivity_resilience", "security_trust"],
    acceptanceCriteria: [
      "speech-to-text, translation, subtitles, and text-to-speech are separate routable stages",
      "orange elder translation defaults to automatic speech language detection",
      "manual helper language is backup only",
      "emergency and medical limitations are preserved",
    ],
    riskControls: ["translation disclaimer", "provider fallback", "privacy-aware routing"],
  },
  {
    id: "upgrade_connectivity_aware_sos",
    title: "Strengthen online weak-network offline satellite-supported SOS architecture",
    targetKernel: "SOS / Off-Grid / Emergency",
    priority: "critical",
    requiredContracts: ["connectivity_resilience", "identity_delegation", "security_trust"],
    acceptanceCriteria: [
      "SOS state machine distinguishes online, weak network, offline, and satellite-supported states",
      "offline identity pack is opt-in and locally available",
      "authority dispatch and satellite rescue claims require certified provider agreements",
    ],
    riskControls: [
      "human safety gate",
      "no guaranteed rescue claim",
      "certified-provider boundary",
    ],
  },
  {
    id: "upgrade_workspace_learning_execution",
    title: "Unify learning, research, workspaces, memory, and execution verification",
    targetKernel: "PantaAI Center / Knowledge / Work",
    priority: "high",
    requiredContracts: ["learning_knowledge", "workspace_execution", "market_radar"],
    acceptanceCriteria: [
      "workspaces store project state, sources, decisions, tasks, and checkpoints",
      "research sources carry reliability and licensing tiers",
      "learning-to-income content has claim safety and disclaimers",
    ],
    riskControls: [
      "source provenance",
      "income claim safety",
      "professional advice boundary",
    ],
  },
  {
    id: "upgrade_social_media_global_benchmark_absorption",
    title:
      "Convert global social media and communication benchmarks into Pantavion-owned capability families",
    targetKernel: "Social Universe / Daily Hub / Media / Communication",
    priority: "high",
    requiredContracts: ["market_radar", "security_trust", "identity_delegation"],
    acceptanceCriteria: [
      "benchmarks are transformed into original Pantavion routes, data models, copy, policies, and UX",
      "age suitability, under-18 locks, over-18 locks, equality, moderation, and consent gates are explicit",
      "music, movies, video, photo, private channels, professional layers, and localized continent experiences are tracked as product DNA",
    ],
    riskControls: ["no copied UI", "minors policy", "copyright guard", "consent guard"],
  },
];

export function getPantavionEcosystemInteroperabilityContract() {
  return {
    id: PANTAVION_ECOSYSTEM_INTEROPERABILITY_CONTRACT_ID,
    version: "1.0.0",
    status: "architecture_contract_active",
    doctrine:
      "Pantavion remains a sovereign planetary orchestration platform. External protocols and competitors are signals and integration surfaces, not masters of the product architecture.",
    layers: interoperabilityLayers,
    standardWatch: ecosystemStandardWatch,
    upgradeWorkOrders: ecosystemUpgradeWorkOrders,
  };
}

export function getPantavionEcosystemRadarSubjects() {
  return ecosystemStandardWatch.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    priority: item.priority,
    pantavionMove: item.pantavionMove,
  }));
}