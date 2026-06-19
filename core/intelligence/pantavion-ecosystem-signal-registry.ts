export type PantavionEcosystemSignalDomain =
  | "agent_interoperability"
  | "ai_models"
  | "voice_audio_translation"
  | "satellite_connectivity"
  | "security_supply_chain"
  | "generative_ui"
  | "repo_ci_cd"
  | "learning_workspace"
  | "offline_maintenance";

export type PantavionCapabilityStatus =
  | "internal"
  | "beta"
  | "provider_required"
  | "data_source_required"
  | "founder_approval_required"
  | "disabled";

export type PantavionSignalImportance = "watch" | "important" | "critical";

export interface PantavionSourceReference {
  label: string;
  url: string;
  reliabilityTier: "official" | "standards_track" | "research" | "market_signal";
  licensingBoundary: string;
}

export interface PantavionCapabilityProposal {
  id: string;
  title: string;
  targetRoute: string | null;
  targetCoreModule: string;
  realRouteRequired: boolean;
  realLogicRequired: boolean;
  realStateDataFlowRequired: boolean;
  providerOrDataSourceRequired: "none" | "provider_required" | "data_source_required";
  clearDisabledBetaInternalStatusRequired: boolean;
  greenAuditBuildTypecheckRequired: boolean;
  founderApprovalRequiredForSensitiveChanges: boolean;
  sensitiveChange: boolean;
  status: PantavionCapabilityStatus;
  implementationActions: string[];
}

export interface PantavionEcosystemSignal {
  id: string;
  duplicateKey: string;
  observedAt: string;
  importance: PantavionSignalImportance;
  domain: PantavionEcosystemSignalDomain;
  pantavionSections: string[];
  summary: string;
  materialChange: string;
  risks: string[];
  sourceRefs: PantavionSourceReference[];
  proposals: PantavionCapabilityProposal[];
}

export interface PantavionCapabilityEvaluation {
  proposalId: string;
  canMoveToBuild: boolean;
  status: "blocked" | "ready_for_internal_build";
  blockingReasons: string[];
  requiredGates: string[];
}

export const pantavionCapabilityReadinessChecklist = {
  id: "pantavion_capability_readiness_checklist_v1",
  realRouteRequired: true,
  realLogicRequired: true,
  realStateDataFlowRequired: true,
  providerOrDataSourceRequired: true,
  clearDisabledBetaInternalStatusRequired: true,
  greenAuditBuildTypecheckRequired: true,
  founderApprovalRequiredForSensitiveChanges: true,
  noStaticFunctions: true,
  noFakeFeatures: true,
  noDeadButtons: true,
  noPlaceholderOnlyRoutes: true,
} as const;

