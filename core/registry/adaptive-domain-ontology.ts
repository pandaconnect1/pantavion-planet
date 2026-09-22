export const PANTAVION_ADAPTIVE_DOMAIN_ONTOLOGY_V1 = {
  id: "pantavion_adaptive_domain_ontology_v1",
  doctrine:
    "Pantavion does not require a finite predeclared list of life domains. Any lawful user need may receive a deterministic semantic domain identity, lineage, parent capability family and lifecycle state without creating a competing truth plane.",
  logicalDomainCapacity: "unbounded",
  activeDomainExecution: "bounded_by_resources_policy_and_authority",
  noStaticModuleCeiling: true,
  canonicalTruthRequired: true,
} as const;

export type PantavionAdaptiveDomainRisk =
  | "low"
  | "medium"
  | "high"
  | "restricted";

export type PantavionAdaptiveDomainState =
  | "observed"
  | "classified"
  | "blueprint_ready"
  | "implementation_candidate"
  | "tested"
  | "verified_live"
  | "blocked"
  | "archived";

export interface PantavionAdaptiveDomainInput {
  userId: string;
  intentId: string;
  title: string;
  description: string;
  parentFamily: string;
  risk: PantavionAdaptiveDomainRisk;
  tags?: string[];
  jurisdiction?: string | null;
  locale?: string | null;
}

export interface PantavionAdaptiveDomainRecord {
  marker: "pantavion_adaptive_domain_record_v1";
  domainKey: string;
  semanticSlug: string;
  title: string;
  description: string;
  parentFamily: string;
  risk: PantavionAdaptiveDomainRisk;
  state: PantavionAdaptiveDomainState;
  canonicalNamespace: string;
  lineage: {
    source: "user_intent";
    userId: string;
    intentId: string;
    jurisdiction: string | null;
    locale: string | null;
  };
  tags: string[];
  authority: {
    publicExposureAllowed: false;
    productionMutationAllowed: false;
    automaticPromotionAllowed: false;
  };
  lifecycle: readonly [
    "OBSERVED",
    "CLASSIFIED",
    "BLUEPRINT_READY",
    "IMPLEMENTATION_CANDIDATE",
    "TESTED",
    "VERIFIED_LIVE",
  ];
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value: string): string {
  return normalize(value)
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "domain";
}

function fnv1a(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((v) => normalize(v)).filter(Boolean))].sort();
}

export function createAdaptiveDomainRecord(
  input: PantavionAdaptiveDomainInput,
): PantavionAdaptiveDomainRecord {
  if (!input.userId.trim() || !input.intentId.trim()) {
    throw new Error("adaptive_domain_identity_required");
  }
  if (!input.title.trim() || !input.description.trim()) {
    throw new Error("adaptive_domain_content_required");
  }
  if (!input.parentFamily.trim()) throw new Error("adaptive_domain_parent_family_required");

  const semanticSlug = slug(input.title);
  const domainKey = [
    "domain",
    slug(input.parentFamily),
    semanticSlug,
    fnv1a(
      [
        normalize(input.title),
        normalize(input.description),
        normalize(input.parentFamily),
      ].join("|"),
    ),
  ].join(":");

  return {
    marker: "pantavion_adaptive_domain_record_v1",
    domainKey,
    semanticSlug,
    title: input.title.trim(),
    description: input.description.trim(),
    parentFamily: input.parentFamily.trim(),
    risk: input.risk,
    state: input.risk === "restricted" ? "blocked" : "blueprint_ready",
    canonicalNamespace: `domains/${slug(input.parentFamily)}/${semanticSlug}/${domainKey.split(":").at(-1)}`,
    lineage: {
      source: "user_intent",
      userId: input.userId,
      intentId: input.intentId,
      jurisdiction: input.jurisdiction?.trim() || null,
      locale: input.locale?.trim() || null,
    },
    tags: unique([
      input.parentFamily,
      input.risk,
      ...(input.tags ?? []),
    ]),
    authority: {
      publicExposureAllowed: false,
      productionMutationAllowed: false,
      automaticPromotionAllowed: false,
    },
    lifecycle: [
      "OBSERVED",
      "CLASSIFIED",
      "BLUEPRINT_READY",
      "IMPLEMENTATION_CANDIDATE",
      "TESTED",
      "VERIFIED_LIVE",
    ],
  };
}

export function sameAdaptiveDomain(
  a: PantavionAdaptiveDomainRecord,
  b: PantavionAdaptiveDomainRecord,
): boolean {
  return a.domainKey === b.domainKey;
}
