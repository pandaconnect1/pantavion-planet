import fs from "fs";
import path from "path";
import {
  PANTAVION_PROVIDER_ECOSYSTEM_REGISTRY,
  type PantavionCapabilityFamily,
} from "./provider-ecosystem-registry";
import { CHINA_SUPERAPP_CAPABILITY_MAP } from "./china-superapp-capability-map";

export type PantavionCapabilitySurface = {
  id: string;
  title: string;
  family: PantavionCapabilityFamily | "kernel";
  evidenceFiles: string[];
  requiredForAutonomy: boolean;
  description: string;
};

export type PantavionCapabilityGap = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  missingEvidenceFiles: string[];
  recommendedFirstFiles: string[];
  reason: string;
};

const surface = (
  id: string,
  title: string,
  family: PantavionCapabilitySurface["family"],
  evidenceFiles: string[],
  requiredForAutonomy: boolean,
  description: string
): PantavionCapabilitySurface => ({
  id,
  title,
  family,
  evidenceFiles,
  requiredForAutonomy,
  description,
});

export const REQUIRED_PANTAVION_CAPABILITY_SURFACES: PantavionCapabilitySurface[] = [
  surface(
    "autonomous_engineering_kernel",
    "Autonomous Engineering Kernel",
    "kernel",
    [
      "core/kernel/autonomous-engineering-kernel.ts",
      "app/api/internal/pantavion/autonomous-engineering/route.ts",
      "scripts/pantavion-autonomous-engineering-gate.cjs",
    ],
    true,
    "Central 24/366 observe-plan-code-audit-PR loop."
  ),
  surface(
    "provider_model_router",
    "Provider and Model Router",
    "ai_model",
    ["core/pantaai/model-router", "core/pantaai/providers"],
    true,
    "Routes ChatGPT, Claude, Gemini, Grok, Perplexity, DeepSeek, Gemma, Bard/Bing-style providers."
  ),
  surface(
    "coding_agents",
    "Coding Agents",
    "coding_agent",
    ["core/pantaai/autonomous-code", "core/pantaai/coding-agents"],
    true,
    "Cursor, Claude Code, Codex, Windsurf, Copilot, Replit, Devin, Amazon Q patterns as Pantavion-owned coding lanes."
  ),
  surface(
    "rag_memory",
    "RAG and Full Memory",
    "rag_memory",
    ["core/memory", "core/pantaai/rag", "core/pantaai/retrieval"],
    true,
    "Pinecone, LlamaIndex, Haystack, Milvus patterns as memory/retrieval architecture."
  ),
  surface(
    "workflow_automation",
    "Workflow Automation",
    "workflow_automation",
    ["core/pantaai/workflows", "core/pantaai/automation"],
    true,
    "Make, Zapier, n8n, Gumloop patterns as Pantavion-owned workflows."
  ),
  surface(
    "china_superapp",
    "China Super-App Ecosystem",
    "china_superapp_pattern",
    [
      "core/pantaai/autonomous-code/china-superapp-capability-map.ts",
      "core/social",
      "core/payments",
      "core/maps",
    ],
    true,
    "WeChat, Weibo, RedNote, QQ, Qzone, Bilibili, Alipay, Baidu, AMAP, Didi, Dianping, Douyin, Tantan pattern map."
  ),
  surface(
    "seven_continent_ecosystem",
    "Seven-Continent Ecosystem",
    "kernel",
    ["core/continent", "core/localization", "core/planet"],
    true,
    "Localized continent/regional modules with legal, cultural, language and service boundaries."
  ),
  surface(
    "live_translation_voice",
    "Live Translation and Voice",
    "translation",
    ["core/translation", "core/voice", "app/sos/elder"],
    true,
    "Live translation, speech, subtitles, elder/minor accessible language flow."
  ),
  surface(
    "tool_substitution_advisor",
    "Tool Substitution Advisor",
    "productivity",
    ["core/pantaai/tool-substitution", "core/pantaai/cost-control"],
    true,
    "Paid/free, fast/cheap/advanced, provider substitution and cost-aware decisions."
  ),
  surface(
    "water_kernel",
    "Water Kernel",
    "water_infrastructure",
    ["core/water", "app/professional/infrastructure/water", "data/water-network-private"],
    true,
    "Protected water infrastructure, access, map, private sources, field intelligence and audit gates."
  ),
  surface(
    "identity_access_kernel",
    "Identity and Access Kernel",
    "identity_access",
    ["core/identity", "core/access", "core/security"],
    true,
    "Users, roles, sessions, approvals and protected access records."
  ),
  surface(
    "sos_kernel",
    "SOS Kernel",
    "sos_safety",
    ["app/sos", "core/sos", "core/safety"],
    true,
    "SOS, elder, minors, emergency circle, offline pack, safety policy."
  ),
  surface(
    "legal_payments_kernel",
    "Legal and Payments Kernel",
    "legal_governance",
    ["core/legal", "core/payments", "app/legal"],
    true,
    "Terms, privacy, consent, billing, subscriptions, provider limits and compliance."
  ),
];

function existsRelative(relativePath: string) {
  const abs = path.join(process.cwd(), relativePath);
  return fs.existsSync(abs);
}

export function scanPantavionCapabilityGaps(): PantavionCapabilityGap[] {
  const gaps: PantavionCapabilityGap[] = [];

  for (const item of REQUIRED_PANTAVION_CAPABILITY_SURFACES) {
    const missing = item.evidenceFiles.filter((file) => !existsRelative(file));

    if (missing.length > 0) {
      gaps.push({
        id: item.id,
        title: item.title,
        severity: item.requiredForAutonomy ? "critical" : "medium",
        missingEvidenceFiles: missing,
        recommendedFirstFiles: item.evidenceFiles,
        reason: item.description,
      });
    }
  }

  const registryIds = new Set(PANTAVION_PROVIDER_ECOSYSTEM_REGISTRY.map((item) => item.id));
  for (const chinaItem of CHINA_SUPERAPP_CAPABILITY_MAP) {
    const source = chinaItem.sourceSignal.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    if (!Array.from(registryIds).some((id) => id.includes(source))) {
      gaps.push({
        id: `china_registry_${source}`,
        title: `China registry coverage for ${chinaItem.sourceSignal}`,
        severity: "high",
        missingEvidenceFiles: ["core/pantaai/autonomous-code/provider-ecosystem-registry.ts"],
        recommendedFirstFiles: ["core/pantaai/autonomous-code/provider-ecosystem-registry.ts"],
        reason: `China super-app signal ${chinaItem.sourceSignal} must be mapped into the provider/capability registry.`,
      });
    }
  }

  return gaps;
}

export const pantavion_capability_gap_scanner_marker_v1 =
  "pantavion_capability_gap_scanner_c1_v1";
