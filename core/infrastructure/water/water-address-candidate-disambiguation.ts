export const WATER_ADDRESS_CANDIDATE_DISAMBIGUATION_MARKER =
  "water_address_candidate_disambiguation_v1";

export const WATER_ADDRESS_CANDIDATE_DISAMBIGUATION_GATE_VERSION =
  "water_kernel_gate_v22";

export type WaterAddressCandidateSource =
  | "government-data"
  | "internal-address-index"
  | "controlled-address-index"
  | "geocoding-provider"
  | "none";

export type WaterAddressCandidateConfidence =
  | "low"
  | "medium"
  | "high"
  | "unknown";

export type WaterAddressCandidateBbox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

export type WaterAddressCandidateCoordinates = {
  lng: number;
  lat: number;
};

export type WaterAddressCandidate = {
  candidateId: string;
  streetName: string;
  houseNumber?: string;
  municipalityCity: string;
  districtQuarterSectorZone: string;
  locality: string;
  coordinates?: WaterAddressCandidateCoordinates;
  bbox?: WaterAddressCandidateBbox;
  confidence: WaterAddressCandidateConfidence;
  source: WaterAddressCandidateSource;
  requiresUserOrAdminSelection: true;
  mayAutoPick: false;
};

export type WaterAddressCandidateSearchRequest = {
  query: string;
  houseNumber?: string;
  municipalityCity?: string;
  districtQuarterSectorZone?: string;
  locality?: string;
  selectedCandidateId?: string;
  requestedBy?: "public-user" | "authorized-person" | "founder-admin" | "system-diagnostic";
};

export type WaterAddressCandidateSearchPlan = {
  marker: typeof WATER_ADDRESS_CANDIDATE_DISAMBIGUATION_MARKER;
  gateVersion: typeof WATER_ADDRESS_CANDIDATE_DISAMBIGUATION_GATE_VERSION;
  status: "blocked";
  statusCode: 400 | 423;
  provider: WaterAddressCandidateSource;
  candidateProviderReady: false;
  productionCandidateSearchAllowed: false;
  dataReturned: false;
  waterNetworkDataReturned: false;
  noWaterNetworkDataReturned: true;
  candidatesReturned: false;
  candidates: WaterAddressCandidate[];
  missingParameters: string[];
  requiredCandidateFields: string[];
  repeatedStreetNameRisk: "high";
  placeZoneDisambiguationRequired: true;
  selectedCandidateIdRequiredBeforeBbox: true;
  mayAutoPickCandidate: false;
  mayAutoPickAmbiguousAddress: false;
  mayDeriveBboxWithoutSelectedCandidate: false;
  mayReturnRawMaster: false;
  mayReturnCompleteNetwork: false;
  rule: string;
  nextRequiredStep: string;
  request: WaterAddressCandidateSearchRequest;
};

export type WaterSelectedCandidateViewportPlan = {
  marker: typeof WATER_ADDRESS_CANDIDATE_DISAMBIGUATION_MARKER;
  gateVersion: typeof WATER_ADDRESS_CANDIDATE_DISAMBIGUATION_GATE_VERSION;
  status: "blocked";
  statusCode: 400 | 423;
  selectedCandidateId?: string;
  targetViewportReady: false;
  bboxDerived: false;
  dataReturned: false;
  waterNetworkDataReturned: false;
  noWaterNetworkDataReturned: true;
  mayDeriveBboxWithoutSelectedCandidate: false;
  mayAutoPickCandidate: false;
  mayReturnRawMaster: false;
  mayReturnCompleteNetwork: false;
  rule: string;
  blocker: string;
};

