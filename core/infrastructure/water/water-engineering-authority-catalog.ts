export type WaterEngineeringAuthoritySource = {
  id:string;
  authority:string;
  role:string[];
  access:"OPEN_OR_PUBLIC_REFERENCE"|"LICENSE_OR_PERMISSION_MAY_BE_REQUIRED";
  canonicalUrl:string;
  ingestionPolicy:string;
};

export const PANTAVION_WATER_ENGINEERING_AUTHORITIES:WaterEngineeringAuthoritySource[]=[
  {
    id:"epa-epanet-2-2",
    authority:"U.S. Environmental Protection Agency",
    role:["hydraulic_simulation","pressure","flow","headloss","pumps","valves","tanks","water_age","source_trace","pressure_driven_demand"],
    access:"OPEN_OR_PUBLIC_REFERENCE",
    canonicalUrl:"https://www.epa.gov/water-research/epanet",
    ingestionPolicy:"Use official open software/manual metadata and preserve version/provenance."
  },
  {
    id:"sandia-wntr",
    authority:"Sandia National Laboratories / U.S. EPA",
    role:["resilience","damage_scenarios","recovery","preparedness","criticality","response_prioritisation"],
    access:"OPEN_OR_PUBLIC_REFERENCE",
    canonicalUrl:"https://energy.sandia.gov/programs/energy-water/water-network-tool-for-resilience-wntr/",
    ingestionPolicy:"Use as analysis engine/reference; scenarios remain isolated from the authentic network."
  },
  {
    id:"ogc-sensorthings",
    authority:"Open Geospatial Consortium",
    role:["telemetry","sensor_metadata","pressure_streams","flow_streams","tank_levels","water_quality_observations","iot_interoperability"],
    access:"OPEN_OR_PUBLIC_REFERENCE",
    canonicalUrl:"https://www.ogc.org/standards/sensorthings/",
    ingestionPolicy:"Preferred normalized telemetry interface; adapters may map SCADA/IoT feeds into this model."
  },
  {
    id:"cyprus-dls-apis",
    authority:"Cyprus Department of Lands and Surveys",
    role:["cadastral_reference","roads","buildings","contours","topography","administrative_areas","hydrography"],
    access:"LICENSE_OR_PERMISSION_MAY_BE_REQUIRED",
    canonicalUrl:"https://portal.dls.moi.gov.cy/en/alles-ypiresies/katalogos-apis/",
    ingestionPolicy:"Use official APIs only where permission/access allows; do not copy protected cadastral datasets."
  },
  {
    id:"copernicus-dem",
    authority:"Copernicus Data Space Ecosystem",
    role:["supplementary_elevation","terrain_context"],
    access:"LICENSE_OR_PERMISSION_MAY_BE_REQUIRED",
    canonicalUrl:"https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM",
    ingestionPolicy:"Supplementary terrain source only; never silently substitute coarse DSM for surveyed utility elevations."
  },
  {
    id:"awwa-water-loss",
    authority:"American Water Works Association",
    role:["water_audit","non_revenue_water","leakage_management","performance_indicators","pressure_management"],
    access:"LICENSE_OR_PERMISSION_MAY_BE_REQUIRED",
    canonicalUrl:"https://www.awwa.org/water-loss/",
    ingestionPolicy:"Use public metadata/free tools where permitted; protected manuals/standards require licensed access."
  }
];

export const PANTAVION_WATER_EVIDENCE_PRECEDENCE = [
  "VALIDATED_FIELD_MEASUREMENT",
  "UTILITY_TELEMETRY_OR_SCADA",
  "SURVEYED_NETWORK_AND_ELEVATION",
  "OFFICIAL_GEOSPATIAL_REFERENCE",
  "CALIBRATED_HYDRAULIC_MODEL",
  "SUPPLEMENTARY_REMOTE_SENSING_OR_DEM",
  "GENERIC_ENGINEERING_ASSUMPTION"
] as const;
