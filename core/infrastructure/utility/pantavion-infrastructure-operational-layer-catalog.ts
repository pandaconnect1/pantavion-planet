export type PantavionInfrastructureLayerTruthState =
  | "LIVE_PUBLIC"
  | "CONNECTED_PRIVATE"
  | "REFERENCE_ONLY"
  | "SOURCE_REQUIRED";

export type PantavionInfrastructureLayerGroup =
  | "water"
  | "sewer"
  | "stormwater"
  | "electricity"
  | "telecommunications"
  | "recycled_water"
  | "water_development"
  | "hydrography"
  | "planning"
  | "other";

export interface PantavionInfrastructureOperationalLayer {
  id: string;
  group: PantavionInfrastructureLayerGroup;
  name: string;
  provider: string;
  truthState: PantavionInfrastructureLayerTruthState;
  sourceType:
    | "arcgis-mapserver"
    | "wfs"
    | "wms"
    | "file"
    | "private-provider"
    | "unknown";
  serviceUrl?: string;
  sourceLayerId?: number;
  coverage: string;
  licenseOrAgreement: string;
  queryable: boolean;
  enabledByDefault: boolean;
  operationalUse:
    | "reference"
    | "field-awareness"
    | "provider-authoritative"
    | "planning-only";
  sourceUpdatedAt?: string;
  temporalCoverage?: string;
  technicalFields: readonly string[];
  warnings: readonly string[];
}

const DLS_UTILITY_SERVICE =
  "https://eservices.dls.moi.gov.cy/inspire/rest/services/INSPIRE/US_UtilityAndGovernmentalServices/MapServer";
const DLS_HYDROGRAPHY_SERVICE =
  "https://eservices.dls.moi.gov.cy/inspire/rest/services/INSPIRE/HY_Hydrography/MapServer";
const DLS_TOPOGRAPHY_SERVICE =
  "https://eservices.dls.moi.gov.cy/arcgis/rest/services/National/Topography_GR/MapServer";

