export type CyprusWaterSourceAccess =
  | "PUBLIC_OPEN"
  | "PUBLIC_METADATA"
  | "AUTHORIZED_ACCOUNT_REQUIRED"
  | "AUTHORITY_DATA_AGREEMENT_REQUIRED";

export type CyprusWaterSourceSensitivity =
  | "public_reference"
  | "controlled_geospatial"
  | "critical_infrastructure_private";

export interface CyprusWaterGeospatialSource {
  id: string;
  title: string;
  owner: string;
  coverage: "cyprus" | "district";
  district?: "lemesos" | "lefkosia" | "larnaka" | "ammochostos" | "pafos";
  category:
    | "administrative"
    | "cadastral"
    | "topography"
    | "elevation"
    | "orthophoto"
    | "geology"
    | "geomorphology"
    | "water_network"
    | "sewerage"
    | "roads_addresses";
  access: CyprusWaterSourceAccess;
  sensitivity: CyprusWaterSourceSensitivity;
  endpoint: string | null;
  protocol: "arcgis_rest" | "wms_wfs" | "portal_download" | "webgis" | "authority_import";
  updatePolicy: "live_remote" | "scheduled_sync" | "manual_authorized_import";
  productionUse:
    | "allowed_with_attribution"
    | "allowed_after_authorization"
    | "private_only_after_authorization";
  notes: string[];
}

