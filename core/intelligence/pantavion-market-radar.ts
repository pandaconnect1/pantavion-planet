export type PantavionRadarSeverity = "watch" | "important" | "critical";

export type PantavionRadarSignal = {
  id: string;
  domain: string;
  title: string;
  severity: PantavionRadarSeverity;
  competitorOrSource: string;
  whyItMatters: string;
  pantavionAction: string;
  implementationTarget: string;
  founderDecisionNeeded: boolean;
};

export const pantavionMarketRadarContract = {
  id: "pantavion_market_radar_kernel_v1",
  publicRoute: "/pantavion/radar",
  apiRoute: "/api/pantavion/radar",
  truth:
    "Live radar surface and deterministic kernel report. Autonomous market research needs cloud worker, provider/search APIs, database, schedules, and founder-approved credentials.",
  nonNegotiables: [
    "No fake always-on claim without cloud worker",
    "No competitor logo/layout/IP copying",
    "Every critical signal must map to implementation target",
    "Founder approval required for provider, cost, legal, emergency, security, or production changes",
  ],
} as const;

export function getPantavionMarketRadarSignals(): PantavionRadarSignal[] {
  return [
    {
      id: "mcp-a2a-protocol-stack",
      domain: "agents_protocols",
      title: "Agent interoperability is becoming core infrastructure",
      severity: "critical",
      competitorOrSource: "OpenAI / Google / Microsoft / Anthropic / enterprise AI ecosystem",
      whyItMatters: "AI is moving from chat into tools, agents, delegation, protocol execution, and cross-platform work.",
      pantavionAction: "Build Protocol Registry, MCP bridge, A2A-ready layer, signed delegation, provenance, and audit.",
      implementationTarget: "core/protocol + core/registry + core/security + core/ai",
      founderDecisionNeeded: true,
    },
    {
      id: "voice-translation-runtime",
      domain: "voice_translation",
      title: "Realtime voice translation is becoming platform-level",
      severity: "critical",
      competitorOrSource: "Google / OpenAI / telecom / wearable translation systems",
      whyItMatters: "Pantavion Universal Communication needs live speech, subtitles, language detection, translation, and SOS-safe fallback.",
      pantavionAction: "Implement Translation Provider Adapter v1 with provider-pending honesty and elder/SOS audit boundaries.",
      implementationTarget: "core/translation + app/translate + app/sos/elder",
      founderDecisionNeeded: true,
    },
    {
      id: "satellite-resilience",
      domain: "satellite_connectivity",
      title: "Satellite direct-to-device is becoming resilience infrastructure",
      severity: "important",
      competitorOrSource: "Starlink / AST SpaceMobile / Skylo / NTN carriers",
      whyItMatters: "Off-grid SOS needs online, weak, offline, and satellite-supported states without false rescue claims.",
      pantavionAction: "Add Connectivity State Runtime and Offline Emergency Pack.",
      implementationTarget: "core/connectivity + core/emergency + app/sos",
      founderDecisionNeeded: true,
    },
    {
      id: "agent-security-identity",
      domain: "security",
      title: "Agent identity and delegation security are unresolved",
      severity: "critical",
      competitorOrSource: "MCP/A2A security research",
      whyItMatters: "Unsafe agents can impersonate tools, overreach permissions, or execute wrong-provider actions.",
      pantavionAction: "Create Agent Identity and Delegation Kernel before powerful autonomous tools.",
      implementationTarget: "core/security + core/identity + core/guardian",
      founderDecisionNeeded: true,
    },
  ];
}

export function getPantavionMarketRadarReport() {
  const signals = getPantavionMarketRadarSignals();

  return {
    ok: true,
    contract: pantavionMarketRadarContract,
    generatedAt: new Date().toISOString(),
    summary: {
      totalSignals: signals.length,
      criticalSignals: signals.filter((signal) => signal.severity === "critical").length,
      founderDecisionRequired: signals.filter((signal) => signal.founderDecisionNeeded).length,
    },
    nextImplementationPriority: [
      "PantaAI Provider Router v1",
      "Protocol Registry / MCP Gateway v1",
      "Agent Identity and Delegation Kernel",
      "Translation Provider Adapter v1",
      "Connectivity State / Off-grid SOS v1",
    ],
    signals,
  };
}
