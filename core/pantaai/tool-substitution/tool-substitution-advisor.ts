export type PantavionToolNeed =
  | "presentation"
  | "video"
  | "image"
  | "writing"
  | "meeting_notes"
  | "voice"
  | "research"
  | "workflow"
  | "coding"
  | "search"
  | "social"
  | "commerce"
  | "maps"
  | "dating"
  | "translation"
  | "knowledge"
  | "productivity";

export type PantavionPreference =
  | "fast"
  | "cheap"
  | "advanced"
  | "private"
  | "free_first"
  | "provider_best"
  | "internal_first";

export type PantavionToolSubstitutionEntry = {
  need: PantavionToolNeed;
  observedSignals: string[];
  pantavionCapability: string;
  internalKernel: string;
  externalProviderPolicy: "provider_required" | "connector_required" | "internal_first" | "legal_review_required";
  gates: string[];
};

export type PantavionToolSubstitutionRequest = {
  need: PantavionToolNeed;
  preference?: PantavionPreference;
  sensitivity?: "public" | "internal" | "private" | "protected";
};

export type PantavionToolSubstitutionResult = {
  ok: true;
  request: PantavionToolSubstitutionRequest;
  selected: PantavionToolSubstitutionEntry;
  route: "internal_capability" | "provider_candidate" | "manual_export" | "legal_review";
  explanation: string;
  gates: string[];
};

export const PANTAVION_TOOL_SUBSTITUTION_REGISTRY: PantavionToolSubstitutionEntry[] = [
  {
    need: "presentation",
    observedSignals: ["Gamma", "Tome", "Slides.ai", "Decktopus", "Beautiful.ai", "PowerPoint"],
    pantavionCapability: "PantaDeck Presentation Studio",
    internalKernel: "pantacreate_work_kernel",
    externalProviderPolicy: "internal_first",
    gates: ["template_license_gate", "brand_safety_gate", "export_gate"],
  },
  {
    need: "video",
    observedSignals: ["Runway", "HeyGen", "Veed", "Pictory", "OpusClip", "Veo", "Flow", "Google Vids"],
    pantavionCapability: "PantaVideo Creator Studio",
    internalKernel: "pantacreate_media_kernel",
    externalProviderPolicy: "provider_required",
    gates: ["copyright_gate", "likeness_consent_gate", "age_safety_gate"],
  },
  {
    need: "image",
    observedSignals: ["Midjourney", "DALL-E", "Leonardo.ai", "Firefly", "Ideogram", "Nano Banana", "Whisk"],
    pantavionCapability: "PantaImage and Design Studio",
    internalKernel: "pantadesign_kernel",
    externalProviderPolicy: "provider_required",
    gates: ["copyright_gate", "safety_filter_gate", "disclosure_gate"],
  },
  {
    need: "writing",
    observedSignals: ["Copy.ai", "Grammarly", "Jasper", "Wordtune", "ClosersCopy"],
    pantavionCapability: "PantaWriting Content Engine",
    internalKernel: "pantawriting_kernel",
    externalProviderPolicy: "internal_first",
    gates: ["plagiarism_gate", "claim_safety_gate", "tone_policy_gate"],
  },
  {
    need: "meeting_notes",
    observedSignals: ["Otter", "Granola", "Fireflies", "Fathom"],
    pantavionCapability: "PantaMeeting Memory",
    internalKernel: "pantameeting_kernel",
    externalProviderPolicy: "connector_required",
    gates: ["recording_consent_gate", "privacy_gate", "retention_gate"],
  },
  {
    need: "voice",
    observedSignals: ["Wispr", "ElevenLabs", "speech-to-text tools"],
    pantavionCapability: "PantaVoice Command and Dictation",
    internalKernel: "pantavoice_kernel",
    externalProviderPolicy: "provider_required",
    gates: ["voice_consent_gate", "biometric_privacy_gate", "translation_gate"],
  },
  {
    need: "research",
    observedSignals: ["Perplexity", "NotebookLM", "Google Scholar", "HARPA", "Glasp", "ChatPDF"],
    pantavionCapability: "PantaResearch Source Atlas",
    internalKernel: "pantarag_memory_kernel",
    externalProviderPolicy: "internal_first",
    gates: ["source_citation_gate", "license_gate", "reliability_gate"],
  },
  {
    need: "workflow",
    observedSignals: ["Make", "Zapier", "n8n", "Gumloop"],
    pantavionCapability: "PantaFlow Automation",
    internalKernel: "pantaflow_kernel",
    externalProviderPolicy: "connector_required",
    gates: ["connector_permission_gate", "external_effect_gate", "audit_log_gate"],
  },
  {
    need: "coding",
    observedSignals: ["Cursor", "Claude Code", "Codex", "Windsurf", "Copilot", "Replit", "Devin", "Amazon Q"],
    pantavionCapability: "PandaDev Autonomous Coding",
    internalKernel: "pandadev_autonomous_coding_kernel",
    externalProviderPolicy: "internal_first",
    gates: ["repo_truth_gate", "scoped_patch_gate", "protected_path_gate", "build_typecheck_gate"],
  },
  {
    need: "search",
    observedSignals: ["Google", "Baidu", "Bing AI", "Perplexity"],
    pantavionCapability: "PantaSearch and Source Atlas",
    internalKernel: "pantasearch_kernel",
    externalProviderPolicy: "connector_required",
    gates: ["source_policy_gate", "privacy_gate", "regional_policy_gate"],
  },
  {
    need: "social",
    observedSignals: ["WeChat", "Weibo", "RedNote", "QQ", "Qzone", "Tieba", "Bilibili", "Douyin"],
    pantavionCapability: "PantaLife Social Universe",
    internalKernel: "pantalife_superapp_kernel",
    externalProviderPolicy: "internal_first",
    gates: ["moderation_gate", "minors_gate", "privacy_gate", "creator_rights_gate"],
  },
  {
    need: "commerce",
    observedSignals: ["Alipay", "Pinduoduo", "Dianping", "RedNote", "WeChat"],
    pantavionCapability: "PantaMarket and PantaPay Commerce Layer",
    internalKernel: "pantalife_superapp_kernel",
    externalProviderPolicy: "legal_review_required",
    gates: ["payments_compliance_gate", "merchant_gate", "tax_gate", "consumer_protection_gate"],
  },
  {
    need: "maps",
    observedSignals: ["AMAP", "Baidu Maps", "Google Maps", "Didi"],
    pantavionCapability: "PantaMaps and Mobility",
    internalKernel: "pantamaps_kernel",
    externalProviderPolicy: "connector_required",
    gates: ["location_consent_gate", "infrastructure_safety_gate", "provider_terms_gate"],
  },
  {
    need: "dating",
    observedSignals: ["Tantan", "Tinder-style matching"],
    pantavionCapability: "PantaRelationship Safety Matching",
    internalKernel: "relationship_safety_kernel",
    externalProviderPolicy: "legal_review_required",
    gates: ["age_gate", "consent_gate", "anti_harassment_gate", "jurisdiction_gate"],
  },
  {
    need: "translation",
    observedSignals: ["live subtitles", "voice translation", "conversation translation"],
    pantavionCapability: "PantaLive Translation",
    internalKernel: "pantavoice_translation_kernel",
    externalProviderPolicy: "provider_required",
    gates: ["language_detection_gate", "consent_gate", "emergency_disclaimer_gate"],
  },
  {
    need: "knowledge",
    observedSignals: ["NotebookLM", "Google Scholar", "ChatPDF", "source libraries"],
    pantavionCapability: "PantaKnowledge and Learning",
    internalKernel: "pantalearning_kernel",
    externalProviderPolicy: "internal_first",
    gates: ["source_reliability_gate", "license_gate", "education_safety_gate"],
  },
  {
    need: "productivity",
    observedSignals: ["Taskade", "AudioPen", "Notion AI", "Xembly"],
    pantavionCapability: "PantaWork Command Center",
    internalKernel: "pantawork_kernel",
    externalProviderPolicy: "internal_first",
    gates: ["workspace_privacy_gate", "connector_permission_gate"],
  },
];

