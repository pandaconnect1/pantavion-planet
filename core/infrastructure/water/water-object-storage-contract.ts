export type PantavionWaterObjectStorageProvider =
  | "cloudflare-r2"
  | "aws-s3"
  | "s3-compatible"
  | "unconfigured";

function clean(value: string | undefined) {
  return (value || "").trim();
}

function providerFromEnv(): PantavionWaterObjectStorageProvider {
  const explicit = clean(process.env.PANTAVION_OBJECT_STORAGE_PROVIDER).toLowerCase();

  if (explicit === "cloudflare-r2" || explicit === "r2") return "cloudflare-r2";
  if (explicit === "aws-s3" || explicit === "s3") return "aws-s3";
  if (explicit === "s3-compatible") return "s3-compatible";

  const endpoint = clean(process.env.PANTAVION_OBJECT_STORAGE_ENDPOINT).toLowerCase();
  if (endpoint.includes("r2.cloudflarestorage.com")) return "cloudflare-r2";
  if (endpoint.includes("amazonaws.com")) return "aws-s3";
  if (endpoint) return "s3-compatible";

  return "unconfigured";
}

export function getPantavionWaterObjectStorageSafeStatus() {
  const provider = providerFromEnv();
  const endpoint = clean(process.env.PANTAVION_OBJECT_STORAGE_ENDPOINT);
  const region = clean(process.env.PANTAVION_OBJECT_STORAGE_REGION);
  const bucket = clean(process.env.PANTAVION_OBJECT_STORAGE_BUCKET);
  const accessKey = clean(process.env.PANTAVION_OBJECT_STORAGE_ACCESS_KEY_ID);
  const secretKey = clean(process.env.PANTAVION_OBJECT_STORAGE_SECRET_ACCESS_KEY);

  const credentialsConfigured = Boolean(accessKey && secretKey);
  const destinationConfigured = Boolean(bucket && (endpoint || provider === "aws-s3"));
  const readyForMultipart = provider !== "unconfigured" &&
    credentialsConfigured &&
    destinationConfigured;

  return {
    marker: "pantavion_water_object_storage_v1" as const,
    provider,
    configured: readyForMultipart,
    endpointConfigured: Boolean(endpoint),
    regionConfigured: Boolean(region),
    bucketConfigured: Boolean(bucket),
    credentialsConfigured,
    capabilities: {
      privateRawMasters: true,
      multipartUploadRequired: true,
      resumableUploadRequired: true,
      derivedTileObjects: true,
      pmtilesRangeServingTarget: true,
      browserDirectRawMasterExposure: false,
      immutableOriginalPolicy: true,
      providerSwitchWithoutViewerRewrite: true,
    },
    security: {
      returnsSecretValues: false,
      rawMastersPublic: false,
      signedOrProtectedDeliveryRequired: true,
    },
  };
}
