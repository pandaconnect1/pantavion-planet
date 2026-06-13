export type PantavionVisionPrinciple = {
  readonly id: string;
  readonly title: string;
  readonly rule: string;
};

export const PANTAVION_MASTER_VISION = {
  id: "pantavion-master-vision-v1",
  founderDoctrine: "All life, one organized center. The planet in one living screen.",
  productMeaning:
    "Pantavion is a planetary unification platform that organizes communication, AI, work, services, media, education, safety, identity, infrastructure, marketplace, translation, and cultural ecosystems into one governed living operating system.",
  nonCopyDoctrine:
    "Pantavion does not copy external brands, logos, UI, rankings, slogans, claims, or protected product identities. Pantavion legally absorbs functional patterns into Pantavion-owned capability families.",
  autonomyDoctrine:
    "Pantavion must continuously observe, plan, code, audit, repair, and propose implementation through controlled autonomous engineering loops.",
  protectedDomainDoctrine:
    "Water, users, access, secrets, production, payments, legal, identity, SOS, minors, health, and private infrastructure are executable kernel domains, not excuses. Each has a child kernel and founder-gated mutation rules.",
} as const;

export const PANTAVION_VISION_PRINCIPLES: readonly PantavionVisionPrinciple[] = [
  {
    id: "one-living-screen",
    title: "One living planetary screen",
    rule: "Every ecosystem capability must eventually connect into one organized Pantavion center instead of scattered standalone pages.",
  },
  {
    id: "no-static-fake-feature",
    title: "No static fake feature",
    rule: "A visible capability must have a real route, real state, real provider status, real execution status, or clear locked/beta/internal status.",
  },
  {
    id: "kernel-first",
    title: "Kernel-first execution",
    rule: "Capabilities enter the kernel registry before public UI. UI follows execution contracts, not marketing claims.",
  },
  {
    id: "legal-abstraction",
    title: "Legal abstraction",
    rule: "External tools and ecosystems are treated as market signals and functional patterns. Pantavion builds its own lawful implementation.",
  },
  {
    id: "autonomous-but-governed",
    title: "Autonomous but governed",
    rule: "The autonomous engine may observe, plan, draft, code, test, audit, create branches and PRs. Protected production mutations remain gated.",
  },
  {
    id: "china-superapp-alignment",
    title: "China-style super-app alignment",
    rule: "Pantavion adopts the all-in-one ecosystem logic from Chinese super-app patterns, translated into Pantavion-owned global architecture.",
  },
  {
    id: "seven-continent-localization",
    title: "Seven-continent localization",
    rule: "Pantavion must support global/continent/regional culture, language, law, social behavior, commerce, safety, and service differences.",
  },
  {
    id: "full-memory-rag",
    title: "Full memory and RAG",
    rule: "Pantavion must remember founder doctrine, code, sources, user-permitted data, provider state, legal limits, and infrastructure truth through governed memory/retrieval.",
  },
  {
    id: "live-translation",
    title: "Live translation as a core layer",
    rule: "Speech, text, subtitle, conversation, emergency, accessibility, and cross-culture translation are core ecosystem infrastructure.",
  },
  {
    id: "continuous-engineering",
    title: "24/366 continuous engineering",
    rule: "Pantavion should wake continuously through cloud schedulers and workers, detect gaps, produce code, test, audit, and continue from stored state.",
  },
];

export const pantavion_master_vision_marker_v1 =
  "pantavion_master_vision_ecosystem_unification_c2_v1";
