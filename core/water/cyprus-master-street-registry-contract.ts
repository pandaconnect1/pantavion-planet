export const CYPRUS_MASTER_STREET_REGISTRY_CONTRACT = {
  id: "CYPRUS_MASTER_STREET_REGISTRY",
  scope: "CYPRUS_NATIONWIDE",
  purpose:
    "Canonical discovery and verification registry for every known Cyprus street used by Pantavion Water.",
  hierarchy: [
    "DISTRICT",
    "MUNICIPALITY_OR_COMMUNITY",
    "AREA_OR_PARISH",
    "ZONE_OR_SECTION",
    "STREET",
  ],
  sourcePriority: [
    "CYPRUS_POST_STREET_POSTCODE_DATASET",
    "DLS_ROAD_NETWORK",
    "DLS_ADMINISTRATIVE_BOUNDARIES",
    "DLS_INSPIRE_ADDRESSES",
    "CONTROLLED_SUPPLEMENTARY_DISCOVERY",
  ],
  streetRecord: {
    identity: [
      "streetRegistryId",
      "nameEl",
      "nameEn",
      "normalizedName",
      "alternateNames",
      "formerNames",
    ],
    geography: [
      "district",
      "municipalityOrCommunity",
      "areaOrParish",
      "zoneOrSection",
      "postalCodes",
      "geometryOrExtent",
    ],
    verification: [
      "sourceReferences",
      "firstSeenAt",
      "lastCheckedAt",
      "sourceLastModifiedAt",
      "status",
      "confidence",
      "conflicts",
    ],
  },
  statuses: [
    "VERIFIED",
    "NEW_CANDIDATE",
    "RENAMED_CANDIDATE",
    "CONFLICT",
    "RETIRED_OR_HISTORICAL",
  ],
  discoveryRules: [
    "Never treat one provider as complete.",
    "Never silently overwrite a verified street identity or geometry.",
    "New or renamed streets enter review before VERIFIED.",
    "Preserve former names and provenance for historical search.",
    "Deduplicate by geography plus normalized multilingual name, not name alone.",
    "A street may legitimately share a name with streets in other municipalities or communities.",
    "Search must support Greek, English, Latin transliteration and Greeklish aliases.",
    "The registry is navigation/reference data and must not redefine authentic water-network geometry.",
  ],
  fieldWorkspaceIndex: {
    browse: ["DISTRICT", "MUNICIPALITY_OR_COMMUNITY", "AREA_OR_PARISH", "A_TO_Z"],
    quickFilters: ["RECENT", "FAVORITES", "ACTIVE_FAULTS", "ACTIVE_WORK_ORDERS"],
    onStreetSelect: [
      "ZOOM_TO_STREET",
      "SET_NAVIGATION_TARGET",
      "LOAD_WATER_NETWORK_VIEWPORT",
      "LOAD_RELEVANT_FAULTS_AND_WORK",
    ],
  },
} as const;

export type CyprusMasterStreetRegistryContract =
  typeof CYPRUS_MASTER_STREET_REGISTRY_CONTRACT;
