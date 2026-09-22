export type WaterMapFormatFamily =
  | "gis_vector"
  | "gis_raster"
  | "cad"
  | "bim"
  | "point_cloud"
  | "document_image"
  | "tabular"
  | "archive_bundle"
  | "unknown_future";

export type WaterMapAdapterState =
  | "known_adapter"
  | "bundle_required"
  | "adapter_required"
  | "raw_only";

export type WaterMapFormatDecision = {
  detectedFormat: string;
  formatFamily: WaterMapFormatFamily;
  adapterState: WaterMapAdapterState;
  extension: string;
  canonicalHints: string[];
  truth: string;
};

const normalizeExtension = (fileName: string) => {
  const clean = String(fileName || "").trim().toLowerCase();
  const index = clean.lastIndexOf(".");
  if (index < 0 || index === clean.length - 1) return "";
  return clean.slice(index + 1).replace(/[^a-z0-9]/g, "").slice(0, 16);
};

const REGISTRY: Record<string, Omit<WaterMapFormatDecision, "extension">> = {
  geojson: { detectedFormat: "GeoJSON", formatFamily: "gis_vector", adapterState: "known_adapter", canonicalHints: ["geojson","vector"], truth: "Known GIS vector format." },
  json: { detectedFormat: "JSON/GeoJSON candidate", formatFamily: "gis_vector", adapterState: "known_adapter", canonicalHints: ["json","inspect-schema"], truth: "JSON is preserved first and schema-checked before canonical GIS use." },
  kml: { detectedFormat: "KML", formatFamily: "gis_vector", adapterState: "known_adapter", canonicalHints: ["kml","geojson"], truth: "Known GIS interchange format." },
  kmz: { detectedFormat: "KMZ", formatFamily: "archive_bundle", adapterState: "known_adapter", canonicalHints: ["kmz","kml","styles"], truth: "Known compressed KML bundle." },
  gpx: { detectedFormat: "GPX", formatFamily: "gis_vector", adapterState: "adapter_required", canonicalHints: ["gpx","tracks","waypoints"], truth: "Raw source preserved; adapter must verify geometry/CRS." },
  gml: { detectedFormat: "GML", formatFamily: "gis_vector", adapterState: "adapter_required", canonicalHints: ["gml","xml","crs"], truth: "Raw source preserved; adapter required." },
  gpkg: { detectedFormat: "GeoPackage", formatFamily: "gis_vector", adapterState: "adapter_required", canonicalHints: ["gpkg","sqlite","layers"], truth: "Raw source preserved; adapter required before browser serving." },
  shp: { detectedFormat: "ESRI Shapefile component", formatFamily: "archive_bundle", adapterState: "bundle_required", canonicalHints: ["shp","dbf","shx","prj"], truth: "Shapefile requires companion files; ZIP bundle is preferred." },
  zip: { detectedFormat: "ZIP bundle", formatFamily: "archive_bundle", adapterState: "adapter_required", canonicalHints: ["archive","inspect-manifest"], truth: "Bundle is preserved and inspected before extraction." },
  dwg: { detectedFormat: "DWG", formatFamily: "cad", adapterState: "adapter_required", canonicalHints: ["dwg","cad","georeference"], truth: "Raw DWG remains private; derived GIS layers require controlled conversion/georeferencing." },
  dxf: { detectedFormat: "DXF", formatFamily: "cad", adapterState: "known_adapter", canonicalHints: ["dxf","cad","vector"], truth: "Known CAD interchange format; coordinates still require validation." },
  dgn: { detectedFormat: "DGN", formatFamily: "cad", adapterState: "adapter_required", canonicalHints: ["dgn","cad"], truth: "Raw source preserved; conversion adapter required." },
  ifc: { detectedFormat: "IFC", formatFamily: "bim", adapterState: "adapter_required", canonicalHints: ["ifc","bim"], truth: "Raw BIM source preserved; adapter required." },
  rvt: { detectedFormat: "Revit RVT", formatFamily: "bim", adapterState: "raw_only", canonicalHints: ["rvt","bim","external-converter"], truth: "Raw source preserved. Native parsing is not claimed." },
  tif: { detectedFormat: "TIFF/GeoTIFF candidate", formatFamily: "gis_raster", adapterState: "adapter_required", canonicalHints: ["tiff","geotiff","raster"], truth: "Metadata/CRS must be inspected before use." },
  tiff: { detectedFormat: "TIFF/GeoTIFF candidate", formatFamily: "gis_raster", adapterState: "adapter_required", canonicalHints: ["tiff","geotiff","raster"], truth: "Metadata/CRS must be inspected before use." },
  jp2: { detectedFormat: "JPEG 2000", formatFamily: "gis_raster", adapterState: "adapter_required", canonicalHints: ["jp2","raster"], truth: "Raw raster preserved; geospatial metadata must be verified." },
  img: { detectedFormat: "Raster IMG", formatFamily: "gis_raster", adapterState: "adapter_required", canonicalHints: ["img","raster"], truth: "Raw raster preserved; adapter required." },
  asc: { detectedFormat: "ASCII Grid", formatFamily: "gis_raster", adapterState: "adapter_required", canonicalHints: ["asc","dem","raster"], truth: "Raw elevation/grid source preserved; CRS required." },
  las: { detectedFormat: "LAS point cloud", formatFamily: "point_cloud", adapterState: "adapter_required", canonicalHints: ["las","point-cloud"], truth: "Raw point cloud preserved; adapter required." },
  laz: { detectedFormat: "LAZ point cloud", formatFamily: "point_cloud", adapterState: "adapter_required", canonicalHints: ["laz","point-cloud"], truth: "Raw point cloud preserved; adapter required." },
  e57: { detectedFormat: "E57 point cloud", formatFamily: "point_cloud", adapterState: "adapter_required", canonicalHints: ["e57","point-cloud"], truth: "Raw point cloud preserved; adapter required." },
  csv: { detectedFormat: "CSV", formatFamily: "tabular", adapterState: "known_adapter", canonicalHints: ["csv","coordinates","attributes"], truth: "Tabular source must be schema-checked before spatial interpretation." },
  tsv: { detectedFormat: "TSV", formatFamily: "tabular", adapterState: "known_adapter", canonicalHints: ["tsv","coordinates","attributes"], truth: "Tabular source must be schema-checked before spatial interpretation." },
  pdf: { detectedFormat: "PDF plan/document", formatFamily: "document_image", adapterState: "adapter_required", canonicalHints: ["pdf","plan","georeference"], truth: "Document may be reference-only until georeferenced or vectorized." },
  svg: { detectedFormat: "SVG", formatFamily: "document_image", adapterState: "adapter_required", canonicalHints: ["svg","vector-image"], truth: "Vector image is not assumed to be geospatial until verified." },
  png: { detectedFormat: "PNG", formatFamily: "document_image", adapterState: "adapter_required", canonicalHints: ["png","image","georeference"], truth: "Image is preserved; georeferencing required for map use." },
  jpg: { detectedFormat: "JPEG", formatFamily: "document_image", adapterState: "adapter_required", canonicalHints: ["jpeg","image","georeference"], truth: "Image is preserved; georeferencing required for map use." },
  jpeg: { detectedFormat: "JPEG", formatFamily: "document_image", adapterState: "adapter_required", canonicalHints: ["jpeg","image","georeference"], truth: "Image is preserved; georeferencing required for map use." },
  mbtiles: { detectedFormat: "MBTiles", formatFamily: "gis_raster", adapterState: "adapter_required", canonicalHints: ["mbtiles","tiles"], truth: "Tile database preserved; serving adapter required." },
  pmtiles: { detectedFormat: "PMTiles", formatFamily: "gis_raster", adapterState: "adapter_required", canonicalHints: ["pmtiles","tiles"], truth: "Tile archive preserved; serving adapter required." },
};

export function classifyWaterMapFormat(fileName: string): WaterMapFormatDecision {
  const extension = normalizeExtension(fileName);
  const known = REGISTRY[extension];
  if (known) return { ...known, extension };

  return {
    detectedFormat: extension ? `Unknown/Future .${extension}` : "Unknown/Future format",
    formatFamily: "unknown_future",
    adapterState: "adapter_required",
    extension,
    canonicalHints: ["raw-preservation","adapter-discovery","technology-radar"],
    truth:
      "Pantavion accepts and preserves the raw bytes, but does not claim native understanding until a verified adapter exists.",
  };
}

export const WATER_MAP_UNIVERSAL_INGEST_DOCTRINE = {
  acceptsUnknownFutureFormats: true,
  rawPreservationBeforeConversion: true,
  noFakeParsing: true,
  canonicalMutationRequiresReview: true,
  largeUploadProtocol: "Supabase Storage TUS resumable upload",
  maxRawBytes: 1610612736,
} as const;
