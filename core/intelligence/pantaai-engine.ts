export type PantavionIntentClass =
  | "start-business"
  | "translate"
  | "create-media"
  | "find-people"
  | "work-services"
  | "safety"
  | "research"
  | "general";

export type PantavionExecutionPacket = {
  intent: string;
  intentClass: PantavionIntentClass;
  confidence: number;
  capabilityFamily: string;
  plan: string[];
  executionMode: "foundation";
  result: string;
  memoryCandidate: {
    shouldRemember: boolean;
    reason: string;
  };
  providerStatus: string;
};

const classifiers: Array<{
  intentClass: PantavionIntentClass;
  keywords: string[];
  capabilityFamily: string;
  plan: string[];
}> = [
  {
    intentClass: "start-business",
    keywords: ["business", "εταιρ", "δουλει", "start", "brand", "market", "πωλη", "υπηρεσ", "income"],
    capabilityFamily: "Work / Services / Income + PantaAI",
    plan: [
      "Clarify business goal, country, language, audience and revenue path.",
      "Generate name, positioning, offer and first landing structure.",
      "Create service/marketplace listing draft.",
      "Prepare outreach and first customer acquisition steps.",
      "Track next execution step in dashboard memory candidate."
    ],
  },
  {
    intentClass: "translate",
    keywords: ["translate", "μεταφ", "language", "γλωσσ", "voice", "μιλα", "υποτιτ"],
    capabilityFamily: "Universal Communication",
    plan: [
      "Detect source language and target language.",
      "Route text through translation foundation.",
      "Prepare future voice/subtitle bridge.",
      "Store language preference candidate."
    ],
  },
  {
    intentClass: "create-media",
    keywords: ["video", "music", "media", "post", "story", "create", "δημιουργ", "εικονα"],
    capabilityFamily: "Media / Create",
    plan: [
      "Identify content type and audience.",
      "Generate structure, script or post plan.",
      "Prepare media route and creator workflow.",
      "Mark provider requirement for generation/upload."
    ],
  },
  {
    intentClass: "find-people",
    keywords: ["people", "social", "friend", "dating", "γνωριμ", "κοινοτ", "profile"],
    capabilityFamily: "People / Social Universe",
    plan: [
      "Identify relationship scope: public, friends, dating, professional or community.",
      "Apply privacy and safety rules.",
      "Route to people/community surface.",
      "Prepare graph/database integration."
    ],
  },
  {
    intentClass: "work-services",
    keywords: ["job", "work", "service", "marketplace", "earn", "πληρω", "τιμολογ", "εργασ"],
    capabilityFamily: "Work / Marketplace / Earnings",
    plan: [
      "Classify as job, service, business, marketplace listing or earning flow.",
      "Check regulated/payment boundary.",
      "Prepare listing/profile/earnings route.",
      "Mark payment/KYC provider requirement."
    ],
  },
  {
    intentClass: "safety",
    keywords: ["sos", "danger", "report", "safety", "minor", "παιδι", "κινδυν", "καταγγελ"],
    capabilityFamily: "Safety / Law / Identity",
    plan: [
      "Classify urgency and safety type.",
      "Route to SOS/report/minors/legal surface.",
      "Avoid hidden-admin logic; require lawful audit workflow.",
      "Prepare escalation integration."
    ],
  },
  {
    intentClass: "research",
    keywords: ["research", "learn", "history", "culture", "study", "μαθ", "ιστορ", "κουλτουρ"],
    capabilityFamily: "Knowledge / Culture / Education",
    plan: [
      "Classify research topic.",
      "Prepare knowledge/culture/learning route.",
      "Mark citation/source provider requirement.",
      "Prepare learning path candidate."
    ],
  },
];

export function executePantavionIntent(intent: string): PantavionExecutionPacket {
  const normalized = intent.trim();
  const lower = normalized.toLowerCase();

  const matched = classifiers.find((entry) =>
    entry.keywords.some((keyword) => lower.includes(keyword))
  );

  const selected = matched ?? {
    intentClass: "general" as PantavionIntentClass,
    keywords: [],
    capabilityFamily: "Prime Kernel General Routing",
    plan: [
      "Capture user intent.",
      "Classify capability family.",
      "Create execution plan.",
      "Route to the correct Pantavion surface.",
      "Return result packet and memory candidate."
    ],
  };

  return {
    intent: normalized || "No intent provided",
    intentClass: selected.intentClass,
    confidence: matched ? 0.78 : 0.42,
    capabilityFamily: selected.capabilityFamily,
    plan: selected.plan,
    executionMode: "foundation",
    result:
      "Pantavion foundation executed the intent through deterministic routing. External AI/tool providers are not connected in this patch, so the result is a real platform packet, not a fake provider claim.",
    memoryCandidate: {
      shouldRemember: normalized.length > 24,
      reason:
        normalized.length > 24
          ? "Intent is substantial enough to become continuity context after user-controlled memory consent."
          : "Intent is short; no memory candidate by default.",
    },
    providerStatus:
      "Foundation live. Next: connect model router, memory store, tool providers and workspace execution.",
  };
}
