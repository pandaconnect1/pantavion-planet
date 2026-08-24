import type { PantavionOwnedAgentRole } from "./pantavion-agent-factory";
import type { PantavionAutonomousBuildTarget } from "./pantavion-autonomous-builder-kernel";
import type { PantavionEcosystemServiceId } from "./pantavion-ecosystem-cell-factory";

export type PantavionModuleId =
  | "identity_trust"
  | "people"
  | "contacts"
  | "chat"
  | "voice_video"
  | "pulse"
  | "social"
  | "business"
  | "dating"
  | "events"
  | "marketplace"
  | "interpreter_travel"
  | "translation"
  | "audio_radio"
  | "compass"
  | "mind"
  | "pantalearn"
  | "ads_center"
  | "maps_infrastructure_city"
  | "app_service_engine"
  | "institutional_workflows"
  | "crisis_humanitarian"
  | "sos_elder"
  | "media"
  | "knowledge_graph_memory"
  | "commerce_entitlements"
  | "safety_governance"
  | "guardian_kernel"
  | "pantaai_center"
  | "foundry_operations";

export interface PantavionModuleDeliveryCell {
  marker: "pantavion_module_delivery_cell_v1";
  workOrderId: string;
  moduleId: PantavionModuleId;
  displayName: string;
  userOutcome: string;
  requiredServices: PantavionEcosystemServiceId[];
  requiredInternalRoles: PantavionOwnedAgentRole[];
  runtimeObligations: string[];
  proofRequirements: string[];
  promotionBoundary: {
    mayPrepareInternalPlan: true;
    maySendExternalMessages: false;
    mayBuyMediaOrServices: false;
    mayPublishPublicCampaign: false;
    requiresFounderApprovalForExternalAction: true;
  };
  externalWorkerDependency: false;
  completionRule: "backend_live_ui_live_tested_deployed_verified_live";
  generatedAt: string;
}

export interface PantavionAgentModuleDeliveryAssignment {
  marker: "pantavion_agent_module_delivery_assignment_v1";
  workOrderId: string;
  assignedRole: PantavionOwnedAgentRole;
  moduleIds: PantavionModuleId[];
  requiredServiceIds: PantavionEcosystemServiceId[];
  externalWorkerAllowed: false;
  promotionBoundary: PantavionModuleDeliveryCell["promotionBoundary"];
}

type ModuleDefinition = Omit<
  PantavionModuleDeliveryCell,
  "marker" | "workOrderId" | "promotionBoundary" | "externalWorkerDependency" | "completionRule" | "generatedAt"
>;

const ALL_INTERNAL_ROLES: PantavionOwnedAgentRole[] = [
  "orchestrator",
  "sentinel",
  "classifier",
  "planner",
  "researcher",
  "builder",
  "auditor",
  "verifier",
  "repairer",
  "memory_guard",
];

const SHARED_PROOF = [
  "canonical data/permission model",
  "real runtime route or worker path",
  "mobile user flow with loading, empty, and error states",
  "audit, TypeScript, and build result",
  "deployed live proof before public completion claim",
];

function defineModule(
  moduleId: PantavionModuleId,
  displayName: string,
  userOutcome: string,
  requiredServices: PantavionEcosystemServiceId[],
  runtimeObligations: string[],
  requiredInternalRoles: PantavionOwnedAgentRole[] = ALL_INTERNAL_ROLES,
): ModuleDefinition {
  return {
    moduleId,
    displayName,
    userOutcome,
    requiredServices,
    requiredInternalRoles,
    runtimeObligations,
    proofRequirements: [...SHARED_PROOF, ...runtimeObligations],
  };
}

