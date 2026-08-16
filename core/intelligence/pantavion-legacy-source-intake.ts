export type PantavionLegacySourceKind =
  | "current_repo"
  | "old_repo"
  | "doctrine_doc"
  | "agent_sessions"
  | "cad_source_metadata"
  | "unknown";

export type PantavionLegacySourcePriority = "P0" | "P1" | "P2" | "P3";

export type PantavionLegacyWorkOrder = {
  id: string;
  priority: PantavionLegacySourcePriority;
  category: string;
  title: string;
  reason: string;
  requiredOutcome: string;
  requiresFounderApproval: boolean;
  sensitiveBoundary: boolean;
};

export const PANTAVION_LEGACY_SOURCE_INTAKE_ID =
  "pantavion_legacy_source_intake_v1";

export const PANTAVION_LEGACY_SOURCE_CANDIDATES = [
  "C:/Users/gnkkm/pantavion-planet",
  "C:/Users/gnkkm/Documents/pantavion-one-clean",
  "C:/pantavion-one",
  "C:/Users/gnkkm/OneDrive/Έγγραφα/pantavion.com",
  "C:/Users/gnkkm/AppData/Roaming/Code/User/agent-sessions",
  "C:/desktop/New folder (2)/pantavion-one-unified/New folder/pantavion-core",
  "C:/desktop/New folder (2)/pantavion-one-unified/New folder/pantavion-core/pantavion-core",
  "C:/desktop/PANTAVION-MASTER-DOCTRINE 2-5-2026.md",
  "E:/GEORGE_MAP_MASTER_B_C_FINAL (1).dwg",
  "E:/DTX MAP/MASTER 2025_M_15.1 (2).dxf",
  "F:/DTX MAP"
] as const;

export const PANTAVION_LEGACY_IMPORT_RULES = [
  "Old repos and old notes must not be raw-added blindly.",
  "Legacy material must be scanned, sanitized, indexed, classified, and converted into work orders.",
  "Secrets, .env files, private keys, tokens, executables, databases, and provider keys must never be copied as plain committed content.",
  "DWG/DXF/CAD artifacts are metadata-only unless founder-approved licensed viewer/conversion path exists.",
  "Every imported idea must become a route/state/audit/work-order path before being claimed as real.",
  "No fake features, no dead buttons, no placeholder-only completion."
] as const;

export const PANTAVION_LEGACY_WORK_ORDER_SEEDS: PantavionLegacyWorkOrder[] = [
  {
    id: "legacy_kernel_agent_supervisor",
    priority: "P0",
    category: "kernel_agent",
    title: "Unify old kernel, agent, runtime and evolution ideas into the live Pantavion Agent Supervisor.",
    reason: "Two years of kernel/agent ideas must become one governed runtime, not scattered scripts.",
    requiredOutcome: "Real supervisor route, script truth ledger, work-order queue, audit and safe runner.",
    requiresFounderApproval: false,
    sensitiveBoundary: false
  },
  {
    id: "legacy_universal_user_entry",
    priority: "P0",
    category: "universal_entry",
    title: "Convert old chat, voice, search, social, messaging, dating, payments and VIP requests into real module work orders.",
    reason: "Universal Entry must become the single user door into Pantavion.",
    requiredOutcome: "Each mode gets capability status, route, policy, adapter status and implementation work order.",
    requiresFounderApproval: true,
    sensitiveBoundary: true
  },
  {
    id: "legacy_dwg_water_source_truth",
    priority: "P0",
    category: "water_dwg",
    title: "Preserve old DWG/water infrastructure work as source-truth governed module.",
    reason: "DWG/source-truth is critical and must never be replaced by fake/derived maps.",
    requiredOutcome: "Original DWG read-only viewer path, vault metadata, licensed adapter work order and C overlay plan.",
    requiresFounderApproval: true,
    sensitiveBoundary: true
  },
  {
    id: "legacy_conversion_matrix",
    priority: "P1",
    category: "files_conversion",
    title: "Merge all old file/conversion ideas into the Conversion Format Matrix.",
    reason: "PDF, Office, images, audio, video, CAD, GIS and unknown formats need truthful support status.",
    requiredOutcome: "Matrix rows with supported_local/provider_required/requires_adapter/manual_quote/blocked_sensitive.",
    requiresFounderApproval: false,
    sensitiveBoundary: false
  },
  {
    id: "legacy_sos_rescue_safety",
    priority: "P0",
    category: "sos_rescue",
    title: "Merge SOS, Digital Rescue and safety concepts into governed emergency/recovery modules.",
    reason: "SOS/rescue must be real, legal, audited and not confused with hacking or unsafe bypass.",
    requiredOutcome: "SOS/rescue route/state/audit/policy gates and lawful recovery flows.",
    requiresFounderApproval: true,
    sensitiveBoundary: true
  }
];

export function getPantavionLegacySourceIntakeContract() {
  return {
    ok: true,
    id: PANTAVION_LEGACY_SOURCE_INTAKE_ID,
    status: "canonical_legacy_intake_contract",
    candidates: [...PANTAVION_LEGACY_SOURCE_CANDIDATES],
    rules: [...PANTAVION_LEGACY_IMPORT_RULES],
    workOrderSeeds: PANTAVION_LEGACY_WORK_ORDER_SEEDS
  };
}