export const pantavionInfrastructureOperationalLayers: readonly PantavionInfrastructureOperationalLayer[] = [
  {
    id: "cy-limassol-sewer-nodes",
    group: "sewer",
    name: "ΕΟΑ Λεμεσού — Sewer Nodes",
    provider: "Επαρχιακός Οργανισμός Αυτοδιοίκησης Λεμεσού / DLS INSPIRE",
    truthState: "LIVE_PUBLIC",
    sourceType: "arcgis-mapserver",
    serviceUrl: DLS_UTILITY_SERVICE,
    sourceLayerId: 14,
    coverage: "Λεμεσός / Αμαθούντα — published INSPIRE coverage",
    licenseOrAgreement: "CC BY 4.0",
    queryable: true,
    enabledByDefault: false,
    operationalUse: "field-awareness",
    sourceUpdatedAt: "2026-06-16",
    temporalCoverage: "source dataset published through INSPIRE; verify field freshness",
    technicalFields: ["ACCESSA", "ASSET_ID", "STATUS", "DEPTH", "INVERT", "ELEVATION"],
    warnings: [
      "Public reference data is not a substitute for statutory excavation clearance.",
      "Missing features must never be interpreted as proof that no utility exists.",
    ],
  },
  {
    id: "cy-limassol-sewer-pump-stations",
    group: "sewer",
    name: "ΕΟΑ Λεμεσού — Pump Stations",
    provider: "Επαρχιακός Οργανισμός Αυτοδιοίκησης Λεμεσού / DLS INSPIRE",
    truthState: "LIVE_PUBLIC",
    sourceType: "arcgis-mapserver",
    serviceUrl: DLS_UTILITY_SERVICE,
    sourceLayerId: 15,
    coverage: "Λεμεσός / Αμαθούντα — published INSPIRE coverage",
    licenseOrAgreement: "CC BY 4.0",
    queryable: true,
    enabledByDefault: false,
    operationalUse: "field-awareness",
    sourceUpdatedAt: "2026-06-16",
    technicalFields: ["ACCESS_DIF", "AREA_CODE", "PS_SIZE"],
    warnings: ["Field confirmation is required for operational decisions."],
  },
  {
    id: "cy-limassol-sewer-pipes",
    group: "sewer",
    name: "ΕΟΑ Λεμεσού — Sewer Pipes",
    provider: "Επαρχιακός Οργανισμός Αυτοδιοίκησης Λεμεσού / DLS INSPIRE",
    truthState: "LIVE_PUBLIC",
    sourceType: "arcgis-mapserver",
    serviceUrl: DLS_UTILITY_SERVICE,
    sourceLayerId: 16,
    coverage: "Λεμεσός / Αμαθούντα — published INSPIRE coverage",
    licenseOrAgreement: "CC BY 4.0",
    queryable: true,
    enabledByDefault: false,
    operationalUse: "field-awareness",
    sourceUpdatedAt: "2026-06-16",
    technicalFields: [
      "ASSET_ID",
      "US_DEPTH",
      "DS_DEPTH",
      "US_INVERT",
      "DS_INVERT",
      "PIPE_MAT",
      "PIPE_TYPE",
      "PIP_WIDTH",
      "STATUS",
      "COND_CODE",
      "YEAR_LAID",
      "YEAR_RENE",
    ],
    warnings: [
      "Depth and invert values are shown only when delivered by the source dataset.",
      "Always preserve the source datum/meaning before using a depth value operationally.",
    ],
  },
  {
    id: "cy-limassol-sewer-connections",
    group: "sewer",
    name: "ΕΟΑ Λεμεσού — Sewer Connection Pipes",
    provider: "Επαρχιακός Οργανισμός Αυτοδιοίκησης Λεμεσού / DLS INSPIRE",
    truthState: "LIVE_PUBLIC",
    sourceType: "arcgis-mapserver",
    serviceUrl: DLS_UTILITY_SERVICE,
    sourceLayerId: 17,
    coverage: "Λεμεσός / Αμαθούντα — published INSPIRE coverage",
    licenseOrAgreement: "CC BY 4.0",
    queryable: true,
    enabledByDefault: false,
    operationalUse: "field-awareness",
    sourceUpdatedAt: "2026-06-16",
    technicalFields: ["OBJECT_ID", "MATERIAL", "DIAMETER", "STATUS"],
    warnings: ["Connection coverage can be incomplete; absence is not proof of no service."],
  },
  {
    id: "cy-dls-treatment-plants",
    group: "recycled_water",
    name: "Treatment Plants / Environmental Facilities",
    provider: "Cyprus DLS INSPIRE",
    truthState: "LIVE_PUBLIC",
    sourceType: "arcgis-mapserver",
    serviceUrl: DLS_UTILITY_SERVICE,
    sourceLayerId: 11,
    coverage: "Published Cyprus INSPIRE coverage",
    licenseOrAgreement: "Official public INSPIRE service; preserve attribution and source terms",
    queryable: true,
    enabledByDefault: false,
    operationalUse: "reference",
    technicalFields: ["ARCHIVE"],
    warnings: ["Facility locations do not imply the full tertiary/recycled-water pipe network is published."],
  },
  {
    id: "cy-larnaca-water-air-valves",
    group: "water",
    name: "DLS INSPIRE Water — Air Valves",
    provider: "Water utility data published through Cyprus DLS INSPIRE",
    truthState: "LIVE_PUBLIC",
    sourceType: "arcgis-mapserver",
    serviceUrl: DLS_UTILITY_SERVICE,
    sourceLayerId: 19,
    coverage: "Published INSPIRE Water coverage (current service extent is not island-wide)",
    licenseOrAgreement: "Public INSPIRE/open-data source; preserve attribution",
    queryable: true,
    enabledByDefault: false,
    operationalUse: "field-awareness",
    technicalFields: ["AV_CODE", "ACTUAL_POS", "DATE_INSTA", "INSPECTION", "INSTALLED_"],
    warnings: ["Do not present this layer as complete Cyprus-wide water coverage."],
  },
  {
    id: "cy-larnaca-water-sluice-valves",
    group: "water",
    name: "DLS INSPIRE Water — Sluice Valves",
    provider: "Water utility data published through Cyprus DLS INSPIRE",
    truthState: "LIVE_PUBLIC",
    sourceType: "arcgis-mapserver",
    serviceUrl: DLS_UTILITY_SERVICE,
    sourceLayerId: 21,
    coverage: "Published INSPIRE Water coverage (current service extent is not island-wide)",
    licenseOrAgreement: "Public INSPIRE/open-data source; preserve attribution",
    queryable: true,
    enabledByDefault: false,
    operationalUse: "field-awareness",
    technicalFields: ["ACTUAL_POS", "DATE_INSTA", "INSPECTION", "INSTALLED_", "ID"],
    warnings: ["Field confirmation remains required."],
  },
  {
    id: "cy-larnaca-water-hydrants",
    group: "water",
    name: "DLS INSPIRE Water — Fire Hydrants",
    provider: "Water utility data published through Cyprus DLS INSPIRE",
    truthState: "LIVE_PUBLIC",
    sourceType: "arcgis-mapserver",
    serviceUrl: DLS_UTILITY_SERVICE,
    sourceLayerId: 22,
    coverage: "Published INSPIRE Water coverage (current service extent is not island-wide)",
    licenseOrAgreement: "Public INSPIRE/open-data source; preserve attribution",
    queryable: true,
    enabledByDefault: false,
    operationalUse: "field-awareness",
    technicalFields: ["FH_CODE", "ACTUAL_POS", "DATE_INSTA", "INSPECTION", "INSTALLED_"],
    warnings: ["Field confirmation remains required."],
  },
  {
    id: "cy-larnaca-water-meters",
    group: "water",
    name: "DLS INSPIRE Water — House Meters",
    provider: "Water utility data published through Cyprus DLS INSPIRE",
    truthState: "LIVE_PUBLIC",
    sourceType: "arcgis-mapserver",
    serviceUrl: DLS_UTILITY_SERVICE,
    sourceLayerId: 24,
    coverage: "Published INSPIRE Water coverage (current service extent is not island-wide)",
    licenseOrAgreement: "Public INSPIRE/open-data source; preserve attribution",
    queryable: true,
    enabledByDefault: false,
    operationalUse: "reference",
    technicalFields: ["METER_NO"],
    warnings: ["Meter data may be incomplete or dated; use provider/customer systems where required."],
  },
  {
    id: "cy-larnaca-water-house-pipes",
    group: "water",
    name: "DLS INSPIRE Water — House Pipes",
    provider: "Water utility data published through Cyprus DLS INSPIRE",
    truthState: "LIVE_PUBLIC",
    sourceType: "arcgis-mapserver",
    serviceUrl: DLS_UTILITY_SERVICE,
    sourceLayerId: 26,
    coverage: "Published INSPIRE Water coverage (current service extent is not island-wide)",
    licenseOrAgreement: "Public INSPIRE/open-data source; preserve attribution",
    queryable: true,
    enabledByDefault: false,
    operationalUse: "field-awareness",
    technicalFields: ["MATERIAL", "CHECKED", "INSPECTION"],
    warnings: ["Connection geometry can be incomplete; absence is not proof of no pipe."],
  },
  {
    id: "cy-larnaca-water-distribution",
    group: "water",
    name: "DLS INSPIRE Water — Distribution Pipes",
    provider: "Water utility data published through Cyprus DLS INSPIRE",
    truthState: "LIVE_PUBLIC",
    sourceType: "arcgis-mapserver",
    serviceUrl: DLS_UTILITY_SERVICE,
    sourceLayerId: 27,
    coverage: "Published INSPIRE Water coverage (current service extent is not island-wide)",
    licenseOrAgreement: "Public INSPIRE/open-data source; preserve attribution",
    queryable: true,
    enabledByDefault: false,
    operationalUse: "field-awareness",
    technicalFields: ["MATERIAL", "DEPTH", "ELEVATION", "NOMINAL_DI", "CONDITION", "CHECKED"],
    warnings: ["Use source-provided depth/elevation only; never infer missing values."],
  },
  {
    id: "cy-larnaca-water-trunk",
    group: "water",
    name: "DLS INSPIRE Water — Trunk Pipes",
    provider: "Water utility data published through Cyprus DLS INSPIRE",
    truthState: "LIVE_PUBLIC",
    sourceType: "arcgis-mapserver",
    serviceUrl: DLS_UTILITY_SERVICE,
    sourceLayerId: 28,
    coverage: "Published INSPIRE Water coverage (current service extent is not island-wide)",
    licenseOrAgreement: "Public INSPIRE/open-data source; preserve attribution",
    queryable: true,
    enabledByDefault: false,
    operationalUse: "field-awareness",
    technicalFields: ["MATERIAL", "CONDITION", "NOMINAL_DI", "DEPTH", "ELEVATION", "TYPE", "CHECKED"],
    warnings: ["Depth is meaningful only with the provider's reference definition and field verification."],
  },
  {
    id: "cy-eac-high-voltage-reference",
    group: "electricity",
    name: "ΑΗΚ — High Voltage Network (Topographic Reference)",
    provider: "Cyprus DLS Topographic Map / EAC reference data",
    truthState: "REFERENCE_ONLY",
    sourceType: "arcgis-mapserver",
    serviceUrl: DLS_TOPOGRAPHY_SERVICE,
    sourceLayerId: 10,
    coverage: "Cyprus",
    licenseOrAgreement: "CC BY 4.0",
    queryable: true,
    enabledByDefault: false,
    operationalUse: "planning-only",
    sourceUpdatedAt: "2026-03-20",
    temporalCoverage: "1960-2017",
    technicalFields: [],
    warnings: [
      "Dataset temporal coverage ends in 2017; treat as historical/reference only.",
      "Do not use as sole evidence for excavation clearance or current cable location.",
    ],
  },
  {
    id: "cy-wdd-hydrographic-network",
    group: "hydrography",
    name: "ΤΑΥ / INSPIRE — Hydrographic Network",
    provider: "Department of Water Development data published through Cyprus DLS INSPIRE",
    truthState: "LIVE_PUBLIC",
    sourceType: "arcgis-mapserver",
    serviceUrl: DLS_HYDROGRAPHY_SERVICE,
    sourceLayerId: 10,
    coverage: "Cyprus",
    licenseOrAgreement: "Official public INSPIRE source; preserve attribution/source terms",
    queryable: true,
    enabledByDefault: false,
    operationalUse: "reference",
    technicalFields: ["name"],
    warnings: ["Hydrography is a reference layer, not a buried utility network."],
  },
  {
    id: "cy-wdd-drainage-basins",
    group: "hydrography",
    name: "ΤΑΥ / INSPIRE — Drainage Basins",
    provider: "Department of Water Development data published through Cyprus DLS INSPIRE",
    truthState: "LIVE_PUBLIC",
    sourceType: "arcgis-mapserver",
    serviceUrl: DLS_HYDROGRAPHY_SERVICE,
    sourceLayerId: 7,
    coverage: "Cyprus",
    licenseOrAgreement: "Official public INSPIRE source; preserve attribution/source terms",
    queryable: true,
    enabledByDefault: false,
    operationalUse: "reference",
    technicalFields: ["area_", "area_uom"],
    warnings: ["Reference/planning layer only."],
  },
  {
    id: "cy-wdd-southern-conveyor",
    group: "water_development",
    name: "ΤΑΥ — Νότιος Αγωγός",
    provider: "Τμήμα Αναπτύξεως Υδάτων",
    truthState: "SOURCE_REQUIRED",
    sourceType: "unknown",
    coverage: "Southern Conveyor Project corridor",
    licenseOrAgreement: "Exact machine-readable network geometry/terms not yet verified",
    queryable: false,
    enabledByDefault: false,
    operationalUse: "planning-only",
    technicalFields: ["DEPTH", "ELEVATION", "DIAMETER", "MATERIAL", "SURVEY_ACCURACY"],
    warnings: [
      "Do not display an invented alignment or depth.",
      "Activate only after an authoritative geometry/feed or licensed dataset is verified.",
    ],
  },
  {
    id: "cy-recycled-water-network",
    group: "recycled_water",
    name: "Τριτοβάθμια / Ανακυκλωμένο Νερό — Pipe Network",
    provider: "Relevant Cyprus water/sewer authorities",
    truthState: "SOURCE_REQUIRED",
    sourceType: "unknown",
    coverage: "Provider dependent",
    licenseOrAgreement: "Provider feed/data-sharing authority required unless a public dataset is verified",
    queryable: false,
    enabledByDefault: false,
    operationalUse: "field-awareness",
    technicalFields: ["DEPTH", "DIAMETER", "MATERIAL", "PRESSURE", "ACCURACY"],
    warnings: ["Treatment plant locations are not a substitute for the recycled-water pipe network."],
  },
  {
    id: "cy-telecom-underground",
    group: "telecommunications",
    name: "Telecommunications — Underground / Duct Network",
    provider: "Licensed telecommunications providers",
    truthState: "SOURCE_REQUIRED",
    sourceType: "private-provider",
    coverage: "Provider dependent",
    licenseOrAgreement: "Provider authorization/data-sharing agreement required",
    queryable: false,
    enabledByDefault: false,
    operationalUse: "field-awareness",
    technicalFields: ["DEPTH", "DUCT_COUNT", "CABLE_TYPE", "ACCURACY"],
    warnings: ["No complete public detailed underground telecom network has been verified."],
  },
  {
    id: "cy-stormwater-network",
    group: "stormwater",
    name: "Όμβρια — Network",
    provider: "Relevant district/local authority",
    truthState: "SOURCE_REQUIRED",
    sourceType: "private-provider",
    coverage: "Authority dependent",
    licenseOrAgreement: "Authority feed/data-sharing agreement required unless public source is verified",
    queryable: false,
    enabledByDefault: false,
    operationalUse: "field-awareness",
    technicalFields: ["DEPTH", "INVERT", "DIAMETER", "MATERIAL", "ACCURACY"],
    warnings: ["Activate only from verified authority data."],
  },
] as const;

