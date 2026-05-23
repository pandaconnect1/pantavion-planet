export type WaterSearchEntityType =
  | "street"
  | "area"
  | "neighborhood"
  | "zone"
  | "pipe"
  | "valve"
  | "connection"
  | "unknown";

export type WaterSearchConfidence =
  | "exact"
  | "strong"
  | "medium"
  | "weak"
  | "ambiguous";

export type WaterSearchBoundingBox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

export type WaterSearchPoint = {
  lng: number;
  lat: number;
};

export type WaterStreetAreaZoneCandidateSource = {
  sourceId: string;
  sourceLabel?: string;
  entityType: WaterSearchEntityType;
  streetName?: string;
  area?: string;
  neighborhood?: string;
  zone?: string;
  assetId?: string;
  assetLabel?: string;
  bbox?: WaterSearchBoundingBox;
  center?: WaterSearchPoint;
  nearestPipeId?: string;
  nearestValveId?: string;
};

export type WaterStreetAreaZoneCandidate = WaterStreetAreaZoneCandidateSource & {
  candidateId: string;
  displayLabel: string;
  normalizedSearchText: string;
  confidenceScore: number;
  confidence: WaterSearchConfidence;
  confidenceReasons: string[];
  requiresHumanSelection: boolean;
  targetSource: "street-area-zone-search";
};

export type WaterStreetAreaZoneSearchDecision = {
  query: string;
  normalizedQuery: string;
  totalCandidates: number;
  candidates: WaterStreetAreaZoneCandidate[];
  selectedCandidate: WaterStreetAreaZoneCandidate | null;
  requiresHumanSelection: boolean;
  canOpenBboxDirectly: boolean;
  reason: string;
  nextAction:
    | "open_bbox"
    | "ask_user_to_select_candidate"
    | "ask_for_area_or_zone"
    | "no_candidate_found";
};

export const WATER_STREET_AREA_ZONE_SEARCH_DOCTRINE = {
  title: "Pantavion Water Street / Area / Zone Search Intelligence",
  purpose:
    "Ο χάρτης πρέπει να βρίσκει σωστά οδό, περιοχή, γειτονιά και ζώνη πριν φορτώσει αγωγούς, βάνες και AI analysis.",
  hardRules: [
    "Αν υπάρχουν ίδιες οδοί, το Pantavion δεν επιλέγει τυφλά.",
    "Η αναζήτηση πρέπει να ξεχωρίζει οδό, περιοχή, γειτονιά και ζώνη.",
    "Το αποτέλεσμα πρέπει να ανοίγει controlled bbox, όχι όλο το master network.",
    "Για κρίσιμες ενέργειες σε βάνες, πιέσεις και απομονώσεις χρειάζεται ανθρώπινη επιβεβαίωση.",
    "Η αναζήτηση πρέπει να αντέχει ελληνικά, κεφαλαία, τόνους και μικρές διαφορές γραφής.",
  ],
} as const;

