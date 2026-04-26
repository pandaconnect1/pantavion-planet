export type PantaAIIntent =
  | "build_platform"
  | "audit_security"
  | "build_sos"
  | "build_translation"
  | "build_messaging"
  | "build_commerce"
  | "unknown";

export type PantaAIStep = {
  order: number;
  title: string;
  capability: string;
  action: string;
  status: "planned" | "ready" | "blocked";
  reason?: string;
};

export type PantaAIExecutionResult = {
  ok: true;
  provider: "pantavion_local_kernel_v1";
  externalProviderUsed: false;
  input: string;
  intent: PantaAIIntent;
  plan: PantaAIStep[];
  warnings: string[];
};

function detectIntent(input: string): PantaAIIntent {
  const text = input.toLowerCase();

  if (text.includes("sos") || text.includes("emergency") || text.includes("safety")) {
    return "build_sos";
  }

  if (
    text.includes("translation") ||
    text.includes("translate") ||
    text.includes("language") ||
    text.includes("interpreter")
  ) {
    return "build_translation";
  }

  if (
    text.includes("message") ||
    text.includes("chat") ||
    text.includes("viber") ||
    text.includes("whatsapp")
  ) {
    return "build_messaging";
  }

  if (
    text.includes("stripe") ||
    text.includes("payment") ||
    text.includes("commerce") ||
    text.includes("market")
  ) {
    return "build_commerce";
  }

  if (
    text.includes("security") ||
    text.includes("legal") ||
    text.includes("audit") ||
    text.includes("risk")
  ) {
    return "audit_security";
  }

  if (
    text.includes("build") ||
    text.includes("platform") ||
    text.includes("kernel") ||
    text.includes("pantavion")
  ) {
    return "build_platform";
  }

  return "unknown";
}

function planForIntent(intent: PantaAIIntent): PantaAIStep[] {
  switch (intent) {
    case "build_platform":
      return [
        {
          order: 1,
          title: "Create live backend spine",
          capability: "kernel_runtime",
          action: "Expose health, status, and execution endpoints.",
          status: "ready",
        },
        {
          order: 2,
          title: "Add persistent identity store",
          capability: "identity_storage",
          action: "Connect database-backed users, profiles, consent, and sessions.",
          status: "blocked",
          reason: "Persistent database is required.",
        },
        {
          order: 3,
          title: "Activate no-dead-surface audit",
          capability: "truth_governance",
          action:
            "Every visible button must map to route, action, disabled state, or beta state.",
          status: "planned",
        },
      ];

    case "audit_security":
      return [
        {
          order: 1,
          title: "Classify public claims",
          capability: "claims_registry",
          action:
            "Mark each module as operational, foundation, blocked, legal_review, or security_review.",
          status: "ready",
        },
        {
          order: 2,
          title: "Enforce jurisdiction gate",
          capability: "global_policy",
          action:
            "Apply country and region rules for minors, content, commerce, privacy, and emergency use.",
          status: "planned",
        },
      ];

    case "build_sos":
      return [
        {
          order: 1,
          title: "Validate emergency packet",
          capability: "sos_packet",
          action:
            "Require trigger, timestamp, location if available, consent, and emergency status.",
          status: "ready",
        },
        {
          order: 2,
          title: "Dispatch to trusted contacts",
          capability: "trusted_contacts",
          action: "Send packet to verified user-selected contacts.",
          status: "blocked",
          reason: "Contact store and delivery transport are required.",
        },
        {
          order: 3,
          title: "Authority opt-in",
          capability: "authority_network",
          action:
            "Route to official authority nodes only after lawful institutional onboarding.",
          status: "blocked",
          reason: "Legal agreements and official responder portal required.",
        },
      ];

    case "build_translation":
      return [
        {
          order: 1,
          title: "Create assistive translation layer",
          capability: "translation_assist",
          action:
            "Support language detection, phrase packs, confidence labels, and emergency disclaimers.",
          status: "planned",
        },
        {
          order: 2,
          title: "Block perfect-translation claim",
          capability: "translation_safety",
          action:
            "Never claim certified 100 percent translation until formally verified.",
          status: "ready",
        },
      ];

    case "build_messaging":
      return [
        {
          order: 1,
          title: "Create own messaging endpoint",
          capability: "pantavion_messages",
          action:
            "Validate message payloads and enforce identity/storage requirement.",
          status: "ready",
        },
        {
          order: 2,
          title: "Add message persistence",
          capability: "message_store",
          action: "Store messages, delivery states, and abuse signals.",
          status: "blocked",
          reason: "Auth and database required.",
        },
      ];

    case "build_commerce":
      return [
        {
          order: 1,
          title: "Keep live payments blocked",
          capability: "commercial_gate",
          action:
            "Do not enable Stripe or payments before legal/commercial readiness.",
          status: "ready",
        },
        {
          order: 2,
          title: "Define marketplace restrictions",
          capability: "restricted_goods",
          action:
            "Block weapons, drugs, adult services, counterfeit goods, scams, and high-risk goods.",
          status: "planned",
        },
      ];

    default:
      return [
        {
          order: 1,
          title: "Clarify intent",
          capability: "intent_parser",
          action:
            "Map the user request to a known Pantavion capability before execution.",
          status: "planned",
        },
      ];
  }
}

export function executePantaAILocally(input: string): PantaAIExecutionResult {
  const trimmed = input.trim();
  const intent = detectIntent(trimmed);

  return {
    ok: true,
    provider: "pantavion_local_kernel_v1",
    externalProviderUsed: false,
    input: trimmed,
    intent,
    plan: planForIntent(intent),
    warnings: [
      "This is Pantavion local deterministic execution, not OpenAI, Claude, or Gemini.",
      "No third-party model receives this request in this local kernel endpoint.",
      "Future model adapters must be hidden, audited, replaceable, and governed by the Pantavion Kernel.",
    ],
  };
}
