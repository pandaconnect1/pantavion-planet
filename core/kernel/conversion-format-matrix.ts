import {
  getConversionOptions,
  type ConversionAdapterStatus,
  type ConversionOption,
  type ConversionRiskZone,
} from "./conversion-engine";
import type { OmnimodalCategory } from "./omnimodal-intake";

export type ConversionSupportLevel =
  | "supported_local"
  | "provider_required"
  | "requires_adapter"
  | "manual_quote"
  | "blocked_sensitive";

export type ConversionLicenseStatus =
  | "none_needed"
  | "open_source_ok"
  | "provider_terms_required"
  | "paid_license_required"
  | "manual_legal_review";

export type DeviceSupportStatus =
  | "interface_supported"
  | "backend_processing_required"
  | "not_supported"
  | "blocked";

export type ConversionFormatMatrixRow = {
  id: string;
  sourceExtension: string;
  sourceCategory: OmnimodalCategory | "any";
  sourceLabel: string;
  targetExtension: string;
  targetLabel: string;
  supportLevel: ConversionSupportLevel;
  adapterStatus: ConversionAdapterStatus;
  adapterName: string;
  licenseStatus: ConversionLicenseStatus;
  costType: ConversionOption["pricingUnit"];
  estimatedBaseCostCents: number;
  estimatedVariableCostCents: number;
  currency: "EUR";
  costBand: "free_or_near_free" | "low" | "medium" | "high" | "manual";
  riskZone: ConversionRiskZone;
  mobile: DeviceSupportStatus;
  tablet: DeviceSupportStatus;
  web: DeviceSupportStatus;
  desktop: DeviceSupportStatus;
  originalPreservation: true;
  derivativeOnly: true;
  userMessage: string;
  policy: string;
};

export type ConversionFormatMatrixSummary = {
  totalRows: number;
  supportedLocal: number;
  providerRequired: number;
  requiresAdapter: number;
  manualQuote: number;
  blockedSensitive: number;
};

function normalizeExtension(value: string): string {
  const clean = value.trim().toLowerCase();
  if (!clean) return "unknown";
  return clean.startsWith(".") ? clean : `.${clean}`;
}

function extensionLabel(extension: string): string {
  const labels: Record<string, string> = {
    ".txt": "Text",
    ".md": "Markdown",
    ".json": "JSON",
    ".csv": "CSV",
    ".pdf": "PDF",
    ".docx": "Word",
    ".xlsx": "Excel",
    ".pptx": "PowerPoint",
    ".png": "PNG image",
    ".jpg": "JPEG image",
    ".jpeg": "JPEG image",
    ".webp": "WebP image",
    ".heic": "HEIC photo",
    ".avif": "AVIF image",
    ".mp3": "MP3 audio",
    ".wav": "WAV audio",
    ".mp4": "MP4 video",
    ".mov": "MOV video",
    ".dwg": "AutoCAD DWG",
    ".dxf": "AutoCAD DXF",
    ".rvt": "Revit model",
    ".ifc": "IFC BIM",
    ".kml": "KML map",
    ".kmz": "KMZ map",
    ".geojson": "GeoJSON",
    ".shp": "Shapefile",
    ".zip": "ZIP archive",
    ".exe": "Windows executable",
    ".env": "Environment secrets",
    ".pem": "Certificate/private key",
    ".key": "Private key",
    ".vault": "Secure vault",
    ".blocked": "Blocked output",
  };

  return labels[extension] ?? extension.toUpperCase();
}

function supportFromOption(option: ConversionOption): ConversionSupportLevel {
  if (option.adapterStatus === "available_local") return "supported_local";
  if (option.adapterStatus === "requires_adapter") return "requires_adapter";
  if (option.adapterStatus === "blocked") return "blocked_sensitive";
  if (option.pricingUnit === "manual_quote") return "manual_quote";
  return "provider_required";
}

function licenseFromOption(option: ConversionOption): ConversionLicenseStatus {
  if (option.adapterStatus === "available_local") return "open_source_ok";
  if (option.sourceCategory === "cad" || option.pricingUnit === "manual_quote") {
    return "paid_license_required";
  }
  if (option.adapterStatus === "provider_required") return "provider_terms_required";
  if (option.adapterStatus === "requires_adapter") return "manual_legal_review";
  return "none_needed";
}

function costBand(option: ConversionOption): ConversionFormatMatrixRow["costBand"] {
  if (option.pricingUnit === "manual_quote") return "manual";
  if (option.estimatedBaseCostCents <= 2) return "free_or_near_free";
  if (option.estimatedBaseCostCents <= 10) return "low";
  if (option.estimatedBaseCostCents <= 50) return "medium";
  return "high";
}