export const CYPRUS_WATER_GEOSPATIAL_SOURCES: readonly CyprusWaterGeospatialSource[] = [
  {
    id: "dls-admin-boundaries",
    title: "Διοικητικά Όρια Κύπρου",
    owner: "Τμήμα Κτηματολογίου και Χωρομετρίας",
    coverage: "cyprus",
    category: "administrative",
    access: "AUTHORIZED_ACCOUNT_REQUIRED",
    sensitivity: "controlled_geospatial",
    endpoint: "https://eservices.dls.moi.gov.cy/arcgis/rest/services/National/AdminBoundaries_Indexes_GR/MapServer",
    protocol: "arcgis_rest",
    updatePolicy: "scheduled_sync",
    productionUse: "allowed_after_authorization",
    notes: ["Επαρχίες, Δήμοι/Κοινότητες, Ενορίες, Τμήματα και πλαίσια κτηματικών σχεδίων."],
  },
  {
    id: "dls-cadastral-map",
    title: "Κτηματικός / Χωρομετρικός Χάρτης Κύπρου",
    owner: "Τμήμα Κτηματολογίου και Χωρομετρίας",
    coverage: "cyprus",
    category: "cadastral",
    access: "AUTHORIZED_ACCOUNT_REQUIRED",
    sensitivity: "controlled_geospatial",
    endpoint: "https://eservices.dls.moi.gov.cy/arcgis/rest/services/National/CadastralMap_GR/MapServer",
    protocol: "arcgis_rest",
    updatePolicy: "scheduled_sync",
    productionUse: "allowed_after_authorization",
    notes: ["Τεμάχια, κτίρια, πολεοδομικές ζώνες, ισοϋψείς και επίσημα κτηματικά επίπεδα."],
  },
  {
    id: "dls-topography",
    title: "Τοπογραφικός Χάρτης Κύπρου",
    owner: "Τμήμα Κτηματολογίου και Χωρομετρίας",
    coverage: "cyprus",
    category: "topography",
    access: "AUTHORIZED_ACCOUNT_REQUIRED",
    sensitivity: "controlled_geospatial",
    endpoint: "https://eservices.dls.moi.gov.cy/arcgis/rest/services/National/Topography_GR/MapServer",
    protocol: "arcgis_rest",
    updatePolicy: "scheduled_sync",
    productionUse: "allowed_after_authorization",
    notes: ["Οδικό δίκτυο, υδρογραφία, ισοϋψείς, υψομετρική διαβάθμιση, κατοικημένες περιοχές και σημεία ενδιαφέροντος."],
  },
  {
    id: "dls-photogrammetry-2026",
    title: "Φωτογραμμετρία 2026 — Orthophoto / DTM / DSM / Contours / Buildings",
    owner: "Τμήμα Κτηματολογίου και Χωρομετρίας",
    coverage: "cyprus",
    category: "elevation",
    access: "AUTHORIZED_ACCOUNT_REQUIRED",
    sensitivity: "controlled_geospatial",
    endpoint: "https://portal.dls.moi.gov.cy/nea-e-ypiresia-diathesis-dedomenon-fotogrammetrias-sti-pyli-ktimatologiou/",
    protocol: "portal_download",
    updatePolicy: "scheduled_sync",
    productionUse: "allowed_after_authorization",
    notes: ["Επίσημα DTM/DSM, ορθοφωτοχάρτες, ισοϋψείς και κτίρια για terrain/elevation intelligence."],
  },
  {
    id: "gsd-geology-inspire",
    title: "Γεωλογία και Γεωμορφολογία Κύπρου (INSPIRE)",
    owner: "Τμήμα Γεωλογικής Επισκόπησης",
    coverage: "cyprus",
    category: "geology",
    access: "PUBLIC_OPEN",
    sensitivity: "public_reference",
    endpoint: "https://www.data.gov.cy/en/dataset/546",
    protocol: "wms_wfs",
    updatePolicy: "scheduled_sync",
    productionUse: "allowed_with_attribution",
    notes: ["Public CC BY 4.0 dataset with geology/geomorphology via WMS, WFS, Esri REST and JSON resources."],
  },
  {
    id: "eoa-lemesos-public-webgis",
    title: "ΕΟΑ Λεμεσού Public WebGIS",
    owner: "ΕΟΑ Λεμεσού",
    coverage: "district",
    district: "lemesos",
    category: "water_network",
    access: "PUBLIC_METADATA",
    sensitivity: "public_reference",
    endpoint: "https://eoalemesos.org.cy/",
    protocol: "webgis",
    updatePolicy: "live_remote",
    productionUse: "allowed_with_attribution",
    notes: ["Public thematic WebGIS includes water/sewer service boundaries; detailed operational network remains private."],
  },
  ...([
    ["lemesos", "ΕΟΑ Λεμεσού"],
    ["lefkosia", "ΕΟΑ Λευκωσίας"],
    ["larnaka", "ΕΟΑ Λάρνακας"],
    ["ammochostos", "ΕΟΑ Αμμοχώστου"],
    ["pafos", "ΕΟΑ Πάφου"],
  ] as const).map(([district, owner]) => ({
    id: `eoa-${district}-private-water-network`,
    title: `${owner} — εξουσιοδοτημένο ιδιωτικό δίκτυο ύδρευσης`,
    owner,
    coverage: "district" as const,
    district,
    category: "water_network" as const,
    access: "AUTHORITY_DATA_AGREEMENT_REQUIRED" as const,
    sensitivity: "critical_infrastructure_private" as const,
    endpoint: null,
    protocol: "authority_import" as const,
    updatePolicy: "manual_authorized_import" as const,
    productionUse: "private_only_after_authorization" as const,
    notes: [
      "No scraping or public exposure of operational pipe/valve infrastructure.",
      "Accepted through official API/export, signed data agreement, or authorized private upload.",
      "Raw master remains private; field users receive only role-scoped viewport output.",
    ],
  })),
];

export function getCyprusWaterGeospatialSourceSnapshot() {
  const sources = CYPRUS_WATER_GEOSPATIAL_SOURCES.map((source) => ({ ...source, notes: [...source.notes] }));
  return {
    marker: "pantavion_cyprus_water_geospatial_sources_v1",
    generatedAt: new Date().toISOString(),
    totalSources: sources.length,
    publicOrMetadataSources: sources.filter((source) =>
      source.access === "PUBLIC_OPEN" || source.access === "PUBLIC_METADATA",
    ).length,
    authorizedSources: sources.filter((source) =>
      source.access === "AUTHORIZED_ACCOUNT_REQUIRED",
    ).length,
    authorityAgreementSources: sources.filter((source) =>
      source.access === "AUTHORITY_DATA_AGREEMENT_REQUIRED",
    ).length,
    districts: ["lemesos", "lefkosia", "larnaka", "ammochostos", "pafos"],
    privacyRule:
      "Operational water-network geometry is critical-infrastructure private data. Pantavion may ingest it only from an authorized source and must serve role-scoped viewport derivatives instead of public raw masters.",
    sources,
  };
}