export const pantavionEcosystemSignalRegistryV1 = {
  id: "pantavion_ecosystem_signal_registry_v1",
  purpose:
    "Convert important non-duplicate ecosystem findings into real Pantavion capability work orders with route, logic, state, provider, audit, build, typecheck, and founder-approval requirements.",
  notificationRule:
    "Only notify the founder with important non-duplicate findings or material changes; do not stack repeated reminders.",
  dailyBriefLanguage: "el",
  signals: [
    {
      id: "signal_agent_interop_mcp_a2a_identity_v1",
      duplicateKey: "agent_interop_mcp_a2a_identity",
      observedAt: "2026-06-12",
      importance: "critical",
      domain: "agent_interoperability",
      pantavionSections: ["PantaAI Center", "Kernel", "Security", "Provider Registry"],
      summary:
        "Agent interoperability is becoming a platform layer. Pantavion needs protocol registration, identity, scoped delegation, audit, and provider status before any agent can execute actions.",
      materialChange:
        "Agent-to-tool and agent-to-agent patterns must be treated as execution infrastructure rather than UI features.",
      risks: [
        "Unscoped tool execution",
        "Agent identity spoofing",
        "Missing audit provenance",
        "Provider lock-in",
      ],
      sourceRefs: [
        {
          label: "MCP ecosystem signal",
          url: "https://modelcontextprotocol.io/",
          reliabilityTier: "official",
          licensingBoundary: "Use as protocol integration signal only; do not copy vendor assets or claims.",
        },
        {
          label: "A2A protocol ecosystem signal",
          url: "https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/",
          reliabilityTier: "official",
          licensingBoundary: "Use as interoperability signal only; Pantavion keeps original registry and policy contracts.",
        },
      ],
      proposals: [
        {
          id: "proposal_agent_protocol_registry_v1",
          title: "Agent Protocol Registry and Delegation Policy",
          targetRoute: null,
          targetCoreModule: "core/ai/pantavion-agent-protocol-registry.ts",
          realRouteRequired: false,
          realLogicRequired: true,
          realStateDataFlowRequired: true,
          providerOrDataSourceRequired: "provider_required",
          clearDisabledBetaInternalStatusRequired: true,
          greenAuditBuildTypecheckRequired: true,
          founderApprovalRequiredForSensitiveChanges: true,
          sensitiveChange: true,
          status: "internal",
          implementationActions: [
            "Register MCP, A2A, identity, and delegation boundaries.",
            "Block production execution unless permissions, audit, provider status, and founder approval are present.",
          ],
        },
      ],
    },
    {
      id: "signal_realtime_voice_translation_v1",
      duplicateKey: "realtime_voice_translation_runtime",
      observedAt: "2026-06-12",
      importance: "critical",
      domain: "voice_audio_translation",
      pantavionSections: ["Universal Communication", "SOS", "Elder", "Interpreter"],
      summary:
        "Realtime voice, transcription, and streaming translation should be modeled as a runtime contract with automatic speech detection first and manual helper language as backup.",
      materialChange:
        "Translation must expose provider-required status and emergency/legal limitations before public claims.",
      risks: [
        "False medical or legal translation guarantee",
        "Wrong helper language default in elder/SOS mode",
        "Provider cost and latency spikes",
        "Consent gaps for microphone/audio processing",
      ],
      sourceRefs: [
        {
          label: "Realtime translation API signal",
          url: "https://platform.openai.com/docs/guides/realtime-transcription",
          reliabilityTier: "official",
          licensingBoundary: "Provider documentation signal only; adapter must follow provider terms and user consent.",
        },
      ],
      proposals: [
        {
          id: "proposal_translation_runtime_contract_v1",
          title: "Realtime Translation Runtime Contract",
          targetRoute: "/api/translation/realtime/session",
          targetCoreModule: "core/communication/pantavion-translation-runtime-contract.ts",
          realRouteRequired: true,
          realLogicRequired: true,
          realStateDataFlowRequired: true,
          providerOrDataSourceRequired: "provider_required",
          clearDisabledBetaInternalStatusRequired: true,
          greenAuditBuildTypecheckRequired: true,
          founderApprovalRequiredForSensitiveChanges: true,
          sensitiveChange: true,
          status: "provider_required",
          implementationActions: [
            "Create route that returns provider-required or adapter-not-implemented until a real provider is wired.",
            "Preserve assistive translation limitation text for SOS, elder, medical, and legal contexts.",
          ],
        },
      ],
    },
    {
      id: "signal_connectivity_resilience_satellite_v1",
      duplicateKey: "connectivity_resilience_satellite_sos",
      observedAt: "2026-06-12",
      importance: "important",
      domain: "satellite_connectivity",
      pantavionSections: ["SOS", "Off-Grid", "Infrastructure", "Runtime Safety"],
      summary:
        "Satellite and disaster connectivity should be represented as connection-aware resilience states, not as a rescue guarantee.",
      materialChange:
        "Pantavion SOS needs online, weak, offline, and satellite-supported states with certified provider boundaries.",
      risks: [
        "False authority dispatch claim",
        "False satellite rescue claim",
        "Offline data staleness",
        "Uncertified hardware/provider assumptions",
      ],
      sourceRefs: [
        {
          label: "Disaster connectivity market signal",
          url: "https://www.starlink.com/business/direct-to-cell",
          reliabilityTier: "market_signal",
          licensingBoundary: "Use as resilience trend only; certification, jurisdiction, and provider contracts remain required.",
        },
      ],
      proposals: [
        {
          id: "proposal_connection_aware_sos_v1",
          title: "Connection-Aware SOS Runtime States",
          targetRoute: "/sos",
          targetCoreModule: "core/sos/pantavion-sos-ai-center.ts",
          realRouteRequired: true,
          realLogicRequired: true,
          realStateDataFlowRequired: true,
          providerOrDataSourceRequired: "provider_required",
          clearDisabledBetaInternalStatusRequired: true,
          greenAuditBuildTypecheckRequired: true,
          founderApprovalRequiredForSensitiveChanges: true,
          sensitiveChange: true,
          status: "internal",
          implementationActions: [
            "Keep certified-provider boundary for satellite-supported states.",
            "Do not claim emergency dispatch or rescue without contracts.",
          ],
        },
      ],
    },
    {
      id: "signal_supply_chain_provenance_ci_v1",
      duplicateKey: "ci_cd_supply_chain_provenance",
      observedAt: "2026-06-12",
      importance: "critical",
      domain: "security_supply_chain",
      pantavionSections: ["Kernel", "CI/CD", "Runtime Safety", "Repo Safety"],
      summary:
        "Build provenance, scoped commits, and CI guardrails must become mandatory before merge or deployment.",
      materialChange:
        "Capability expansion must be blocked unless audit, typecheck, build, scoped diff review, and founder approval rules pass.",
      risks: [
        "Unknown untracked files",
        "Direct main mutation without checks",
        "Build artifact tampering",
        "Green local status confused with production truth",
      ],
      sourceRefs: [
        {
          label: "GitHub artifact attestation signal",
          url: "https://docs.github.com/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds",
          reliabilityTier: "official",
          licensingBoundary: "Use official CI/CD guidance; implementation must fit Pantavion repository policy.",
        },
      ],
      proposals: [
        {
          id: "proposal_capability_readiness_gate_v1",
          title: "Capability Readiness Gate",
          targetRoute: null,
          targetCoreModule: "scripts/pantavion-capability-readiness-gate.cjs",
          realRouteRequired: false,
          realLogicRequired: true,
          realStateDataFlowRequired: true,
          providerOrDataSourceRequired: "none",
          clearDisabledBetaInternalStatusRequired: true,
          greenAuditBuildTypecheckRequired: true,
          founderApprovalRequiredForSensitiveChanges: true,
          sensitiveChange: false,
          status: "internal",
          implementationActions: [
            "Fail builds when required capability contracts or routes are missing.",
            "Wire the gate into verify:runtime-safety before typecheck and build.",
          ],
        },
      ],
    },
    {
      id: "signal_generative_ui_safety_v1",
      duplicateKey: "generative_ui_runtime_safety",
      observedAt: "2026-06-12",
      importance: "important",
      domain: "generative_ui",
      pantavionSections: ["UI", "PantaAI", "Capability Registry", "Product DNA"],
      summary:
        "Agent-generated UI is useful only when it is backed by real routes, server actions, state, permissions, and disabled/beta/internal labels.",
      materialChange:
        "Pantavion must block public UI generation that creates dead buttons or visual-only claims.",
      risks: [
        "Fake feature surfaces",
        "Dead routes",
        "Unpermissioned actions",
        "Unsupported global claims",
      ],
      sourceRefs: [
        {
          label: "Generative UI standards signal",
          url: "https://developers.googleblog.com/",
          reliabilityTier: "market_signal",
          licensingBoundary: "Use as design-system trend only; no copying layouts or brand expression.",
        },
      ],
      proposals: [
        {
          id: "proposal_generated_ui_capability_rules_v1",
          title: "Generated UI Capability Rules",
          targetRoute: null,
          targetCoreModule: "core/intelligence/pantavion-ecosystem-signal-registry.ts",
          realRouteRequired: false,
          realLogicRequired: true,
          realStateDataFlowRequired: true,
          providerOrDataSourceRequired: "none",
          clearDisabledBetaInternalStatusRequired: true,
          greenAuditBuildTypecheckRequired: true,
          founderApprovalRequiredForSensitiveChanges: true,
          sensitiveChange: false,
          status: "internal",
          implementationActions: [
            "Require every generated UI capability to reference an existing route or explicit disabled/beta/internal state.",
            "Add audit markers for no fake/static/dead button capabilities.",
          ],
        },
      ],
    },
  ] satisfies PantavionEcosystemSignal[],
} as const;

