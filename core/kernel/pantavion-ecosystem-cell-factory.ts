import type { PantavionAutonomousBuildTarget } from "./pantavion-autonomous-builder-kernel";

export type PantavionEcosystemServiceId =
  | "identity_trust"
  | "people_relationships"
  | "knowledge_memory_graph"
  | "communication_language"
  | "discovery_maps_local"
  | "commerce_entitlements"
  | "safety_governance"
  | "workflow_agent_fabric"
  | "observability_evidence"
  | "experience_accessibility";

const PANTAVION_ECOSYSTEM_SERVICE_IDS = new Set<PantavionEcosystemServiceId>([
  "identity_trust",
  "people_relationships",
  "knowledge_memory_graph",
  "communication_language",
  "discovery_maps_local",
  "commerce_entitlements",
  "safety_governance",
  "workflow_agent_fabric",
  "observability_evidence",
  "experience_accessibility",
]);

export function isPantavionEcosystemServiceId(value: string): value is PantavionEcosystemServiceId {
  return PANTAVION_ECOSYSTEM_SERVICE_IDS.has(value as PantavionEcosystemServiceId);
}

export type PantavionEcosystemServiceNeed = "required" | "conditional" | "not_applicable";

export interface PantavionEcosystemServiceContract {
  id: PantavionEcosystemServiceId;
  need: PantavionEcosystemServiceNeed;
  purpose: string;
  requiredEvidence: string[];
}

export interface PantavionEcosystemCell {
  marker: "pantavion_ecosystem_cell_v1";
  workOrderId: string;
  target: PantavionAutonomousBuildTarget;
  ownership: "pantavion_owned";
  externalWorkerDependency: false;
  sharedSpine: [
    "identity",
    "policy",
    "canonical_data",
    "outbox_events",
    "audit",
    "observability",
  ];
  services: PantavionEcosystemServiceContract[];
  completionRule: "recovered_to_canonicalized_to_backend_live_to_ui_live_to_tested_to_deployed_to_verified_live";
  generatedAt: string;
}

const BASE_EVIDENCE = [
  "scoped data and permission model",
  "real server route or function when interaction is exposed",
  "loading, empty, and error state",
  "audit and TypeScript verification",
  "production build and live verification",
];

function required(
  id: PantavionEcosystemServiceId,
  purpose: string,
  extraEvidence: string[] = [],
): PantavionEcosystemServiceContract {
  return {
    id,
    need: "required",
    purpose,
    requiredEvidence: [...BASE_EVIDENCE, ...extraEvidence],
  };
}

function conditional(
  id: PantavionEcosystemServiceId,
  purpose: string,
  extraEvidence: string[] = [],
): PantavionEcosystemServiceContract {
  return {
    id,
    need: "conditional",
    purpose,
    requiredEvidence: [...BASE_EVIDENCE, ...extraEvidence],
  };
}

function notApplicable(
  id: PantavionEcosystemServiceId,
  purpose: string,
): PantavionEcosystemServiceContract {
  return {
    id,
    need: "not_applicable",
    purpose,
    requiredEvidence: [],
  };
}

/**
 * Every new Pantavion capability receives an ecosystem cell, rather than a
 * disconnected mini-app. The cell makes the shared platform dependencies
 * explicit and carries the same truth rule for social, translation, commerce,
 * infrastructure, safety, learning and future modules.
 */
export function createPantavionEcosystemCell(input: {
  workOrderId: string;
  target: PantavionAutonomousBuildTarget;
}): PantavionEcosystemCell {
  const core = [
    required("identity_trust", "Identity, roles, consent, entitlement, and least-privilege access."),
    required("knowledge_memory_graph", "Canonical facts, evidence, memory boundaries, and no-loss continuity."),
    required("safety_governance", "Policy, moderation, age/privacy controls, founder approvals, and kill boundaries."),
    required("workflow_agent_fabric", "Pantavion-owned orchestration, controlled agents, queue, retries, and stop signals."),
    required("observability_evidence", "Audit trail, readiness, health, regressions, and live-proof evidence."),
    required("experience_accessibility", "Real mobile-first user flow with truthful loading, empty, error, and access states."),
  ];

  const byTarget: Partial<Record<PantavionAutonomousBuildTarget, PantavionEcosystemServiceContract[]>> = {
    translation: [
      required("communication_language", "Two-way text, voice, and language workflow with consent and Pantavion-controlled runtime proof."),
      conditional("people_relationships", "Conversation and contact relationship boundary when translation appears in chat."),
      notApplicable("discovery_maps_local", "Maps are not required unless interpreting a place or travel flow."),
      notApplicable("commerce_entitlements", "Commerce is not a baseline translation requirement."),
    ],
    social_universe: [
      required("people_relationships", "Profiles, contacts, relationships, communities, chats, and audience rules."),
      required("communication_language", "Messages, notifications, and multilingual communication boundary."),
      conditional("discovery_maps_local", "Nearby and local discovery only with explicit location consent."),
      conditional("commerce_entitlements", "Internal listings and ads only after entitlement and billing truth exists."),
    ],
    marketplace: [
      required("people_relationships", "Seller/buyer identity and trustworthy relationship boundary."),
      conditional("communication_language", "Messages and multilingual listing workflows."),
      required("commerce_entitlements", "Listings, paid promotion, usage, and payment boundary with explicit evidence."),
      conditional("discovery_maps_local", "Local service and place discovery when geographically relevant."),
    ],
    water_infrastructure: [
      conditional("people_relationships", "Role-based staff, crews, citizens, and authority visibility."),
      conditional("communication_language", "Multilingual field, incident, and public notices."),
      required("discovery_maps_local", "Private asset, incident, map, and field-task control with no public raw infrastructure exposure."),
      notApplicable("commerce_entitlements", "Commerce is not a baseline infrastructure requirement."),
    ],
    sos_elder: [
      conditional("people_relationships", "Consent-driven caregiver, contact, and escalation boundary."),
      required("communication_language", "Accessible multilingual communication and interpreter safety."),
      conditional("discovery_maps_local", "Location only with explicit emergency policy and evidence."),
      notApplicable("commerce_entitlements", "Commerce is not a baseline SOS requirement."),
    ],
    pantaai_center: [
      conditional("people_relationships", "Per-user context only under privacy and memory policy."),
      conditional("communication_language", "Language-aware commands and accessible interaction."),
      conditional("discovery_maps_local", "Only when a work order declares maps or local service scope."),
      conditional("commerce_entitlements", "Only when a plan/usage feature requires deterministic entitlements."),
    ],
  };

  return {
    marker: "pantavion_ecosystem_cell_v1",
    workOrderId: input.workOrderId,
    target: input.target,
    ownership: "pantavion_owned",
    externalWorkerDependency: false,
    sharedSpine: [
      "identity",
      "policy",
      "canonical_data",
      "outbox_events",
      "audit",
      "observability",
    ],
    services: [...core, ...(byTarget[input.target] ?? [
      conditional("people_relationships", "Connect people and roles only when the target needs them."),
      conditional("communication_language", "Connect language and communication only when the target needs them."),
      conditional("discovery_maps_local", "Connect maps and local discovery only when the target needs them."),
      conditional("commerce_entitlements", "Connect commerce and entitlements only when the target needs them."),
    ])],
    completionRule: "recovered_to_canonicalized_to_backend_live_to_ui_live_to_tested_to_deployed_to_verified_live",
    generatedAt: new Date().toISOString(),
  };
}