export function advisePantavionToolSubstitution(
  request: PantavionToolSubstitutionRequest,
): PantavionToolSubstitutionResult {
  const selected =
    PANTAVION_TOOL_SUBSTITUTION_REGISTRY.find((item) => item.need === request.need) ??
    PANTAVION_TOOL_SUBSTITUTION_REGISTRY[PANTAVION_TOOL_SUBSTITUTION_REGISTRY.length - 1];

  let route: PantavionToolSubstitutionResult["route"] = "internal_capability";

  if (selected.externalProviderPolicy === "provider_required") route = "provider_candidate";
  if (selected.externalProviderPolicy === "connector_required") route = "manual_export";
  if (selected.externalProviderPolicy === "legal_review_required") route = "legal_review";

  if (request.preference === "internal_first" || request.sensitivity === "protected") {
    route = selected.externalProviderPolicy === "legal_review_required" ? "legal_review" : "internal_capability";
  }

  return {
    ok: true,
    request,
    selected,
    route,
    explanation: `Pantavion maps ${request.need} to ${selected.pantavionCapability} through ${selected.internalKernel}.`,
    gates: [
      ...selected.gates,
      "no_brand_copying",
      "no_fake_active_feature",
      "execution_status_required",
    ],
  };
}

export const pantavion_tool_substitution_advisor_marker_v1 =
  "pantavion_tool_substitution_advisor_c3_v1";
