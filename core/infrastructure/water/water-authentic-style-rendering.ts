export const WATER_AUTHENTIC_STYLE_MVT_PROPERTIES = {
  styleUrl: "style_url",
  sourceColorCss: "source_color_css",
  sourceOpacity: "source_opacity",
  sourceLineWidth: "source_line_width",
  layerName: "layer_name",
} as const;

export const PANTAVION_WATER_AUTHENTIC_STYLE_RENDERING_POLICY = {
  authenticGeometryMayBeModified: false,
  sourceStyleMetadataMayBeRead: true,
  sourceColourMustBePreservedWhenPresent: true,
  sourceOpacityMustBePreservedWhenPresent: true,
  sourceLineWidthMustRemainAvailableAsMetadata: true,
  displayWidthMayScaleWithZoomForFieldLegibility: true,
  displayWidthScalingDoesNotModifySource: true,
  fallbackColourAllowedOnlyWhenSourceColourMissing: true,
  fallbackColour: "#22d3ee",
} as const;

export function waterAuthenticLineColorExpression() {
  return [
    "coalesce",
    ["get", WATER_AUTHENTIC_STYLE_MVT_PROPERTIES.sourceColorCss],
    PANTAVION_WATER_AUTHENTIC_STYLE_RENDERING_POLICY.fallbackColour,
  ] as const;
}

export function waterAuthenticLineOpacityExpression() {
  return [
    "coalesce",
    ["get", WATER_AUTHENTIC_STYLE_MVT_PROPERTIES.sourceOpacity],
    0.92,
  ] as const;
}
