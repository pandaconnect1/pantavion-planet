export type CyprusWaterSourceAccess =
  | "PUBLIC_OPEN"
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
    | "hydrography"
    | "roads"
    | "elevation"
    | "orthophoto"
    | "geology"
    | "water_network";
  access: CyprusWaterSourceAccess;
  sensitivity: CyprusWaterSourceSensitivity;
  endpoint: string | null;
  protocol: "wms_wfs_rest" | "portal_download" | "authority_import";
  updatePolicy: "scheduled_sync" | "manual_authorized_import";
  productionUse:
    | "allowed_with_attribution"
    | "allowed_after_authorization"
    | "private_only_after_authorization";
  notes: string[];
}

const EOA = [
  ["lemesos", "ΕΟΑ Λεμεσού"],
  ["lefkosia", "ΕΟΑ Λευκωσίας"],
  ["larnaka", "ΕΟΑ Λάρνακας"],
  ["ammochostos", "ΕΟΑ Αμμοχώστου"],
  ["pafos", "ΕΟΑ Πάφου"],
] as const;

export const CYPRUS_WATER_GEOSPATIAL_SOURCES: readonly CyprusWaterGeospatialSource[] = [
  {
    id: "dls-hydrography",
    title: "Υδρογραφικό Δίκτυο — Τοπογραφικός Χάρτης",
    owner: "Τμήμα Κτηματολογίου και Χωρομετρίας",
    coverage: "cyprus",
    category: "hydrography",
    access: "PUBLIC_OPEN",
    sensitivity: "public_reference",
    endpoint: "https://www.data.gov.cy/en/dataset/200",
    protocol: "wms_wfs_rest",
    updatePolicy: "scheduled_sync",
    productionUse: "allowed_with_attribution",
    notes: ["Επίσημο δημόσιο dataset Κύπρου με WMS/Esri REST/JSON resources."],
  },
  {
    id: "dls-primary-roads",
    title: "Πρωτεύον Οδικό Δίκτυο",
    owner: "Τμήμα Κτηματολογίου και Χωρομετρίας",
    coverage: "cyprus",
    category: "roads",
    access: "PUBLIC_OPEN",
    sensitivity: "public_reference",
    endpoint: "https://data.gov.cy/el/dataset/proteyon-odiko-diktyo-topografikos-hartis",
    protocol: "wms_wfs_rest",
    updatePolicy: "scheduled_sync",
    productionUse: "allowed_with_attribution",
    notes: ["Public CC BY 4.0 road-network layer."],
  },
  {
    id: "dls-secondary-roads",
    title: "Δευτερεύον Οδικό Δίκτυο",
    owner: "Τμήμα Κτηματολογίου και Χωρομετρίας",
    coverage: "cyprus",
    category: "roads",
    access: "PUBLIC_OPEN",
    sensitivity: "public_reference",
    endpoint: "https://data.gov.cy/el/dataset/deytereyon-odiko-diktyo-topografikos-hartis",
    protocol: "wms_wfs_rest",
    updatePolicy: "scheduled_sync",
    productionUse: "allowed_with_attribution",
    notes: ["Public CC BY 4.0 road-network layer."],
  },
  {
    id: "dls-other-roads",
    title: "Οδικό Δίκτυο — λοιποί δρόμοι",
    owner: "Τμήμα Κτηματολογίου και Χωρομετρίας",
    coverage: "cyprus",
    category: "roads",
    access: "PUBLIC_OPEN",
    sensitivity: "public_reference",
    endpoint: "https://data.gov.cy/el/dataset/192",
    protocol: "wms_wfs_rest",
    updatePolicy: "scheduled_sync",
    productionUse: "allowed_with_attribution",
    notes: ["Public CC BY 4.0 road-network layer."],
  },
  {
    id: "gsd-geology-geomorphology",
    title: "Γεωλογία και Γεωμορφολογία (INSPIRE)",
    owner: "Τμήμα Γεωλογικής Επισκόπησης",
    coverage: "cyprus",
    category: "geology",
    access: "PUBLIC_OPEN",
    sensitivity: "public_reference",
    endpoint: "https://www.data.gov.cy/en/dataset/546",
    protocol: "wms_wfs_rest",
    updatePolicy: "scheduled_sync",
    productionUse: "allowed_with_attribution",
    notes: ["Public CC BY 4.0 geology/geomorphology via WMS, WFS, Esri REST and JSON."],
  },
  {
    id: "dls-photogrammetry-2026",
    title: "Ορθοφωτοχάρτες / DTM / DSM / Ισοϋψείς / Κτίρια",
    owner: "Τμήμα Κτηματολογίου και Χωρομετρίας",
    coverage: "cyprus",
    category: "elevation",
    access: "AUTHORIZED_ACCOUNT_REQUIRED",
    sensitivity: "controlled_geospatial",
    endpoint: "https://portal.dls.moi.gov.cy/nea-e-ypiresia-diathesis-dedomenon-fotogrammetrias-sti-pyli-ktimatologiou/",
    protocol: "portal_download",
    updatePolicy: "scheduled_sync",
    productionUse: "allowed_after_authorization",
    notes: [
      "Η νέα υπηρεσία από 29/01/2026 διαθέτει orthophotos, DTM, DSM, contours και building data.",
      "Απαιτεί ταυτοποιημένο/εξουσιοδοτημένο χρήστη και ισχύουν οι όροι διάθεσης του DLS.",
    ],
  },
  ...EOA.map(([district, owner]) => ({
    id: `eoa-${district}-private-water-network`,
    title: `${owner} — ιδιωτικό επιχειρησιακό δίκτυο ύδρευσης`,
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
      "No scraping or public exposure of operational pipe, valve or critical-infrastructure geometry.",
      "Ingest only through official API/export, signed data agreement or explicitly authorized private upload.",
      "Raw masters remain private; field users receive role-scoped viewport derivatives.",
    ],
  })),
];

export function getCyprusWaterGeospatialSourceSnapshot() {
  const sources = CYPRUS_WATER_GEOSPATIAL_SOURCES.map((source) => ({
    ...source,
    notes: [...source.notes],
  }));

  return {
    marker: "pantavion_cyprus_water_geospatial_sources_v2",
    generatedAt: new Date().toISOString(),
    totalSources: sources.length,
    publicSources: sources.filter((source) => source.access === "PUBLIC_OPEN").length,
    authorizedSources: sources.filter((source) => source.access === "AUTHORIZED_ACCOUNT_REQUIRED").length,
    authorityAgreementSources: sources.filter((source) => source.access === "AUTHORITY_DATA_AGREEMENT_REQUIRED").length,
    districts: ["lemesos", "lefkosia", "larnaka", "ammochostos", "pafos"],
    privacyRule:
      "Operational water-network geometry is critical-infrastructure private data. Pantavion may ingest it only from an authorized source and must serve role-scoped viewport derivatives instead of public raw masters.",
    sources,
  };
}