const MODULES: Record<PantavionModuleId, ModuleDefinition> = {
  identity_trust: defineModule("identity_trust", "Identity & Trust", "One protected account, consent, roles, and safety-aware access.", ["identity_trust", "safety_governance", "observability_evidence"], ["real authentication and authorization boundary", "age/trust policy evidence"]),
  people: defineModule("people", "People", "Find and manage people through consent-aware profiles and relationships.", ["identity_trust", "people_relationships", "knowledge_memory_graph"], ["relationship permission enforcement"]),
  contacts: defineModule("contacts", "Contacts", "Consent-based contact import, matching, and control.", ["identity_trust", "people_relationships", "safety_governance"], ["source consent and deduplicated contact record"]),
  chat: defineModule("chat", "Chat", "Private, governed conversations with truthful delivery states.", ["identity_trust", "people_relationships", "communication_language", "safety_governance"], ["message command and recipient policy path"]),
  voice_video: defineModule("voice_video", "Voice & Video", "Accessible calls with privacy, consent, and fallback behavior.", ["identity_trust", "communication_language", "safety_governance"], ["real calling/transcription provider or clear disabled boundary"]),
  pulse: defineModule("pulse", "Pulse", "Verified and governed public awareness updates.", ["identity_trust", "knowledge_memory_graph", "safety_governance", "observability_evidence"], ["publication moderation and source provenance"]),
  social: defineModule("social", "Social", "A governed social home for posts, communities, and relationships.", ["identity_trust", "people_relationships", "communication_language", "safety_governance"], ["real post/reaction/comment data flow"]),
  business: defineModule("business", "Business", "Business presence and operational collaboration inside Pantavion.", ["identity_trust", "people_relationships", "commerce_entitlements"], ["organization role and entitlement enforcement"]),
  dating: defineModule("dating", "Dating", "Age-safe, consent-driven discovery and matching.", ["identity_trust", "people_relationships", "safety_governance"], ["age gate, discoverability policy, and abuse-report handling"]),
  events: defineModule("events", "Events", "Safe local and global event discovery and participation.", ["identity_trust", "people_relationships", "discovery_maps_local", "safety_governance"], ["event permissions and attendance state"]),
  marketplace: defineModule("marketplace", "Marketplace", "Trusted listings, buyer/seller communication, and real entitlement state.", ["identity_trust", "people_relationships", "commerce_entitlements", "safety_governance"], ["listing command path and transaction/entitlement boundary"]),
  interpreter_travel: defineModule("interpreter_travel", "Interpreter & Travel", "Two-way language support for people, services, and travel.", ["identity_trust", "communication_language", "discovery_maps_local", "safety_governance"], ["real translation/runtime availability or explicit disabled state"]),
  translation: defineModule("translation", "Translation", "Two-way text and voice translation with preserved original meaning.", ["communication_language", "knowledge_memory_graph", "observability_evidence"], ["provider/runtime health evidence", "source and translated content boundary"]),
  audio_radio: defineModule("audio_radio", "Audio & Radio", "Voice, audio, and radio experiences with rights and safety controls.", ["identity_trust", "knowledge_memory_graph", "safety_governance"], ["rights policy and real playback/publishing path"]),
  compass: defineModule("compass", "Compass", "Discover people, places, services, and categories responsibly.", ["identity_trust", "discovery_maps_local", "knowledge_memory_graph", "safety_governance"], ["location consent and ranking evidence"]),
  mind: defineModule("mind", "Mind", "Personal wellbeing support with clear non-medical boundaries.", ["identity_trust", "knowledge_memory_graph", "safety_governance"], ["safety escalation and non-diagnostic disclosure"]),
  pantalearn: defineModule("pantalearn", "PantaLearn", "Learning paths, evidence, and progress.", ["identity_trust", "knowledge_memory_graph", "experience_accessibility"], ["course/progress persistence and accessibility evidence"]),
  ads_center: defineModule("ads_center", "Ads Center", "Only internal paid listings and ads with measurable entitlement rules.", ["identity_trust", "commerce_entitlements", "observability_evidence", "safety_governance"], ["no external ad network dependency", "campaign approval and measurement path"]),
  maps_infrastructure_city: defineModule("maps_infrastructure_city", "Maps, Infrastructure & City", "Permission-controlled city and infrastructure intelligence.", ["identity_trust", "discovery_maps_local", "knowledge_memory_graph", "safety_governance"], ["private infrastructure access boundary", "map/data provenance"]),
  app_service_engine: defineModule("app_service_engine", "App & Service Engine", "Build governed services from reusable Pantavion blueprints.", ["identity_trust", "workflow_agent_fabric", "commerce_entitlements", "observability_evidence"], ["blueprint permissions, versioning, and runtime evidence"]),
  institutional_workflows: defineModule("institutional_workflows", "Institutional Workflows", "Auditable organizational workflows with role control.", ["identity_trust", "workflow_agent_fabric", "observability_evidence", "safety_governance"], ["command/audit/outbox path"]),
  crisis_humanitarian: defineModule("crisis_humanitarian", "Crisis & Humanitarian", "Verified, multilingual crisis coordination without false authority claims.", ["identity_trust", "communication_language", "safety_governance", "observability_evidence"], ["verified source and escalation evidence"]),
  sos_elder: defineModule("sos_elder", "SOS & Elder", "Consent-driven safety support with clear emergency boundaries.", ["identity_trust", "people_relationships", "communication_language", "safety_governance"], ["emergency policy and caregiver consent evidence"]),
  media: defineModule("media", "Media", "Personal and public media with rights, consent, and retention control.", ["identity_trust", "knowledge_memory_graph", "safety_governance"], ["storage policy and media authorization"]),
  knowledge_graph_memory: defineModule("knowledge_graph_memory", "Knowledge, Graph & Memory", "Canonical facts, provenance, continuity, and no-loss recovery.", ["knowledge_memory_graph", "observability_evidence", "safety_governance"], ["canonical record and source/evidence links"]),
  commerce_entitlements: defineModule("commerce_entitlements", "Commerce & Entitlements", "Truthful plans, usage, and monetization control.", ["identity_trust", "commerce_entitlements", "observability_evidence"], ["deterministic entitlement and billing-proof boundary"]),
  safety_governance: defineModule("safety_governance", "Safety & Governance", "Human-first policy, moderation, consent, and kill boundaries.", ["identity_trust", "safety_governance", "observability_evidence"], ["policy decision and audit evidence"]),
  guardian_kernel: defineModule("guardian_kernel", "Guardian Kernel", "Continuous health, gap, audit, and stop control.", ["workflow_agent_fabric", "observability_evidence", "safety_governance"], ["real protected route and scheduler proof"]),
  pantaai_center: defineModule("pantaai_center", "PantaAI Center", "A governed command center that turns intention into scoped work.", ["workflow_agent_fabric", "knowledge_memory_graph", "safety_governance", "observability_evidence"], ["durable work order and approval/stop path"]),
  foundry_operations: defineModule("foundry_operations", "Pantavion Foundry", "Internal multi-specialist runtime for recovery, implementation, audit, and repair.", ["workflow_agent_fabric", "knowledge_memory_graph", "safety_governance", "observability_evidence"], ["Pantavion-owned runtime configuration", "durable partition checkpoints", "internal agent evidence"]),
};

