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
    whyItMatters: "Pantavion needs provider-neutral capability access instead of hard-coded tool wrappers.",
    pantavionMove: "Keep the Capability Registry ready for MCP-style resources, permissions, streaming, and server discovery.",
    boundary: "Do not claim production compatibility until authentication, authorization, testing, provider terms, and runtime connectors exist.",
  },
  {
    id: "watch_a2a_agent_federation",
    name: "A2A-ready agent federation",
    category: "agent_collaboration",
    priority: "critical",
    whyItMatters: "Agent-to-agent coordination is becoming separate from tool access.",
    pantavionMove: "Represent PantaAI Workforce as an agent mesh with explicit roles, authority, delegation, audit, and founder approval boundaries.",
    boundary: "Agents must not execute production, legal, payment, safety, or infrastructure actions without authority checks.",
  },
  {
    id: "watch_identity_delegation",
    name: "Verifiable agent identity and delegation",
    category: "security_trust",
    priority: "critical",
    whyItMatters: "Agent ecosystems need proof of who acted, under whose authority, with what permission, and with what evidence.",
    pantavionMove: "Build a Pantavion Identity and Delegation Fabric with signed capability chains, temporary permissions, provenance, audit replay, and revocation.",
    boundary: "Never allow invisible authority escalation, unbounded delegation, or unaudited agent execution.",
  },
  {
    id: "watch_realtime_voice_translation",
    name: "Realtime voice, audio, subtitles, and translation",
    category: "voice_audio_language",
    priority: "critical",
    whyItMatters: "Realtime multilingual voice is core to Pantavion SOS, elder mode, work, travel, social, and public services.",
    pantavionMove: "Create a Pantavion Voice Router that chooses speech-to-text, translation, subtitles, and text-to-speech providers by latency, cost, privacy, jurisdiction, modality, and emergency mode.",
    boundary: "Translation remains assistive and must not claim perfect legal, medical, or emergency accuracy.",
  },
  {
    id: "watch_satellite_ntn_d2c",
    name: "Satellite, NTN, and direct-to-cell connectivity",
    category: "connectivity_resilience",
    priority: "critical",
    whyItMatters: "Online, weak-network, offline, satellite-supported, and direct-to-cell states matter for SOS and remote-area continuity.",
    pantavionMove: "Keep SOS connection-aware with an offline emergency identity pack and certified-provider roadmap.",
    boundary: "Do not claim Pantavion is a certified beacon, authority dispatch service, or guaranteed satellite rescue system without certified agreements.",
  },
];

export const interoperabilityLayers: PantavionInteroperabilityLayer[] = [
  {
    id: "layer_capability_access_mcp_ready",
    kind: "capability_access",
    name: "MCP-ready Capability Access Layer",
    purpose: "Expose Pantavion capabilities as governed actions, resources, and contexts.",
    mustSupport: ["capability registry", "permission scopes", "provider abstraction", "streaming-ready contracts"],
    mustNeverClaim: ["production compatibility before connectors and auth exist"],
    founderGate: true,
  },
  {
    id: "layer_agent_federation_a2a_ready",
    kind: "agent_federation",
    name: "A2A-ready Agent Federation Layer",
    purpose: "Coordinate PantaAI digital employees and specialist agents without uncontrolled autonomy.",
    mustSupport: ["agent role registry", "authority scopes", "task handoff", "multi-agent audit trail"],
    mustNeverClaim: ["autonomous production control without approval gates"],
    founderGate: true,
  },
  {
    id: "layer_identity_delegation_fabric",
    kind: "identity_delegation",
    name: "Pantavion Identity and Delegation Fabric",
    purpose: "Verify who acts, under what delegated authority, with what evidence.",
    mustSupport: ["signed agent execution", "temporary permissions", "least privilege", "revocation", "provenance graph", "audit replay"],
    mustNeverClaim: ["invisible unlimited agent authority"],
    founderGate: true,
  },
  {
    id: "layer_voice_router",
    kind: "voice_audio",
    name: "Pantavion Voice Router",
    purpose: "Route speech recognition, realtime translation, subtitles, voice synthesis, and audio reasoning.",
    mustSupport: ["automatic speech language detection", "manual helper-language backup", "low-latency streaming", "subtitle output", "privacy-aware routing", "emergency mode routing"],
    mustNeverClaim: ["perfect translation", "medical or legal replacement", "guaranteed emergency interpretation"],
    founderGate: true,
  },
  {
    id: "layer_connectivity_aware_sos",
    kind: "connectivity_resilience",
    name: "Connectivity-aware SOS and Off-Grid Layer",
    purpose: "Keep Pantavion usable across online, weak-network, offline, and certified satellite-supported states.",
    mustSupport: ["offline emergency identity pack", "local event queue", "weak-network sync", "satellite-supported provider roadmap", "institutional integration boundary"],
    mustNeverClaim: ["certified beacon status", "automatic authority dispatch", "guaranteed rescue"],
    founderGate: true,
  },
];

export const ecosystemUpgradeWorkOrders: PantavionEcosystemUpgradeWorkOrder[] = [
  {
    id: "upgrade_capability_registry_mcp_ready",
    title: "Make Capability Registry MCP-ready without exposing tool chaos",
    targetKernel: "Prime Kernel / Capability Registry",
    priority: "critical",
    requiredContracts: ["capability_access", "identity_delegation", "security_trust"],
    acceptanceCriteria: ["stable capability ids", "permission scopes", "provider abstraction", "audit rules"],
    riskControls: ["least privilege", "provider terms review", "no fake connected-provider claims"],
  },
  {
    id: "upgrade_voice_router_contract",
    title: "Create provider-agnostic Voice Router contract",
    targetKernel: "Voice / Translation / SOS / Elder",
    priority: "critical",
    requiredContracts: ["voice_audio", "connectivity_resilience", "security_trust"],
    acceptanceCriteria: ["separate speech-to-text translation subtitles and text-to-speech stages", "automatic speech language detection by default", "manual helper language as backup"],
    riskControls: ["translation disclaimer", "provider fallback", "privacy-aware routing"],
  },
];

export function getPantavionEcosystemInteroperabilityContract() {
  return {
    id: PANTAVION_ECOSYSTEM_INTEROPERABILITY_CONTRACT_ID,
    version: "1.0.1",
    status: "architecture_contract_active",
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