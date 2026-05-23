export type WaterMapAssetType =
  | "pipe"
  | "valve"
  | "zone"
  | "tank"
  | "pump"
  | "node"
  | "fault"
  | "work_event";

export type WaterMapApprovalState =
  | "raw_imported"
  | "ai_suggested"
  | "human_review_required"
  | "human_confirmed"
  | "master_approved"
  | "rejected";

export type WaterMapRiskLevel = "none" | "low" | "medium" | "high" | "critical";

export type WaterGeoPoint = {
  lat: number;
  lng: number;
};

export type WaterMapAsset = {
  id: string;
  type: WaterMapAssetType;
  label?: string;
  areaLabel?: string;
  roadLabel?: string;
  zoneId?: string;
  point?: WaterGeoPoint;
  line?: WaterGeoPoint[];
  source: "vercel_blob_geojson" | "field_capture" | "manual" | "ai_derived" | "approved_master";
  approvalState: WaterMapApprovalState;
  confidence: number;
};

export type WaterFaultMapInput = {
  recordNumber: string;
  faultPoint?: WaterGeoPoint;
  areaLabel?: string;
  roadLabel?: string;
  zoneLabel?: string;
  existingPipeId?: string;
  existingValveId?: string;
  existingZoneId?: string;
  repeatedFaultsNearbyCount?: number;
  possibleWaterLoss?: boolean;
  assets: WaterMapAsset[];
};

export type WaterNearbyAssetCandidate = {
  assetId: string;
  assetType: WaterMapAssetType;
  label?: string;
  distanceMeters: number;
  confidence: number;
  approvalState: WaterMapApprovalState;
};

export type WaterMapMissingLink = {
  key: string;
  label: string;
  message: string;
  blocksFinalApproval: boolean;
};

export type WaterMapRiskHint = {
  key: string;
  level: WaterMapRiskLevel;
  message: string;
  suggestedAction: string;
};

export type WaterAIMapDecision = {
  recordNumber: string;
  nearestPipe?: WaterNearbyAssetCandidate;
  nearestValve?: WaterNearbyAssetCandidate;
  nearestZone?: WaterNearbyAssetCandidate;
  missingLinks: WaterMapMissingLink[];
  riskHints: WaterMapRiskHint[];
  humanReviewRequired: boolean;
  canWriteMasterMap: false;
  canSuggestMapLink: boolean;
  summary: string;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function isGeoPoint(value: unknown): value is WaterGeoPoint {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as WaterGeoPoint).lat === "number" &&
      typeof (value as WaterGeoPoint).lng === "number",
  );
}