export function normalizeWaterSearchText(value: string | undefined | null) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ς]/g, "σ")
    .replace(/[^a-z0-9α-ω\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function confidenceFromScore(score: number, ambiguous: boolean): WaterSearchConfidence {
  if (ambiguous) return "ambiguous";
  if (score >= 100) return "exact";
  if (score >= 75) return "strong";
  if (score >= 45) return "medium";
  return "weak";
}

function buildCandidateText(candidate: WaterStreetAreaZoneCandidateSource) {
  return [
    candidate.streetName,
    candidate.area,
    candidate.neighborhood,
    candidate.zone,
    candidate.assetId,
    candidate.assetLabel,
    candidate.sourceLabel,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildDisplayLabel(candidate: WaterStreetAreaZoneCandidateSource) {
  const parts = [
    candidate.streetName,
    candidate.area,
    candidate.neighborhood,
    candidate.zone ? `Ζώνη ${candidate.zone}` : undefined,
    candidate.assetLabel || candidate.assetId,
  ].filter(Boolean);

  return parts.length ? parts.join(" — ") : candidate.sourceLabel || candidate.sourceId;
}

function scoreCandidate(input: {
  normalizedQuery: string;
  candidate: WaterStreetAreaZoneCandidateSource;
  currentArea?: string;
  currentZone?: string;
}) {
  const reasons: string[] = [];
  const query = input.normalizedQuery;
  const candidateText = normalizeWaterSearchText(buildCandidateText(input.candidate));
  const street = normalizeWaterSearchText(input.candidate.streetName);
  const area = normalizeWaterSearchText(input.candidate.area);
  const zone = normalizeWaterSearchText(input.candidate.zone);
  const currentArea = normalizeWaterSearchText(input.currentArea);
  const currentZone = normalizeWaterSearchText(input.currentZone);

  let score = 0;

  if (!query) {
    return { score: 0, reasons: ["empty_query"] };
  }

  if (candidateText === query) {
    score += 100;
    reasons.push("exact_full_match");
  } else if (street && street === query) {
    score += 85;
    reasons.push("exact_street_match");
  } else if (candidateText.includes(query)) {
    score += 60;
    reasons.push("candidate_contains_query");
  } else {
    const words = query.split(" ").filter(Boolean);
    const matchedWords = words.filter((word) => candidateText.includes(word));
    if (matchedWords.length) {
      score += Math.round((matchedWords.length / Math.max(words.length, 1)) * 45);
      reasons.push("partial_word_match");
    }
  }

  if (area && query.includes(area)) {
    score += 20;
    reasons.push("query_contains_area");
  }

  if (zone && query.includes(zone)) {
    score += 15;
    reasons.push("query_contains_zone");
  }

  if (currentArea && area && area === currentArea) {
    score += 10;
    reasons.push("matches_current_area_context");
  }

  if (currentZone && zone && zone === currentZone) {
    score += 10;
    reasons.push("matches_current_zone_context");
  }

  if (input.candidate.bbox || input.candidate.center) {
    score += 5;
    reasons.push("has_map_target");
  }

  return {
    score: Math.min(score, 120),
    reasons,
  };
}

export function buildWaterStreetAreaZoneSearchDecision(input: {
  query: string;
  candidates: WaterStreetAreaZoneCandidateSource[];
  currentArea?: string;
  currentZone?: string;
}): WaterStreetAreaZoneSearchDecision {
  const normalizedQuery = normalizeWaterSearchText(input.query);

  const scored = input.candidates
    .map((candidate, index) => {
      const scoredCandidate = scoreCandidate({
        normalizedQuery,
        candidate,
        currentArea: input.currentArea,
        currentZone: input.currentZone,
      });

      const normalizedSearchText = normalizeWaterSearchText(buildCandidateText(candidate));
      const candidateId =
        candidate.sourceId ||
        `${candidate.entityType}-${normalizeWaterSearchText(buildDisplayLabel(candidate)).replace(/\s+/g, "-")}-${index}`;

      return {
        ...candidate,
        candidateId,
        displayLabel: buildDisplayLabel(candidate),
        normalizedSearchText,
        confidenceScore: scoredCandidate.score,
        confidence: confidenceFromScore(scoredCandidate.score, false),
        confidenceReasons: scoredCandidate.reasons,
        requiresHumanSelection: false,
        targetSource: "street-area-zone-search" as const,
      };
    })
    .filter((candidate) => candidate.confidenceScore > 0)
    .sort((a, b) => b.confidenceScore - a.confidenceScore);

  const topScore = scored[0]?.confidenceScore || 0;
  const nearTop = scored.filter((candidate) => topScore - candidate.confidenceScore <= 10);
  const ambiguousSameStreet =
    nearTop.length > 1 &&
    nearTop.some((candidate) => candidate.streetName) &&
    new Set(nearTop.map((candidate) => normalizeWaterSearchText(candidate.streetName))).size <= nearTop.length;

  const candidates = scored.map((candidate) => ({
    ...candidate,
    confidence: confidenceFromScore(candidate.confidenceScore, ambiguousSameStreet && topScore - candidate.confidenceScore <= 10),
    requiresHumanSelection: ambiguousSameStreet && topScore - candidate.confidenceScore <= 10,
  }));

  const selectedCandidate =
    candidates.length === 1 && candidates[0].confidenceScore >= 45 && !candidates[0].requiresHumanSelection
      ? candidates[0]
      : candidates[0] && candidates[0].confidenceScore >= 85 && nearTop.length === 1
        ? candidates[0]
        : null;

  if (!normalizedQuery) {
    return {
      query: input.query,
      normalizedQuery,
      totalCandidates: 0,
      candidates: [],
      selectedCandidate: null,
      requiresHumanSelection: false,
      canOpenBboxDirectly: false,
      reason: "Δεν δόθηκε αναζήτηση.",
      nextAction: "ask_for_area_or_zone",
    };
  }

  if (!candidates.length) {
    return {
      query: input.query,
      normalizedQuery,
      totalCandidates: 0,
      candidates: [],
      selectedCandidate: null,
      requiresHumanSelection: false,
      canOpenBboxDirectly: false,
      reason: "Δεν βρέθηκε οδός, περιοχή ή ζώνη.",
      nextAction: "no_candidate_found",
    };
  }

  if (!selectedCandidate) {
    return {
      query: input.query,
      normalizedQuery,
      totalCandidates: candidates.length,
      candidates,
      selectedCandidate: null,
      requiresHumanSelection: true,
      canOpenBboxDirectly: false,
      reason: "Βρέθηκαν πολλαπλές ή αβέβαιες αντιστοιχίσεις. Χρειάζεται επιλογή περιοχής/ζώνης.",
      nextAction: "ask_user_to_select_candidate",
    };
  }

  return {
    query: input.query,
    normalizedQuery,
    totalCandidates: candidates.length,
    candidates,
    selectedCandidate,
    requiresHumanSelection: false,
    canOpenBboxDirectly: Boolean(selectedCandidate.bbox || selectedCandidate.center),
    reason: "Βρέθηκε καθαρή αντιστοίχιση για άνοιγμα controlled bbox.",
    nextAction: "open_bbox",
  };
}

export const WATER_STREET_AREA_ZONE_SEARCH_NEXT_ACTIONS = [
  "Connect search candidates to target viewport",
  "Open controlled bbox from selected street / area / zone",
  "Show duplicate street candidates before loading network",
  "Attach nearest pipe and nearest valve hints",
  "Use selected candidate as AI Map Kernel context",
] as const;