function riskZone(input: {
  sourceCategory: OmnimodalCategory | "any";
  supportLevel: ConversionSupportLevel;
  licenseStatus: ConversionLicenseStatus;
}): ConversionRiskZone {
  if (input.supportLevel === "blocked_sensitive") return "Z4_BLOCKED_MANUAL_ONLY";

  if (
    input.sourceCategory === "cad" ||
    input.sourceCategory === "gis" ||
    input.sourceCategory === "map" ||
    input.supportLevel === "manual_quote" ||
    input.licenseStatus === "paid_license_required"
  ) {
    return "Z3_FOUNDER_APPROVAL_REQUIRED";
  }

  if (
    input.supportLevel === "provider_required" ||
    input.supportLevel === "requires_adapter"
  ) {
    return "Z2_PREVIEW_REQUIRED";
  }

  return "Z1_AUTO_SAFE";
}

function deviceSupport(
  supportLevel: ConversionSupportLevel,
): Pick<ConversionFormatMatrixRow, "mobile" | "tablet" | "web" | "desktop"> {
  if (supportLevel === "blocked_sensitive") {
    return {
      mobile: "blocked",
      tablet: "blocked",
      web: "blocked",
      desktop: "blocked",
    };
  }

  return {
    mobile: "interface_supported",
    tablet: "interface_supported",
    web: "backend_processing_required",
    desktop: "backend_processing_required",
  };
}

function messageFor(input: {
  sourceExtension: string;
  targetExtension: string;
  supportLevel: ConversionSupportLevel;
  adapterName: string;
}): string {
  if (input.supportLevel === "supported_local") {
    return `${input.sourceExtension} → ${input.targetExtension} can be handled by a local Pantavion adapter.`;
  }

  if (input.supportLevel === "provider_required") {
    return `${input.sourceExtension} → ${input.targetExtension} requires a governed provider adapter before output is produced.`;
  }

  if (input.supportLevel === "manual_quote") {
    return `${input.sourceExtension} → ${input.targetExtension} is a professional/manual-quote conversion. Original remains source truth.`;
  }

  if (input.supportLevel === "blocked_sensitive") {
    return `${input.sourceExtension} is sensitive/restricted. No preview, execution or conversion is allowed without security review.`;
  }

  return `${input.sourceExtension} → ${input.targetExtension} requires a new adapter before Pantavion can claim support.`;
}

function rowFromOption(
  option: ConversionOption,
  sourceExtension: string,
  targetExtension: string,
): ConversionFormatMatrixRow {
  const supportLevel = supportFromOption(option);
  const licenseStatus = licenseFromOption(option);
  const devices = deviceSupport(supportLevel);

  return {
    id: `${sourceExtension}-to-${targetExtension}`.replaceAll(".", ""),
    sourceExtension,
    sourceCategory: option.sourceCategory,
    sourceLabel: extensionLabel(sourceExtension),
    targetExtension,
    targetLabel: extensionLabel(targetExtension),
    supportLevel,
    adapterStatus: option.adapterStatus,
    adapterName: option.adapterName,
    licenseStatus,
    costType: option.pricingUnit,
    estimatedBaseCostCents: option.estimatedBaseCostCents,
    estimatedVariableCostCents: option.estimatedVariableCostCents,
    currency: option.currency,
    costBand: costBand(option),
    riskZone: riskZone({
      sourceCategory: option.sourceCategory,
      supportLevel,
      licenseStatus,
    }),
    ...devices,
    originalPreservation: true,
    derivativeOnly: true,
    userMessage: messageFor({
      sourceExtension,
      targetExtension,
      supportLevel,
      adapterName: option.adapterName,
    }),
    policy: option.policy,
  };
}

