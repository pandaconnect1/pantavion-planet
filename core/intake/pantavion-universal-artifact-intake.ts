import { createHash } from "node:crypto";

import type { PantavionAutonomousBuildTarget } from "@/core/kernel/pantavion-autonomous-builder-kernel";
import type { PantavionFounderWorkOrderSubmission } from "@/core/kernel/pantavion-work-order-runtime";
import type { PantavionConversationDomain } from "@/core/intake/pantavion-conversation-intake";

export const PANTAVION_UNIVERSAL_ARTIFACT_MARKER =
  "pantavion_universal_artifact_intake_v1" as const;

export type PantavionArtifactSourceKind =
  | "device_upload"
  | "storage_reference"
  | "connector"
  | "repo_recovery"
  | "conversation_attachment"
  | "archive_import"
  | "legacy_media"
  | "url_reference";

export type PantavionArtifactFamily =
  | "text"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "structured_data"
  | "database"
  | "email"
  | "image"
  | "audio"
  | "video"
  | "cad_2d"
  | "cad_3d"
  | "gis_vector"
  | "gis_raster"
  | "map_tile"
  | "archive"
  | "source_code"
  | "executable"
  | "disk_image"
  | "font"
  | "model_3d"
  | "unknown";

export type PantavionArtifactSupportState =
  | "NATIVE"
  | "CONVERT"
  | "PRESERVE"
  | "ADAPTER_REQUIRED"
  | "SANDBOX_REQUIRED";

export type PantavionArtifactRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type PantavionArtifactAdapter =
  | "pantavion_text"
  | "pantavion_structured_data"
  | "pantavion_personal_ai_multimodal"
  | "pantavion_stt"
  | "pantavion_cad_mlightcad"
  | "pantavion_gis_geojson"
  | "pantavion_kml_geojson_converter"
  | "pantavion_archive_sandbox"
  | "pantavion_code_analysis"
  | "pantavion_binary_quarantine"
  | "pantavion_legacy_converter"
  | "pantavion_adapter_registry";

export interface PantavionArtifactIntakeInput {
  sourceKind: PantavionArtifactSourceKind;
  sourceId: string;
  fileName: string;
  sizeBytes: number;
  mimeType?: string | null;
  sha256?: string | null;
  sha256VerifiedFromBytes?: boolean;
  firstBytesBase64?: string | null;
  storageReference?: string | null;
  sourceDate?: string | null;
  domains?: PantavionConversationDomain[];
  notes?: string[];
}

export interface PantavionArtifactDetection {
  extension: string | null;
  signature: string | null;
  formatId: string;
  family: PantavionArtifactFamily;
  supportState: PantavionArtifactSupportState;
  adapter: PantavionArtifactAdapter;
  risk: PantavionArtifactRisk;
  confidence: "signature" | "extension" | "mime" | "unknown";
  existingPantavionEvidence: string[];
}

export interface PantavionArtifactIntakeRecord {
  marker: typeof PANTAVION_UNIVERSAL_ARTIFACT_MARKER;
  intakeId: string;
  source: {
    kind: PantavionArtifactSourceKind;
    id: string;
    date: string | null;
    storageReference: string | null;
  };
  file: {
    name: string;
    sizeBytes: number;
    mimeType: string | null;
    sha256: string | null;
    sha256VerifiedFromBytes: boolean;
  };
  detection: PantavionArtifactDetection;
  domains: PantavionConversationDomain[];
  notes: string[];
  security: {
    directExecutionAllowed: false;
    quarantineRequired: boolean;
    archiveExpansionRestricted: boolean;
    macrosOrActiveContentPossible: boolean;
    untrustedInput: true;
    truthBoundary: string;
  };
  processingPlan: string[];
  truth: {
    acceptedIntoEcosystem: true;
    parserReady: boolean;
    conversionReady: boolean;
    preservedEvenWhenUnsupported: true;
    verifiedLive: false;
  };
}

export interface PantavionArtifactWorkOrderCandidate {
  marker: "pantavion_artifact_work_order_candidate_v1";
  intakeId: string;
  submission: PantavionFounderWorkOrderSubmission;
  authority: {
    directExecutionAllowed: false;
    approvalScope: "proposal_only";
    reason: string;
  };
}

