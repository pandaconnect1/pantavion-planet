export type PantavionPersonalAgentKind =
  | "life_orchestrator"
  | "memory"
  | "language"
  | "learning"
  | "work"
  | "research"
  | "creative"
  | "travel"
  | "finance_assistant"
  | "health_information"
  | "accessibility"
  | "safety"
  | "family_coordination"
  | "custom";

export interface PantavionPersonalAgentBlueprint {
  marker: "pantavion_personal_agent_blueprint_v1";
  agentId: string;
  ownerUserId: string;
  kind: PantavionPersonalAgentKind;
  purpose: string;
  lifespan: "persistent";
  memoryScope: "owner_scoped_consent_aware";
  mayShareAcrossAgents: boolean;
  shareRule: "owner_policy_and_minimum_necessary";
  authority: {
    mayReadOwnerAuthorizedMemory: true;
    mayResearch: true;
    mayDraft: true;
    mayCoordinateOtherOwnerAgents: boolean;
    maySpendMoney: false;
    maySendExternalMessageWithoutApproval: false;
    mayChangeLegalMedicalFinancialState: false;
    mayPerformIrreversiblePhysicalAction: false;
  };
  continuity: {
    checkpointed: true;
    resumable: true;
    providerPortable: true;
    modelPortable: true;
    provenanceRequired: true;
  };
}

export interface PantavionPersonalAgentMesh {
  marker: "pantavion_personal_agent_mesh_v1";
  ownerUserId: string;
  noFixedAgentLimitAtArchitectureLevel: true;
  practicalRuntimeLimitsAreQuotaAndSafetyControlled: true;
  coordinator: PantavionPersonalAgentBlueprint;
  agents: PantavionPersonalAgentBlueprint[];
  truthBoundary: string;
}

function safeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export function createPantavionPersonalAgentBlueprint(input: {
  ownerUserId: string;
  kind: PantavionPersonalAgentKind;
  purpose: string;
  mayCoordinateOtherOwnerAgents?: boolean;
  mayShareAcrossAgents?: boolean;
}): PantavionPersonalAgentBlueprint {
  if (!input.ownerUserId.trim()) throw new Error("ownerUserId is required");
  if (!input.purpose.trim()) throw new Error("purpose is required");

  return {
    marker: "pantavion_personal_agent_blueprint_v1",
    agentId: `pa-${safeId(input.ownerUserId)}-${input.kind}-${safeId(input.purpose).slice(0, 30)}`,
    ownerUserId: input.ownerUserId,
    kind: input.kind,
    purpose: input.purpose,
    lifespan: "persistent",
    memoryScope: "owner_scoped_consent_aware",
    mayShareAcrossAgents: input.mayShareAcrossAgents === true,
    shareRule: "owner_policy_and_minimum_necessary",
    authority: {
      mayReadOwnerAuthorizedMemory: true,
      mayResearch: true,
      mayDraft: true,
      mayCoordinateOtherOwnerAgents: input.mayCoordinateOtherOwnerAgents === true,
      maySpendMoney: false,
      maySendExternalMessageWithoutApproval: false,
      mayChangeLegalMedicalFinancialState: false,
      mayPerformIrreversiblePhysicalAction: false,
    },
    continuity: {
      checkpointed: true,
      resumable: true,
      providerPortable: true,
      modelPortable: true,
      provenanceRequired: true,
    },
  };
}

export function createPantavionPersonalAgentMesh(input: {
  ownerUserId: string;
  agents?: Array<{ kind: PantavionPersonalAgentKind; purpose: string }>;
}): PantavionPersonalAgentMesh {
  const coordinator = createPantavionPersonalAgentBlueprint({
    ownerUserId: input.ownerUserId,
    kind: "life_orchestrator",
    purpose: "Coordinate the owner's authorized personal Pantavion agents across life domains.",
    mayCoordinateOtherOwnerAgents: true,
    mayShareAcrossAgents: true,
  });

  const agents = (input.agents ?? []).map((agent) =>
    createPantavionPersonalAgentBlueprint({
      ownerUserId: input.ownerUserId,
      kind: agent.kind,
      purpose: agent.purpose,
      mayShareAcrossAgents: true,
    }),
  );

  return {
    marker: "pantavion_personal_agent_mesh_v1",
    ownerUserId: input.ownerUserId,
    noFixedAgentLimitAtArchitectureLevel: true,
    practicalRuntimeLimitsAreQuotaAndSafetyControlled: true,
    coordinator,
    agents,
    truthBoundary:
      "Architecture permits arbitrarily many logical personal agents, but real concurrency, compute, storage, cost and provider/model capacity are governed by quotas, safety, privacy and available infrastructure.",
  };
}