const EXTRA_MATRIX_ROWS: ConversionFormatMatrixRow[] = [
  {
    id: "rvt-to-ifc",
    sourceExtension: ".rvt",
    sourceCategory: "cad",
    sourceLabel: "Revit/BIM model",
    targetExtension: ".ifc",
    targetLabel: "IFC BIM",
    supportLevel: "manual_quote",
    adapterStatus: "provider_required",
    adapterName: "provider.revit-bim.required",
    licenseStatus: "paid_license_required",
    costType: "manual_quote",
    estimatedBaseCostCents: 250,
    estimatedVariableCostCents: 0,
    currency: "EUR",
    costBand: "manual",
    riskZone: "Z3_FOUNDER_APPROVAL_REQUIRED",
    mobile: "interface_supported",
    tablet: "interface_supported",
    web: "backend_processing_required",
    desktop: "backend_processing_required",
    originalPreservation: true,
    derivativeOnly: true,
    userMessage:
      ".rvt → .ifc requires a licensed BIM/Revit adapter. Original remains preserved.",
    policy:
      "Revit/BIM conversion requires license/provider review. Output is derivative only.",
  },
  {
    id: "heic-to-jpg",
    sourceExtension: ".heic",
    sourceCategory: "image",
    sourceLabel: "HEIC photo",
    targetExtension: ".jpg",
    targetLabel: "JPEG image",
    supportLevel: "provider_required",
    adapterStatus: "provider_required",
    adapterName: "provider.image-heic.required",
    licenseStatus: "provider_terms_required",
    costType: "per_mb",
    estimatedBaseCostCents: 3,
    estimatedVariableCostCents: 1,
    currency: "EUR",
    costBand: "low",
    riskZone: "Z2_PREVIEW_REQUIRED",
    mobile: "interface_supported",
    tablet: "interface_supported",
    web: "backend_processing_required",
    desktop: "backend_processing_required",
    originalPreservation: true,
    derivativeOnly: true,
    userMessage: ".heic → .jpg requires an image adapter before output is produced.",
    policy: "Original photo remains preserved. Converted photo is derivative only.",
  },
  {
    id: "env-to-vault",
    sourceExtension: ".env",
    sourceCategory: "code",
    sourceLabel: "Environment secrets",
    targetExtension: ".vault",
    targetLabel: "Secure vault",
    supportLevel: "blocked_sensitive",
    adapterStatus: "blocked",
    adapterName: "pantavion.sensitive-artifact-vault.required",
    licenseStatus: "manual_legal_review",
    costType: "manual_quote",
    estimatedBaseCostCents: 0,
    estimatedVariableCostCents: 0,
    currency: "EUR",
    costBand: "manual",
    riskZone: "Z4_BLOCKED_MANUAL_ONLY",
    mobile: "blocked",
    tablet: "blocked",
    web: "blocked",
    desktop: "blocked",
    originalPreservation: true,
    derivativeOnly: true,
    userMessage:
      ".env files are sensitive artifacts. They are not normal conversion content.",
    policy:
      "Secrets must go to Sensitive Artifact Vault. No preview, no AI access, no conversion.",
  },
  {
    id: "exe-blocked",
    sourceExtension: ".exe",
    sourceCategory: "unknown",
    sourceLabel: "Executable",
    targetExtension: ".blocked",
    targetLabel: "Blocked output",
    supportLevel: "blocked_sensitive",
    adapterStatus: "blocked",
    adapterName: "pantavion.security-quarantine.required",
    licenseStatus: "manual_legal_review",
    costType: "manual_quote",
    estimatedBaseCostCents: 0,
    estimatedVariableCostCents: 0,
    currency: "EUR",
    costBand: "manual",
    riskZone: "Z4_BLOCKED_MANUAL_ONLY",
    mobile: "blocked",
    tablet: "blocked",
    web: "blocked",
    desktop: "blocked",
    originalPreservation: true,
    derivativeOnly: true,
    userMessage:
      "Executable files are security artifacts. No execution or conversion is allowed automatically.",
    policy:
      "Executable files require quarantine/security review. They are not converter inputs.",
  },
];

export function getConversionFormatMatrix(): ConversionFormatMatrixRow[] {
  const rows = getConversionOptions().flatMap((option) =>
    option.inputExtensions.flatMap((sourceExtension) =>
      option.outputExtensions.map((targetExtension) =>
        rowFromOption(
          option,
          normalizeExtension(sourceExtension),
          normalizeExtension(targetExtension),
        ),
      ),
    ),
  );

  return [...rows, ...EXTRA_MATRIX_ROWS].sort((a, b) =>
    `${a.sourceExtension}-${a.targetExtension}`.localeCompare(
      `${b.sourceExtension}-${b.targetExtension}`,
    ),
  );
}

export function summarizeConversionFormatMatrix(
  rows = getConversionFormatMatrix(),
): ConversionFormatMatrixSummary {
  return {
    totalRows: rows.length,
    supportedLocal: rows.filter((row) => row.supportLevel === "supported_local")
      .length,
    providerRequired: rows.filter(
      (row) => row.supportLevel === "provider_required",
    ).length,
    requiresAdapter: rows.filter((row) => row.supportLevel === "requires_adapter")
      .length,
    manualQuote: rows.filter((row) => row.supportLevel === "manual_quote").length,
    blockedSensitive: rows.filter(
      (row) => row.supportLevel === "blocked_sensitive",
    ).length,
  };
}

export function filterConversionFormatMatrix(input: {
  sourceExtension?: string;
  targetExtension?: string;
  supportLevel?: ConversionSupportLevel;
}): ConversionFormatMatrixRow[] {
  const sourceExtension = input.sourceExtension
    ? normalizeExtension(input.sourceExtension)
    : undefined;
  const targetExtension = input.targetExtension
    ? normalizeExtension(input.targetExtension)
    : undefined;

  return getConversionFormatMatrix().filter((row) => {
    if (sourceExtension && row.sourceExtension !== sourceExtension) return false;
    if (targetExtension && row.targetExtension !== targetExtension) return false;
    if (input.supportLevel && row.supportLevel !== input.supportLevel) return false;
    return true;
  });
}