interface FormatRule {
  formatId: string;
  extensions: readonly string[];
  mimes?: readonly string[];
  family: PantavionArtifactFamily;
  support: PantavionArtifactSupportState;
  adapter: PantavionArtifactAdapter;
  risk: PantavionArtifactRisk;
  evidence?: readonly string[];
  activeContent?: boolean;
}

const FORMAT_RULES: readonly FormatRule[] = [
  {
    formatId: "plain_text",
    extensions: ["txt", "md", "markdown", "log", "ini", "cfg", "conf"],
    mimes: ["text/plain", "text/markdown"],
    family: "text",
    support: "NATIVE",
    adapter: "pantavion_text",
    risk: "LOW",
  },
  {
    formatId: "web_text",
    extensions: ["html", "htm", "xhtml", "css", "xml", "xsl", "xslt"],
    mimes: ["text/html", "application/xhtml+xml", "application/xml", "text/xml"],
    family: "text",
    support: "NATIVE",
    adapter: "pantavion_text",
    risk: "MEDIUM",
    activeContent: true,
  },
  {
    formatId: "pdf",
    extensions: ["pdf"],
    mimes: ["application/pdf"],
    family: "document",
    support: "NATIVE",
    adapter: "pantavion_personal_ai_multimodal",
    risk: "MEDIUM",
    evidence: ["Personal AI v3 accepts bounded PDF input"],
    activeContent: true,
  },
  {
    formatId: "office_document",
    extensions: ["doc", "docx", "dot", "dotx", "odt", "rtf", "wpd", "pages"],
    family: "document",
    support: "ADAPTER_REQUIRED",
    adapter: "pantavion_legacy_converter",
    risk: "MEDIUM",
    activeContent: true,
  },
  {
    formatId: "ebook",
    extensions: ["epub", "mobi", "azw", "azw3", "fb2"],
    family: "document",
    support: "CONVERT",
    adapter: "pantavion_legacy_converter",
    risk: "MEDIUM",
  },
  {
    formatId: "spreadsheet",
    extensions: ["csv", "tsv", "xls", "xlsx", "xlsm", "ods", "numbers", "wk1", "wk3", "wks"],
    family: "spreadsheet",
    support: "CONVERT",
    adapter: "pantavion_structured_data",
    risk: "MEDIUM",
    activeContent: true,
  },
  {
    formatId: "presentation",
    extensions: ["ppt", "pptx", "pptm", "odp", "key"],
    family: "presentation",
    support: "ADAPTER_REQUIRED",
    adapter: "pantavion_legacy_converter",
    risk: "MEDIUM",
    activeContent: true,
  },
  {
    formatId: "json_family",
    extensions: ["json", "jsonl", "ndjson", "geojson", "topojson"],
    mimes: ["application/json", "application/geo+json"],
    family: "structured_data",
    support: "NATIVE",
    adapter: "pantavion_structured_data",
    risk: "LOW",
  },
  {
    formatId: "yaml_toml",
    extensions: ["yaml", "yml", "toml"],
    family: "structured_data",
    support: "NATIVE",
    adapter: "pantavion_structured_data",
    risk: "LOW",
  },
  {
    formatId: "columnar_data",
    extensions: ["parquet", "arrow", "feather", "avro", "orc"],
    family: "structured_data",
    support: "ADAPTER_REQUIRED",
    adapter: "pantavion_adapter_registry",
    risk: "LOW",
  },
  {
    formatId: "database",
    extensions: ["sqlite", "sqlite3", "db", "db3", "mdb", "accdb", "dbf", "sql", "dump", "bak"],
    family: "database",
    support: "SANDBOX_REQUIRED",
    adapter: "pantavion_archive_sandbox",
    risk: "HIGH",
  },
  {
    formatId: "email",
    extensions: ["eml", "msg", "mbox", "pst", "ost", "vcf", "ics"],
    family: "email",
    support: "ADAPTER_REQUIRED",
    adapter: "pantavion_legacy_converter",
    risk: "MEDIUM",
    activeContent: true,
  },
  {
    formatId: "raster_image",
    extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "tif", "tiff", "heic", "heif", "avif"],
    mimes: ["image/png", "image/jpeg", "image/gif", "image/webp", "image/tiff", "image/avif"],
    family: "image",
    support: "NATIVE",
    adapter: "pantavion_personal_ai_multimodal",
    risk: "LOW",
    evidence: ["Personal AI v3 accepts JPEG/PNG/WebP/GIF image input"],
  },
  {
    formatId: "vector_image",
    extensions: ["svg", "svgz", "eps", "ai", "cdr"],
    family: "image",
    support: "CONVERT",
    adapter: "pantavion_legacy_converter",
    risk: "MEDIUM",
    activeContent: true,
  },
  {
    formatId: "audio",
    extensions: ["wav", "mp3", "m4a", "aac", "flac", "ogg", "oga", "opus", "wma", "aiff", "aif", "amr", "3ga"],
    family: "audio",
    support: "NATIVE",
    adapter: "pantavion_stt",
    risk: "LOW",
    evidence: ["Pantavion STT runtime exists and is used by Personal AI voice continuity"],
  },
  {
    formatId: "video",
    extensions: ["mp4", "mov", "m4v", "avi", "mkv", "webm", "mpeg", "mpg", "wmv", "flv", "3gp", "3g2", "mts", "m2ts"],
    family: "video",
    support: "ADAPTER_REQUIRED",
    adapter: "pantavion_adapter_registry",
    risk: "LOW",
  },
  {
    formatId: "autocad_dwg",
    extensions: ["dwg"],
    mimes: ["image/vnd.dwg", "application/acad", "application/x-acad"],
    family: "cad_2d",
    support: "NATIVE",
    adapter: "pantavion_cad_mlightcad",
    risk: "MEDIUM",
    evidence: [
      "Pantavion ships libredwg parser worker routing",
      "Canonical Water Map B DWG has recorded filename, byte size, SHA-256 and private storage path",
    ],
  },
  {
    formatId: "autocad_dxf",
    extensions: ["dxf"],
    mimes: ["image/vnd.dxf", "application/dxf"],
    family: "cad_2d",
    support: "NATIVE",
    adapter: "pantavion_cad_mlightcad",
    risk: "MEDIUM",
    evidence: ["Pantavion ships DXF parser worker routing"],
  },
  {
    formatId: "legacy_cad_2d",
    extensions: ["dgn", "dwf", "dwfx", "plt", "hpgl", "hp2"],
    family: "cad_2d",
    support: "ADAPTER_REQUIRED",
    adapter: "pantavion_legacy_converter",
    risk: "MEDIUM",
  },
  {
    formatId: "cad_exchange_3d",
    extensions: ["step", "stp", "iges", "igs", "ifc", "sat", "x_t", "x_b", "jt"],
    family: "cad_3d",
    support: "ADAPTER_REQUIRED",
    adapter: "pantavion_adapter_registry",
    risk: "MEDIUM",
  },
  {
    formatId: "bim_authoring",
    extensions: ["rvt", "rfa", "nwd", "nwc"],
    family: "cad_3d",
    support: "PRESERVE",
    adapter: "pantavion_adapter_registry",
    risk: "MEDIUM",
  },
  {
    formatId: "gis_vector",
    extensions: ["shp", "shx", "prj", "cpg", "qpj", "gpkg", "gml", "gpx", "osm", "pbf"],
    family: "gis_vector",
    support: "CONVERT",
    adapter: "pantavion_gis_geojson",
    risk: "LOW",
  },
  {
    formatId: "kml_kmz",
    extensions: ["kml", "kmz"],
    mimes: ["application/vnd.google-earth.kml+xml", "application/vnd.google-earth.kmz"],
    family: "gis_vector",
    support: "CONVERT",
    adapter: "pantavion_kml_geojson_converter",
    risk: "MEDIUM",
    evidence: ["Pantavion contains KML-to-GeoJSON conversion tooling"],
  },
  {
    formatId: "gis_raster",
    extensions: ["geotiff", "tif", "tiff", "img", "asc", "grd", "dem", "hgt", "ecw", "jp2"],
    family: "gis_raster",
    support: "ADAPTER_REQUIRED",
    adapter: "pantavion_adapter_registry",
    risk: "LOW",
  },
  {
    formatId: "map_tiles",
    extensions: ["mbtiles", "pmtiles"],
    family: "map_tile",
    support: "ADAPTER_REQUIRED",
    adapter: "pantavion_adapter_registry",
    risk: "LOW",
  },
  {
    formatId: "archive",
    extensions: ["zip", "7z", "rar", "tar", "gz", "tgz", "bz2", "tbz", "xz", "txz", "cab", "arj", "lha", "lzh", "ace"],
    family: "archive",
    support: "SANDBOX_REQUIRED",
    adapter: "pantavion_archive_sandbox",
    risk: "HIGH",
  },
  {
    formatId: "source_code",
    extensions: [
      "c", "h", "cc", "cpp", "cxx", "hpp", "cs", "java", "kt", "kts", "swift",
      "m", "mm", "py", "pyw", "js", "mjs", "cjs", "jsx", "ts", "tsx", "go", "rs",
      "rb", "php", "pl", "pm", "lua", "r", "scala", "sh", "bash", "zsh", "fish", "ps1",
      "bat", "cmd", "asm", "s", "sol", "dart", "vue", "svelte",
    ],
    family: "source_code",
    support: "NATIVE",
    adapter: "pantavion_code_analysis",
    risk: "HIGH",
    activeContent: true,
  },
  {
    formatId: "executable_binary",
    extensions: ["exe", "dll", "sys", "com", "scr", "msi", "msp", "apk", "aab", "ipa", "appx", "appxbundle", "deb", "rpm", "pkg", "dmg", "bin", "elf", "so", "dylib"],
    family: "executable",
    support: "SANDBOX_REQUIRED",
    adapter: "pantavion_binary_quarantine",
    risk: "CRITICAL",
    activeContent: true,
  },
  {
    formatId: "disk_image",
    extensions: ["iso", "img", "vhd", "vhdx", "vmdk", "qcow", "qcow2", "raw"],
    family: "disk_image",
    support: "SANDBOX_REQUIRED",
    adapter: "pantavion_binary_quarantine",
    risk: "CRITICAL",
  },
  {
    formatId: "font",
    extensions: ["ttf", "otf", "woff", "woff2", "eot", "fon"],
    family: "font",
    support: "PRESERVE",
    adapter: "pantavion_adapter_registry",
    risk: "MEDIUM",
  },
  {
    formatId: "model_3d",
    extensions: ["obj", "stl", "ply", "gltf", "glb", "fbx", "dae", "3ds", "blend", "usdz", "usd", "usda", "usdc"],
    family: "model_3d",
    support: "ADAPTER_REQUIRED",
    adapter: "pantavion_adapter_registry",
    risk: "MEDIUM",
  },
] as const;

