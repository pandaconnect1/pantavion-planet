import { PANTAVION_MASTER_VISION, PANTAVION_VISION_PRINCIPLES } from "./pantavion-master-vision";
import { PANTAVION_GLOBAL_ECOSYSTEM_SIGNALS, type PantavionEcosystemDomain } from "./global-ecosystem-registry";
import { SEVEN_CONTINENT_ECOSYSTEM_MAP } from "./seven-continent-ecosystem-map";

export type EcosystemUnificationInput = {
  readonly requestedDomain?: PantavionEcosystemDomain;
  readonly includeProtectedKernels?: boolean;
  readonly includeSevenContinents?: boolean;
  readonly includeChinaSuperApp?: boolean;
};

export type EcosystemUnificationResult = {
  readonly ok: true;
  readonly createdAt: string;
  readonly vision: typeof PANTAVION_MASTER_VISION;
  readonly principles: typeof PANTAVION_VISION_PRINCIPLES;
  readonly selectedSignals: typeof PANTAVION_GLOBAL_ECOSYSTEM_SIGNALS;
  readonly continents: typeof SEVEN_CONTINENT_ECOSYSTEM_MAP;
  readonly kernelFamilies: readonly {
    readonly id: string;
    readonly title: string;
    readonly domains: readonly PantavionEcosystemDomain[];
    readonly purpose: string;
    readonly nextCodeTargets: readonly string[];
  }[];
  readonly autonomousExecutionPlan: readonly string[];
  readonly protectedKernelRule: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

export function unifyPantavionEcosystems(
  input: EcosystemUnificationInput = {},
): EcosystemUnificationResult {
  const selectedSignals = input.requestedDomain
    ? PANTAVION_GLOBAL_ECOSYSTEM_SIGNALS.filter((signal) => signal.domain === input.requestedDomain)
    : PANTAVION_GLOBAL_ECOSYSTEM_SIGNALS;

  return {
    ok: true,
    createdAt: nowIso(),
    vision: PANTAVION_MASTER_VISION,
    principles: PANTAVION_VISION_PRINCIPLES,
    selectedSignals,
    continents: input.includeSevenContinents === false ? [] : SEVEN_CONTINENT_ECOSYSTEM_MAP,
    kernelFamilies: [
      {
        id: "pantaai-intelligence-kernel",
        title: "PantaAI Intelligence Kernel",
        domains: ["ai_models", "search_research", "knowledge_learning", "tool_substitution"],
        purpose:
          "Unify AI models, provider matrix, reasoning, research, search, knowledge, and provider substitution.",
        nextCodeTargets: [
          "core/pantaai/model-router/provider-capability-matrix.ts",
          "core/pantaai/model-router/model-selection-kernel.ts",
          "core/pantaai/tool-substitution/tool-substitution-advisor.ts",
        ],
      },
      {
        id: "pandadev-autonomous-coding-kernel",
        title: "PandaDev Autonomous Coding Kernel",
        domains: ["coding_agents", "autonomous_engineering", "cloud_ops"],
        purpose:
          "Write code continuously through plan, branch, PR, audit, repair, and protected deployment gates.",
        nextCodeTargets: [
          "core/kernel/autonomous-engineering-kernel.ts",
          "core/pantaai/autonomous-code/github-autonomous-writer.ts",
          "core/pantaai/autonomous-code/build-audit-runner.ts",
        ],
      },
      {
        id: "pantarag-memory-kernel",
        title: "PantaRAG Memory Kernel",
        domains: ["rag_memory", "knowledge_learning", "search_research"],
        purpose:
          "Create long-term governed memory, source vault, citations, vector retrieval contracts, and private/public source separation.",
        nextCodeTargets: [
          "core/pantaai/rag/source-vault-contract.ts",
          "core/pantaai/rag/retrieval-policy.ts",
          "core/memory/founder-doctrine-memory.ts",
        ],
      },
      {
        id: "pantalife-superapp-kernel",
        title: "PantaLife Super-App Kernel",
        domains: [
          "china_superapp",
          "messaging_comms",
          "social_community",
          "payments_wallet",
          "maps_mobility",
          "local_services",
          "marketplace_commerce",
          "dating_matching",
        ],
        purpose:
          "Transform China-style all-in-one ecosystem patterns into Pantavion-owned global super-app modules.",
        nextCodeTargets: [
          "core/pantaai/ecosystem/china-superapp-runtime-map.ts",
          "core/social/pantavion-social-kernel.ts",
          "core/services/pantalocal-services-kernel.ts",
          "core/marketplace/pantamarket-kernel.ts",
        ],
      },
      {
        id: "pantavoice-translation-kernel",
        title: "PantaVoice and Translation Kernel",
        domains: ["voice_translation"],
        purpose:
          "Live translation, voice notes, subtitles, speech detection, accessibility, emergency communication, and conversation mode.",
        nextCodeTargets: [
          "core/translation/live-translation-kernel.ts",
          "core/voice/voice-command-kernel.ts",
          "core/safety/emergency-language-kernel.ts",
        ],
      },
      {
        id: "pantacreate-work-kernel",
        title: "PantaCreate and Work Kernel",
        domains: [
          "presentation",
          "video_media",
          "image_design",
          "writing_content",
          "meetings_notes",
          "productivity_work",
          "workflow_automation",
        ],
        purpose:
          "Unify presentations, video, image, writing, meetings, productivity, and workflow automation as executable creation/work modules.",
        nextCodeTargets: [
          "core/create/pantaslides-kernel.ts",
          "core/create/pantavideo-kernel.ts",
          "core/create/pantaimage-kernel.ts",
          "core/work/pantaworkflow-kernel.ts",
        ],
      },
      {
        id: "protected-domain-kernels",
        title: "Protected Domain Kernels",
        domains: ["water_infrastructure", "identity_access", "sos_safety", "legal_governance"],
        purpose:
          "Make Water, users/access, secrets, production, payments, legal, identity and SOS executable child kernels with gates, not excuses.",
        nextCodeTargets: [
          "core/water/water-kernel.ts",
          "core/identity/identity-access-kernel.ts",
          "core/sos/sos-kernel.ts",
          "core/legal/legal-payments-kernel.ts",
        ],
      },
    ],
    autonomousExecutionPlan: [
      "Wake through cloud scheduler.",
      "Read founder vision and ecosystem registry.",
      "Scan repo for missing kernel families and static/fake features.",
      "Create jobs for missing capabilities.",
      "Generate safe scoped files or GitHub PRs.",
      "Run typecheck, build and audit gates.",
      "Repair failed generated work.",
      "Continue 24/366 from persisted queue.",
    ],
    protectedKernelRule:
      "Protected domains are executable child kernels. Direct mutation is gated, but observation, planning, drafting, testing and PR creation are allowed.",
  };
}

export const pantavion_ecosystem_unification_kernel_marker_v1 =
  "pantavion_ecosystem_unification_kernel_c2_v1";



