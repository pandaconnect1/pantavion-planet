export const PANTAVION_WATER_KERNEL_CONSTITUTION_VERSION = "water-kernel-constitution-v1" as const;

export const WATER_KERNEL_NON_NEGOTIABLE_LAWS = {
  NO_DATA_LOSS: {
    code: "NO_DATA_LOSS",
    meaning:
      "The Pantavion water network must remain complete and intact. No source network data may be removed, reduced, replaced, sampled, or treated as disposable.",
    blocks: [
      "Removing Placemarks",
      "Removing LineStrings",
      "Removing coordinates",
      "Removing styles",
      "Removing colors",
      "Removing folders",
      "Removing layers",
      "Replacing the full source with a reduced dataset",
    ],
  },

  NO_SAMPLING_AS_FINAL: {
    code: "NO_SAMPLING_AS_FINAL",
    meaning:
      "Sampling, previews, reduced files, mobile subsets, or balanced subsets are never allowed to be presented as the final water network.",
    blocks: [
      "5000-feature final datasets",
      "mobile preview as production truth",
      "balanced sample as final truth",
      "classified sample as final truth",
    ],
  },

  NO_PREVIEW_AS_PRODUCTION: {
    code: "NO_PREVIEW_AS_PRODUCTION",
    meaning:
      "Preview files may only be marked as temporary diagnostics. Production truth must come from the full private master network.",
    blocks: [
      "water-network-mobile.geojson as final master",
      "temporary blob treated as final",
      "preview result described as complete",
    ],
  },

  NO_PUBLIC_GEODATA: {
    code: "NO_PUBLIC_GEODATA",
    meaning:
      "Sensitive water network geodata must not be committed to GitHub public paths, public folders, or exposed raw without explicit founder approval.",
    blocks: [
      "KMZ/KML/GeoJSON in public folder",
      "full private network in GitHub",
      "raw private geodata exposed as public asset",
    ],
  },

  NO_GUESSED_ASSET_TYPES: {
    code: "NO_GUESSED_ASSET_TYPES",
    meaning:
      "The system must not invent valves, hydrants, fittings, symbols, or categories unless they exist in verified source data.",
    blocks: [
      "guessed valves",
      "guessed hydrants",
      "guessed fittings",
      "guessed asset categories",
    ],
  },

  GOOGLE_EARTH_REFERENCE_REQUIRED: {
    code: "GOOGLE_EARTH_REFERENCE_REQUIRED",
    meaning:
      "The 10.4MB KMZ that opens correctly in Google Earth is the visual and data reference truth for this module.",
    requires: [
      "Google Earth reference comparison",
      "KML style/color preservation",
      "full source structure awareness",
    ],
  },

  BUILD_TSC_AUDIT_REQUIRED: {
    code: "BUILD_TSC_AUDIT_REQUIRED",
    meaning:
      "Water module changes must pass build, TypeScript, and water-specific audit gates before commit or deploy.",
    requires: [
      "npm run build",
      "npx tsc --noEmit",
      "water kernel gate",
    ],
  },

  FOUNDER_APPROVAL_REQUIRED: {
    code: "FOUNDER_APPROVAL_REQUIRED",
    meaning:
      "Any change that affects data pipeline, source truth, production geodata, deployment, or provider strategy requires explicit founder approval.",
    requires: [
      "founder approval before production data replacement",
      "founder approval before destructive cleanup",
      "founder approval before exposing geodata",
    ],
  },
} as const;

export type WaterKernelLawCode = keyof typeof WATER_KERNEL_NON_NEGOTIABLE_LAWS;

export const WATER_KERNEL_GATE_DECISION = {
  PASS: "PASS",
  FAIL: "FAIL",
  FOUNDER_REVIEW_REQUIRED: "FOUNDER_REVIEW_REQUIRED",
} as const;

export const WATER_KERNEL_REFERENCE_TRUTH = {
  sourceName: "diktio_idreusis (1)_1.kmz",
  sourceRole: "GOOGLE_EARTH_REFERENCE_TRUTH",
  mustRemainIntact: true,
  mayBeSampledAsFinal: false,
  mayBePubliclyExposed: false,
} as const;