export const waterAddressCandidateDisambiguationReadiness = {
  marker: WATER_ADDRESS_CANDIDATE_DISAMBIGUATION_MARKER,
  gateVersion: WATER_ADDRESS_CANDIDATE_DISAMBIGUATION_GATE_VERSION,
  addressCandidateDisambiguationReady: false,
  productionAddressSearchAllowed: false,
  provider: "none" as WaterAddressCandidateSource,
  repeatedStreetNameRisk: "high",
  placeZoneDisambiguationRequired: true,
  selectedCandidateIdRequiredBeforeBbox: true,
  mayAutoPickCandidate: false,
  mayAutoPickAmbiguousAddress: false,
  mayDeriveBboxWithoutSelectedCandidate: false,
  mayReturnRawMaster: false,
  mayReturnCompleteNetwork: false,
  mayLoadFullNetworkInBrowser: false,
  requiredBeforeProduction: [
    "real address candidate provider",
    "controlled address index or approved geocoder",
    "candidateId generation",
    "street-name normalization",
    "house-number handling",
    "municipality/city disambiguation",
    "district/quarter/sector/zone disambiguation",
    "locality disambiguation",
    "candidate bbox or point-to-bbox derivation",
    "confidence scoring",
    "manual user/admin selection",
    "audit logging",
    "access filtering",
    "founder/admin approval",
  ],
} as const;

export const requiredWaterAddressCandidateFields = [
  "candidateId",
  "streetName",
  "houseNumber",
  "municipalityCity",
  "districtQuarterSectorZone",
  "locality",
  "coordinates",
  "bbox",
  "confidence",
  "source",
] as const;

export function planWaterAddressCandidateSearch(
  request: WaterAddressCandidateSearchRequest,
): WaterAddressCandidateSearchPlan {
  const normalizedQuery = request.query.trim();

  const missingParameters = normalizedQuery.length === 0 ? ["query"] : [];

  return {
    marker: WATER_ADDRESS_CANDIDATE_DISAMBIGUATION_MARKER,
    gateVersion: WATER_ADDRESS_CANDIDATE_DISAMBIGUATION_GATE_VERSION,
    status: "blocked",
    statusCode: missingParameters.length > 0 ? 400 : 423,
    provider: "none",
    candidateProviderReady: false,
    productionCandidateSearchAllowed: false,
    dataReturned: false,
    waterNetworkDataReturned: false,
    noWaterNetworkDataReturned: true,
    candidatesReturned: false,
    candidates: [],
    missingParameters,
    requiredCandidateFields: [...requiredWaterAddressCandidateFields],
    repeatedStreetNameRisk: "high",
    placeZoneDisambiguationRequired: true,
    selectedCandidateIdRequiredBeforeBbox: true,
    mayAutoPickCandidate: false,
    mayAutoPickAmbiguousAddress: false,
    mayDeriveBboxWithoutSelectedCandidate: false,
    mayReturnRawMaster: false,
    mayReturnCompleteNetwork: false,
    rule:
      "Address search must return multiple candidates when ambiguity exists. The system must never auto-pick an ambiguous street/address. A selectedCandidateId is required before deriving the target bbox.",
    nextRequiredStep:
      "Connect an approved address candidate provider or controlled address index. Then require user/admin candidate selection before bbox serving.",
    request: {
      ...request,
      query: normalizedQuery,
    },
  };
}

export function planTargetViewportFromSelectedAddressCandidate(input: {
  selectedCandidateId?: string;
}): WaterSelectedCandidateViewportPlan {
  const selectedCandidateId = input.selectedCandidateId?.trim();

  return {
    marker: WATER_ADDRESS_CANDIDATE_DISAMBIGUATION_MARKER,
    gateVersion: WATER_ADDRESS_CANDIDATE_DISAMBIGUATION_GATE_VERSION,
    status: "blocked",
    statusCode: selectedCandidateId ? 423 : 400,
    selectedCandidateId: selectedCandidateId || undefined,
    targetViewportReady: false,
    bboxDerived: false,
    dataReturned: false,
    waterNetworkDataReturned: false,
    noWaterNetworkDataReturned: true,
    mayDeriveBboxWithoutSelectedCandidate: false,
    mayAutoPickCandidate: false,
    mayReturnRawMaster: false,
    mayReturnCompleteNetwork: false,
    rule:
      "Target bbox can only be derived from an explicitly selected address candidate. Ambiguous address auto-selection is forbidden.",
    blocker: selectedCandidateId
      ? "Selected candidate was provided, but production bbox derivation remains blocked until a real candidate provider and spatial serving chain exist."
      : "selectedCandidateId is required before any target bbox can be derived.",
  };
}