export function getPantavionEcosystemSignals(filters?: {
  domain?: PantavionEcosystemSignalDomain;
  minimumImportance?: PantavionSignalImportance;
  includeWatch?: boolean;
}) {
  const importanceRank: Record<PantavionSignalImportance, number> = {
    watch: 1,
    important: 2,
    critical: 3,
  };

  const minimumRank = filters?.minimumImportance
    ? importanceRank[filters.minimumImportance]
    : filters?.includeWatch
      ? importanceRank.watch
      : importanceRank.important;

  const uniqueSignals = new Map<string, PantavionEcosystemSignal>();

  for (const signal of pantavionEcosystemSignalRegistryV1.signals) {
    if (filters?.domain && signal.domain !== filters.domain) continue;
    if (importanceRank[signal.importance] < minimumRank) continue;
    if (!uniqueSignals.has(signal.duplicateKey)) {
      uniqueSignals.set(signal.duplicateKey, signal);
    }
  }

  return Array.from(uniqueSignals.values());
}

export function evaluatePantavionCapabilityProposal(
  proposal: PantavionCapabilityProposal,
): PantavionCapabilityEvaluation {
  const blockingReasons: string[] = [];

  if (proposal.realRouteRequired && !proposal.targetRoute) {
    blockingReasons.push("A visible or callable capability requires a real route.");
  }

  if (!proposal.realLogicRequired) {
    blockingReasons.push("Capability is missing real execution logic.");
  }

  if (!proposal.realStateDataFlowRequired) {
    blockingReasons.push("Capability is missing real state or data-flow contract.");
  }

  if (
    proposal.providerOrDataSourceRequired !== "none" &&
    proposal.status !== "provider_required" &&
    proposal.status !== "data_source_required" &&
    proposal.status !== "beta" &&
    proposal.status !== "internal"
  ) {
    blockingReasons.push("Provider or data source is required before production status.");
  }

  if (!proposal.clearDisabledBetaInternalStatusRequired) {
    blockingReasons.push("Capability must expose disabled, beta, internal, or provider-required status until complete.");
  }

  if (!proposal.greenAuditBuildTypecheckRequired) {
    blockingReasons.push("Capability must require green audit, build, and typecheck before merge or deploy.");
  }

  if (proposal.sensitiveChange && !proposal.founderApprovalRequiredForSensitiveChanges) {
    blockingReasons.push("Sensitive changes require founder approval.");
  }

  return {
    proposalId: proposal.id,
    canMoveToBuild: blockingReasons.length === 0,
    status: blockingReasons.length === 0 ? "ready_for_internal_build" : "blocked",
    blockingReasons,
    requiredGates: [
      "npm run audit:capability-readiness",
      "npm run audit:pantavion",
      "npm run typecheck",
      "npm run build",
      "scoped diff review",
    ],
  };
}

export function createPantavionDailyEcosystemBrief(date = new Date()) {
  const signals = getPantavionEcosystemSignals({ minimumImportance: "important" });
  const proposals = signals.flatMap((signal) => signal.proposals);
  const evaluations = proposals.map(evaluatePantavionCapabilityProposal);

  return {
    ok: true,
    generatedAt: date.toISOString(),
    registry: pantavionEcosystemSignalRegistryV1.id,
    language: pantavionEcosystemSignalRegistryV1.dailyBriefLanguage,
    signalCount: signals.length,
    proposalCount: proposals.length,
    signals,
    evaluations,
    founderBrief:
      "Σημαντικά μη-διπλά οικοσυστημικά σήματα μετατράπηκαν σε Pantavion work orders με route/logic/state/provider/audit/build/typecheck/founder gates.",
  };
}