export const PANTAVION_INFRASTRUCTURE_GROUP_LABELS: Record<
  PantavionInfrastructureLayerGroup,
  string
> = {
  water: "Ύδρευση",
  sewer: "Αποχέτευση",
  stormwater: "Όμβρια",
  electricity: "Ηλεκτρισμός",
  telecommunications: "Τηλεπικοινωνίες",
  recycled_water: "Τριτοβάθμια / Ανακυκλωμένο νερό",
  water_development: "Τμήμα Αναπτύξεως Υδάτων",
  hydrography: "Υδρογραφία / ΤΑΥ",
  planning: "Πολεοδομία",
  other: "Άλλα δίκτυα",
};

export function getPantavionInfrastructureOperationalLayer(id: string) {
  return pantavionInfrastructureOperationalLayers.find((layer) => layer.id === id) ?? null;
}

export function getPantavionInfrastructureOperationalLayerCatalog() {
  return {
    id: "pantavion_infrastructure_operational_layer_catalog_v1",
    version: "1.0.0",
    policy: {
      allExternalLayersOffByDefault: true,
      viewportScopedLoadingRequired: true,
      sourceAttributionRequired: true,
      depthAccuracyAndFreshnessMustBeVisibleWhenAvailable: true,
      missingLayerDataNeverMeansUtilityAbsent: true,
      externalReferenceNeverMutatesPantavionMaster: true,
      privateProviderLayersRequireAuthorization: true,
      fieldObservationsRequireReviewBeforeSharedPromotion: true,
    },
    groupLabels: PANTAVION_INFRASTRUCTURE_GROUP_LABELS,
    layers: pantavionInfrastructureOperationalLayers,
  };
}