const MAX_SAMPLE_BYTES = 2048;
const MAX_FILE_BYTES = 20 * 1024 * 1024 * 1024;
const SOURCE_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,239}$/;
const SHA256_PATTERN = /^[a-fA-F0-9]{64}$/;

function extensionOf(fileName: string): string | null {
  const normalized = fileName.trim().toLowerCase();
  const base = normalized.split(/[\\/]/).pop() ?? normalized;
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) return null;
  return base.slice(dot + 1);
}

function normalizeSourceId(value: string): string {
  const normalized = value.trim();
  if (!SOURCE_ID_PATTERN.test(normalized) || normalized.includes("..")) {
    throw new Error("artifact_source_id_invalid");
  }
  return normalized;
}

function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error("artifact_source_date_invalid");
  return new Date(parsed).toISOString();
}

function normalizeFileName(value: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > 512 || normalized.includes("\0")) {
    throw new Error("artifact_file_name_invalid");
  }
  return normalized.replace(/[\\/]+/g, "_");
}

function normalizeSize(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_FILE_BYTES) {
    throw new Error("artifact_size_invalid");
  }
  return value;
}

function normalizeSha256(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!SHA256_PATTERN.test(normalized)) throw new Error("artifact_sha256_invalid");
  return normalized;
}

function decodeSample(value: string | null | undefined): Uint8Array | null {
  if (!value) return null;
  if (value.length > Math.ceil(MAX_SAMPLE_BYTES * 1.5)) {
    throw new Error("artifact_sample_too_large");
  }
  let bytes: Buffer;
  try {
    bytes = Buffer.from(value, "base64");
  } catch {
    throw new Error("artifact_sample_invalid");
  }
  if (bytes.byteLength > MAX_SAMPLE_BYTES) throw new Error("artifact_sample_too_large");
  return bytes;
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function asciiPrefix(bytes: Uint8Array, length = 64): string {
  return Buffer.from(bytes.slice(0, Math.min(length, bytes.length))).toString("latin1");
}

function detectSignature(sample: Uint8Array | null): { signature: string; formatId: string } | null {
  if (!sample || sample.length === 0) return null;
  const ascii = asciiPrefix(sample, 128);

  if (ascii.startsWith("%PDF-")) return { signature: "pdf_magic", formatId: "pdf" };
  if (startsWith(sample, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { signature: "png_magic", formatId: "raster_image" };
  }
  if (startsWith(sample, [0xff, 0xd8, 0xff])) return { signature: "jpeg_magic", formatId: "raster_image" };
  if (ascii.startsWith("GIF87a") || ascii.startsWith("GIF89a")) {
    return { signature: "gif_magic", formatId: "raster_image" };
  }
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") {
    return { signature: "webp_magic", formatId: "raster_image" };
  }
  if (ascii.startsWith("AC10")) return { signature: "dwg_ac10_header", formatId: "autocad_dwg" };
  if (startsWith(sample, [0x50, 0x4b, 0x03, 0x04]) || startsWith(sample, [0x50, 0x4b, 0x05, 0x06])) {
    return { signature: "zip_magic", formatId: "archive" };
  }
  if (startsWith(sample, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) {
    return { signature: "7z_magic", formatId: "archive" };
  }
  if (ascii.startsWith("Rar!\x1a\x07")) return { signature: "rar_magic", formatId: "archive" };
  if (startsWith(sample, [0x1f, 0x8b])) return { signature: "gzip_magic", formatId: "archive" };
  if (ascii.startsWith("SQLite format 3\x00")) return { signature: "sqlite_magic", formatId: "database" };
  if (startsWith(sample, [0x7f, 0x45, 0x4c, 0x46])) return { signature: "elf_magic", formatId: "executable_binary" };
  if (startsWith(sample, [0x4d, 0x5a])) return { signature: "pe_mz_magic", formatId: "executable_binary" };
  if (ascii.trimStart().startsWith("{" ) || ascii.trimStart().startsWith("[")) {
    return { signature: "json_like_text", formatId: "json_family" };
  }
  if (ascii.includes("<kml") || ascii.includes("<kml:")) return { signature: "kml_xml", formatId: "kml_kmz" };

  return null;
}

function findRuleByFormatId(formatId: string): FormatRule | null {
  return FORMAT_RULES.find((rule) => rule.formatId === formatId) ?? null;
}

function findRuleByExtension(extension: string | null): FormatRule | null {
  if (!extension) return null;
  return FORMAT_RULES.find((rule) => rule.extensions.includes(extension)) ?? null;
}

function findRuleByMime(mimeType: string | null): FormatRule | null {
  if (!mimeType) return null;
  const normalized = mimeType.toLowerCase().split(";", 1)[0].trim();
  return FORMAT_RULES.find((rule) => rule.mimes?.includes(normalized)) ?? null;
}

function unknownDetection(extension: string | null): PantavionArtifactDetection {
  return {
    extension,
    signature: null,
    formatId: "unknown",
    family: "unknown",
    supportState: "PRESERVE",
    adapter: "pantavion_adapter_registry",
    risk: "MEDIUM",
    confidence: "unknown",
    existingPantavionEvidence: [],
  };
}

function detectionFor(input: {
  extension: string | null;
  mimeType: string | null;
  sample: Uint8Array | null;
}): PantavionArtifactDetection {
  const signature = detectSignature(input.sample);
  const signatureRule = signature ? findRuleByFormatId(signature.formatId) : null;
  const extensionRule = findRuleByExtension(input.extension);
  const mimeRule = findRuleByMime(input.mimeType);
  const rule = signatureRule ?? extensionRule ?? mimeRule;

  if (!rule) return unknownDetection(input.extension);

  return {
    extension: input.extension,
    signature: signature?.signature ?? null,
    formatId: rule.formatId,
    family: rule.family,
    supportState: rule.support,
    adapter: rule.adapter,
    risk: rule.risk,
    confidence: signatureRule ? "signature" : extensionRule ? "extension" : "mime",
    existingPantavionEvidence: [...(rule.evidence ?? [])],
  };
}

function activeContentPossible(detection: PantavionArtifactDetection): boolean {
  const rule = findRuleByFormatId(detection.formatId);
  return Boolean(rule?.activeContent) || detection.family === "source_code" || detection.family === "executable";
}

function processingPlanFor(detection: PantavionArtifactDetection): string[] {
  const base = [
    "preserve_original_bytes_and_source_identity",
    "verify_or_compute_sha256_before_canonical_promotion",
    "record_mime_extension_signature_and_size",
  ];

  if (detection.supportState === "NATIVE") {
    base.push(`route_to:${detection.adapter}`, "extract_metadata", "create_searchable_derivative_when_safe");
  } else if (detection.supportState === "CONVERT") {
    base.push(`route_to:${detection.adapter}`, "preserve_original_before_conversion", "compare_derivative_to_source");
  } else if (detection.supportState === "SANDBOX_REQUIRED") {
    base.push("quarantine", `route_to:${detection.adapter}`, "never_execute_untrusted_payload", "bounded_sandbox_analysis_only");
  } else if (detection.supportState === "ADAPTER_REQUIRED") {
    base.push("preserve_without_loss", "create_adapter_work_order", `target_adapter:${detection.adapter}`);
  } else {
    base.push("preserve_without_loss", "hold_for_adapter_or_manual_classification");
  }

  if (detection.family === "archive") {
    base.push("block_path_traversal", "limit_recursive_depth", "limit_expansion_ratio", "hash_each_extracted_member");
  }
  if (detection.family === "cad_2d" || detection.family === "cad_3d") {
    base.push("preserve_units_layers_blocks_coordinates", "do_not_replace_original_with_rendered_preview");
  }
  if (detection.family === "gis_vector" || detection.family === "gis_raster" || detection.family === "map_tile") {
    base.push("preserve_crs_projection_metadata", "preserve_geometry_source_and_transform_lineage");
  }

  return base;
}

function targetFor(domains: PantavionConversationDomain[], detection: PantavionArtifactDetection): PantavionAutonomousBuildTarget {
  if (domains.includes("water")) return "water_infrastructure";
  if (domains.includes("translation") || domains.includes("voice") || detection.family === "audio") return "translation";
  if (domains.includes("social") || domains.includes("people") || domains.includes("chat")) return "social_universe";
  if (domains.includes("marketplace")) return "marketplace";
  if (domains.includes("sos")) return "sos_elder";
  if (domains.includes("safety") || domains.includes("security")) return "safety_system";
  if (domains.includes("personal_ai") || domains.includes("learning")) return "pantaai_center";
  return "pantavion_internal";
}

function artifactFingerprint(input: {
  sourceKind: PantavionArtifactSourceKind;
  sourceId: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string | null;
  sha256: string | null;
  storageReference: string | null;
}): string {
  return createHash("sha256")
    .update(JSON.stringify(input), "utf8")
    .digest("hex");
}

function cleanStringList(values: string[] | undefined, max = 80): string[] {
  if (!values) return [];
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, max);
}

export function createPantavionArtifactIntakeRecord(
  input: PantavionArtifactIntakeInput,
): PantavionArtifactIntakeRecord {
  const sourceId = normalizeSourceId(input.sourceId);
  const fileName = normalizeFileName(input.fileName);
  const sizeBytes = normalizeSize(input.sizeBytes);
  const mimeType = input.mimeType?.trim().toLowerCase() || null;
  const sha256 = normalizeSha256(input.sha256);
  const sha256VerifiedFromBytes = input.sha256VerifiedFromBytes === true;
  if (sha256VerifiedFromBytes && !sha256) {
    throw new Error("artifact_sha256_verification_without_digest");
  }
  const sourceDate = normalizeDate(input.sourceDate);
  const storageReference = input.storageReference?.trim().slice(0, 1000) || null;
  const extension = extensionOf(fileName);
  const sample = decodeSample(input.firstBytesBase64);
  const detection = detectionFor({ extension, mimeType, sample });
  const domains: PantavionConversationDomain[] = Array.from(
    new Set<PantavionConversationDomain>(input.domains ?? ["general"]),
  );
  const fingerprint = artifactFingerprint({
    sourceKind: input.sourceKind,
    sourceId,
    fileName,
    sizeBytes,
    mimeType,
    sha256,
    storageReference,
  });
  const quarantineRequired =
    detection.supportState === "SANDBOX_REQUIRED" || detection.risk === "CRITICAL";

  return {
    marker: PANTAVION_UNIVERSAL_ARTIFACT_MARKER,
    intakeId: `pai_${fingerprint.slice(0, 32)}`,
    source: {
      kind: input.sourceKind,
      id: sourceId,
      date: sourceDate,
      storageReference,
    },
    file: {
      name: fileName,
      sizeBytes,
      mimeType,
      sha256,
      sha256VerifiedFromBytes,
    },
    detection,
    domains,
    notes: cleanStringList(input.notes),
    security: {
      directExecutionAllowed: false,
      quarantineRequired,
      archiveExpansionRestricted: detection.family === "archive",
      macrosOrActiveContentPossible: activeContentPossible(detection),
      untrustedInput: true,
      truthBoundary:
        "Pantavion may preserve and classify any artifact, but untrusted bytes never gain execution authority. Unsupported formats are preserved and routed to adapters instead of being falsely marked parsed or VERIFIED_LIVE.",
    },
    processingPlan: processingPlanFor(detection),
    truth: {
      acceptedIntoEcosystem: true,
      parserReady: detection.supportState === "NATIVE",
      conversionReady: detection.supportState === "CONVERT",
      preservedEvenWhenUnsupported: true,
      verifiedLive: false,
    },
  };
}

function workOrderIntent(record: PantavionArtifactIntakeRecord): string {
  return [
    `Pantavion universal artifact intake: ${record.intakeId}`,
    `Source: ${record.source.kind}:${record.source.id}`,
    `File: ${record.file.name}`,
    `Bytes: ${record.file.sizeBytes}`,
    `MIME: ${record.file.mimeType ?? "unknown"}`,
    `SHA-256: ${record.file.sha256 ?? "not_yet_verified"}`,
    `SHA-256 verified from stored bytes: ${record.file.sha256VerifiedFromBytes ? "yes" : "no"}`,
    `Detected format: ${record.detection.formatId}`,
    `Family: ${record.detection.family}`,
    `Support: ${record.detection.supportState}`,
    `Adapter: ${record.detection.adapter}`,
    `Risk: ${record.detection.risk}`,
    `Domains: ${record.domains.join(", ")}`,
    "Preserve the original artifact and provenance. Do not execute untrusted bytes. Compare with current canonical Pantavion data/code before transformation or implementation. Unsupported formats require a bounded adapter work order rather than a fake success state.",
  ].join("\n");
}

export function createPantavionArtifactWorkOrderCandidate(
  record: PantavionArtifactIntakeRecord,
): PantavionArtifactWorkOrderCandidate {
  return {
    marker: "pantavion_artifact_work_order_candidate_v1",
    intakeId: record.intakeId,
    submission: {
      idempotencyKey: `artifact:${record.intakeId.slice(4)}`,
      founderIntent: workOrderIntent(record).slice(0, 6000),
      target: targetFor(record.domains, record.detection),
      capabilities: ["repo_truth", "code_audit", "verification", "founder_approval_gate"],
      targetFiles: [],
      approvalScope: "proposal_only",
      workload: {
        kind: "single_work_order",
        unitCount: 1,
        intakeReference: record.intakeId,
      },
    },
    authority: {
      directExecutionAllowed: false,
      approvalScope: "proposal_only",
      reason:
        "Artifact intake can create a bounded work-order candidate, but file bytes, macros, code, executables and archive contents never receive direct production execution authority.",
    },
  };
}

export function getPantavionUniversalFormatRegistrySummary() {
  const extensions = new Set<string>();
  const families = new Set<PantavionArtifactFamily>();
  const formats = new Set<string>();
  for (const rule of FORMAT_RULES) {
    formats.add(rule.formatId);
    families.add(rule.family);
    for (const extension of rule.extensions) extensions.add(extension);
  }

  return {
    marker: "pantavion_universal_format_registry_summary_v1",
    registeredFormatRules: FORMAT_RULES.length,
    registeredExtensions: extensions.size,
    registeredFamilies: families.size,
    formatIds: Array.from(formats).sort(),
    families: Array.from(families).sort(),
    truth:
      "Registry coverage means Pantavion can classify/preserve/route these formats. It does not mean every format already has a native parser or is VERIFIED_LIVE.",
  };
}