const TARGET_MODULES: Record<PantavionAutonomousBuildTarget, PantavionModuleId[]> = {
  pantavion_internal: ["guardian_kernel", "pantaai_center", "foundry_operations", "knowledge_graph_memory", "safety_governance"],
  external_app: ["app_service_engine", "identity_trust", "commerce_entitlements", "safety_governance"],
  api_integration: ["app_service_engine", "knowledge_graph_memory", "guardian_kernel"],
  admin_tool: ["guardian_kernel", "institutional_workflows", "safety_governance", "pantaai_center"],
  safety_system: ["safety_governance", "guardian_kernel", "sos_elder", "crisis_humanitarian"],
  water_infrastructure: ["maps_infrastructure_city", "institutional_workflows", "guardian_kernel", "knowledge_graph_memory"],
  sos_elder: ["sos_elder", "crisis_humanitarian", "translation", "chat"],
  translation: ["translation", "interpreter_travel", "chat", "voice_video"],
  marketplace: ["marketplace", "business", "ads_center", "commerce_entitlements"],
  social_universe: ["social", "people", "contacts", "chat", "pulse", "dating", "events"],
  pantaai_center: ["pantaai_center", "guardian_kernel", "foundry_operations", "knowledge_graph_memory"],
};

const PROMOTION_BOUNDARY = {
  mayPrepareInternalPlan: true,
  maySendExternalMessages: false,
  mayBuyMediaOrServices: false,
  mayPublishPublicCampaign: false,
  requiresFounderApprovalForExternalAction: true,
} as const;

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

/**
 * Every target maps to the Pantavion modules it must actually serve. The cell
 * is a delivery contract, not a claim that a module is already live.
 */
export function createPantavionModuleDeliveryCells(input: {
  workOrderId: string;
  target: PantavionAutonomousBuildTarget;
}): PantavionModuleDeliveryCell[] {
  return TARGET_MODULES[input.target].map((moduleId) => ({
    marker: "pantavion_module_delivery_cell_v1",
    workOrderId: input.workOrderId,
    ...MODULES[moduleId],
    promotionBoundary: PROMOTION_BOUNDARY,
    externalWorkerDependency: false,
    completionRule: "backend_live_ui_live_tested_deployed_verified_live",
    generatedAt: new Date().toISOString(),
  }));
}

export function createPantavionAgentModuleDeliveryAssignment(input: {
  workOrderId: string;
  role: PantavionOwnedAgentRole;
  cells: PantavionModuleDeliveryCell[];
}): PantavionAgentModuleDeliveryAssignment {
  return {
    marker: "pantavion_agent_module_delivery_assignment_v1",
    workOrderId: input.workOrderId,
    assignedRole: input.role,
    moduleIds: input.cells
      .filter((cell) => cell.requiredInternalRoles.includes(input.role))
      .map((cell) => cell.moduleId),
    requiredServiceIds: unique(input.cells.flatMap((cell) => cell.requiredServices)),
    externalWorkerAllowed: false,
    promotionBoundary: PROMOTION_BOUNDARY,
  };
}

export const pantavionModuleDeliveryCatalog = Object.freeze(
  Object.fromEntries(
    Object.entries(MODULES).map(([id, module]) => [id, { displayName: module.displayName }]),
  ),
);

const MODULE_ID_SET = new Set<PantavionModuleId>(Object.keys(MODULES) as PantavionModuleId[]);

export function isPantavionModuleId(value: string): value is PantavionModuleId {
  return MODULE_ID_SET.has(value as PantavionModuleId);
}