export function distanceMeters(a: WaterGeoPoint, b: WaterGeoPoint) {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return Math.round(2 * earthRadiusMeters * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

function representativePoint(asset: WaterMapAsset): WaterGeoPoint | null {
  if (isGeoPoint(asset.point)) return asset.point;

  if (asset.line?.length) {
    return asset.line[Math.floor(asset.line.length / 2)] || null;
  }

  return null;
}

function toCandidate(faultPoint: WaterGeoPoint, asset: WaterMapAsset): WaterNearbyAssetCandidate | null {
  const point = representativePoint(asset);

  if (!point) return null;

  const distance = distanceMeters(faultPoint, point);
  const distanceConfidence = Math.max(0.05, Math.min(1, 1 - distance / 1000));

  return {
    assetId: asset.id,
    assetType: asset.type,
    label: asset.label,
    distanceMeters: distance,
    confidence: Number(((asset.confidence || 0.5) * distanceConfidence).toFixed(3)),
    approvalState: asset.approvalState,
  };
}

export function findNearestWaterAssets(
  faultPoint: WaterGeoPoint | undefined,
  assets: WaterMapAsset[],
  type: WaterMapAssetType,
  limit = 3,
) {
  if (!faultPoint) return [];

  return assets
    .filter((asset) => asset.type === type)
    .map((asset) => toCandidate(faultPoint, asset))
    .filter((item): item is WaterNearbyAssetCandidate => Boolean(item))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);
}

function missingLink(
  key: string,
  label: string,
  message: string,
  blocksFinalApproval: boolean,
): WaterMapMissingLink {
  return { key, label, message, blocksFinalApproval };
}

function riskHint(
  key: string,
  level: WaterMapRiskLevel,
  message: string,
  suggestedAction: string,
): WaterMapRiskHint {
  return { key, level, message, suggestedAction };
}

export function decideWaterAIMapIntelligence(input: WaterFaultMapInput): WaterAIMapDecision {
  const nearestPipe = findNearestWaterAssets(input.faultPoint, input.assets, "pipe", 1)[0];
  const nearestValve = findNearestWaterAssets(input.faultPoint, input.assets, "valve", 1)[0];
  const nearestZone = findNearestWaterAssets(input.faultPoint, input.assets, "zone", 1)[0];

  const missingLinks: WaterMapMissingLink[] = [];

  if (!input.faultPoint) {
    missingLinks.push(
      missingLink(
        "fault_point",
        "Σημείο βλάβης",
        "Δεν υπάρχει ακριβές σημείο/GPS για τη βλάβη.",
        true,
      ),
    );
  }

  if (!input.existingPipeId && !nearestPipe) {
    missingLinks.push(
      missingLink(
        "pipe_link",
        "Σύνδεση με αγωγό",
        "Δεν έχει συνδεθεί η βλάβη με κοντινό αγωγό.",
        false,
      ),
    );
  }

  if (!input.existingValveId && !nearestValve) {
    missingLinks.push(
      missingLink(
        "valve_link",
        "Σύνδεση με βάνα",
        "Δεν έχει εντοπιστεί κοντινή βάνα για έλεγχο ή απομόνωση.",
        false,
      ),
    );
  }

  if (!input.existingZoneId && !nearestZone && !input.zoneLabel) {
    missingLinks.push(
      missingLink(
        "zone_link",
        "Σύνδεση με ζώνη",
        "Δεν έχει δηλωθεί ζώνη/pressure zone.",
        false,
      ),
    );
  }

  const riskHints: WaterMapRiskHint[] = [];

  if ((input.repeatedFaultsNearbyCount || 0) >= 3) {
    riskHints.push(
      riskHint(
        "repeated_faults",
        "high",
        "Η περιοχή έχει επαναλαμβανόμενες βλάβες.",
        "Να ελεγχθεί αν χρειάζεται αντικατάσταση αγωγού ή βαθύτερη τεχνική διερεύνηση.",
      ),
    );
  }

  if (input.possibleWaterLoss) {
    riskHints.push(
      riskHint(
        "possible_water_loss",
        "high",
        "Υπάρχει πιθανή απώλεια νερού.",
        "Να δοθεί προτεραιότητα και να συνδεθεί με χρόνο απόκρισης και αποκατάστασης.",
      ),
    );
  }

  if (nearestPipe && nearestPipe.approvalState !== "master_approved") {
    riskHints.push(
      riskHint(
        "pipe_not_master_approved",
        "medium",
        "Ο κοντινός αγωγός δεν είναι master-approved.",
        "Να γίνει ανθρώπινη επιβεβαίωση πριν χρησιμοποιηθεί ως επίσημη σύνδεση.",
      ),
    );
  }

  if (nearestValve && nearestValve.distanceMeters > 500) {
    riskHints.push(
      riskHint(
        "valve_far",
        "medium",
        "Η κοντινότερη βάνα φαίνεται μακριά.",
        "Να ελεγχθεί αν λείπει βάνα από τον χάρτη ή αν η σύνδεση είναι λάθος.",
      ),
    );
  }

  const humanReviewRequired =
    missingLinks.some((item) => item.blocksFinalApproval) ||
    riskHints.some((item) => item.level === "high" || item.level === "critical") ||
    Boolean(nearestPipe && nearestPipe.approvalState !== "master_approved") ||
    Boolean(nearestValve && nearestValve.approvalState !== "master_approved");

  return {
    recordNumber: input.recordNumber,
    nearestPipe,
    nearestValve,
    nearestZone,
    missingLinks,
    riskHints,
    humanReviewRequired,
    canWriteMasterMap: false,
    canSuggestMapLink: Boolean(input.faultPoint),
    summary: `AI Map Kernel: pipe=${nearestPipe?.assetId || "none"}, valve=${nearestValve?.assetId || "none"}, zone=${nearestZone?.assetId || "none"}, missing=${missingLinks.length}, risks=${riskHints.length}.`,
  };
}

export const WATER_AI_MAP_INTELLIGENCE_DOCTRINE = {
  title: "Pantavion Water AI Map Intelligence Kernel",
  purpose:
    "Ο χάρτης ύδρευσης δεν είναι απλή προβολή γραμμών. Κάθε αγωγός, βάνα, ζώνη, δεξαμενή, αντλία, βλάβη και εργασία λειτουργεί ως asset ή asset event με ιστορικό, ρίσκο και ανθρώπινη έγκριση.",
  hardLimits: [
    "Το AI δεν αλλάζει master χάρτη μόνο του.",
    "Το AI δεν διαγράφει αγωγό, βάνα, ζώνη ή ιστορικό.",
    "Το AI δεν θεωρεί μια κοντινή γραμμή επίσημη σύνδεση χωρίς ανθρώπινη επιβεβαίωση.",
    "Το AI δεν εμφανίζει private infrastructure layers χωρίς σωστή ταυτότητα, ρόλο και session.",
    "Το Vercel Blob GeoJSON είναι πηγή/derived layer, όχι μόνο οπτικές γραμμές.",
  ],
  intelligenceLoop: [
    "Read safe derived map layer",
    "Convert features to assets",
    "Find nearest pipe",
    "Find nearest valve",
    "Find zone / pressure area",
    "Compare with fault history",
    "Detect missing map links",
    "Warn about repeated faults and possible water loss",
    "Prepare suggestion",
    "Ask human approval",
    "Write audit trail",
  ],
} as const;