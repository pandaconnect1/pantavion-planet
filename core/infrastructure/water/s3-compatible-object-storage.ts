import { createHash, createHmac, randomUUID } from "node:crypto";

type StorageConfig = {
  provider: "cloudflare-r2" | "aws-s3" | "s3-compatible";
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
};

function clean(value: string | undefined) {
  return (value || "").trim();
}

function sha256Hex(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function amzTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function dateStamp(amzDate: string) {
  return amzDate.slice(0, 8);
}

function encodeSegment(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function encodeObjectKey(key: string) {
  return key.split("/").map(encodeSegment).join("/");
}

function canonicalQuery(entries: Array<[string, string]>) {
  return entries
    .map(([key, value]) => [encodeSegment(key), encodeSegment(value)] as const)
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      const keyOrder = leftKey.localeCompare(rightKey);
      return keyOrder || leftValue.localeCompare(rightValue);
    })
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function providerFromEnv(): StorageConfig["provider"] {
  const explicit = clean(process.env.PANTAVION_OBJECT_STORAGE_PROVIDER).toLowerCase();
  if (explicit === "cloudflare-r2" || explicit === "r2") return "cloudflare-r2";
  if (explicit === "aws-s3" || explicit === "s3") return "aws-s3";
  return "s3-compatible";
}

export function getS3CompatibleStorageConfig(): StorageConfig {
  const provider = providerFromEnv();
  const bucket = clean(process.env.PANTAVION_OBJECT_STORAGE_BUCKET);
  const accessKeyId = clean(process.env.PANTAVION_OBJECT_STORAGE_ACCESS_KEY_ID);
  const secretAccessKey = clean(process.env.PANTAVION_OBJECT_STORAGE_SECRET_ACCESS_KEY);
  const region =
    clean(process.env.PANTAVION_OBJECT_STORAGE_REGION) ||
    (provider === "cloudflare-r2" ? "auto" : "us-east-1");
  let endpoint = clean(process.env.PANTAVION_OBJECT_STORAGE_ENDPOINT);

  if (!endpoint && provider === "aws-s3") {
    endpoint =
      region === "us-east-1"
        ? "https://s3.amazonaws.com"
        : `https://s3.${region}.amazonaws.com`;
  }

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("PANTAVION_OBJECT_STORAGE_NOT_CONFIGURED");
  }

  const explicitPathStyle = clean(
    process.env.PANTAVION_OBJECT_STORAGE_FORCE_PATH_STYLE,
  ).toLowerCase();
  const endpointHost = new URL(endpoint).hostname.toLowerCase();

  const forcePathStyle =
    explicitPathStyle === "true"
      ? true
      : explicitPathStyle === "false"
        ? false
        : provider === "aws-s3"
          ? false
          : endpointHost === "storageapi.dev" || endpointHost.endsWith(".storageapi.dev")
            ? false
            : true;

  return {
    provider,
    endpoint: endpoint.replace(/\/+$/, ""),
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    forcePathStyle,
  };
}

function objectUrlParts(config: StorageConfig, key: string) {
  const endpoint = new URL(config.endpoint);
  const encodedKey = encodeObjectKey(key);

  if (config.forcePathStyle) {
    return {
      origin: endpoint.origin,
      host: endpoint.host,
      canonicalUri: `${endpoint.pathname.replace(/\/$/, "")}/${encodeSegment(config.bucket)}/${encodedKey}`.replace(
        /\/+/g,
        "/",
      ),
    };
  }

  const host = `${config.bucket}.${endpoint.host}`;
  return {
    origin: `${endpoint.protocol}//${host}`,
    host,
    canonicalUri: `${endpoint.pathname.replace(/\/$/, "")}/${encodedKey}`.replace(/\/+/g, "/"),
  };
}

function signingKey(secret: string, stamp: string, region: string) {
  const kDate = hmac(`AWS4${secret}`, stamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}

function authorizationSignature(input: {
  config: StorageConfig;
  method: string;
  key: string;
  queryEntries: Array<[string, string]>;
  payloadHash: string;
  contentType?: string;
  date?: Date;
}) {
  const amzDate = amzTimestamp(input.date);
  const stamp = dateStamp(amzDate);
  const parts = objectUrlParts(input.config, input.key);
  const headers: Array<[string, string]> = [
    ["host", parts.host],
    ["x-amz-content-sha256", input.payloadHash],
    ["x-amz-date", amzDate],
  ];
  if (input.contentType) headers.push(["content-type", input.contentType]);

  headers.sort(([a], [b]) => a.localeCompare(b));
  const canonicalHeaders = headers.map(([name, value]) => `${name}:${value.trim()}\n`).join("");
  const signedHeaders = headers.map(([name]) => name).join(";");
  const query = canonicalQuery(input.queryEntries);

  const canonicalRequest = [
    input.method.toUpperCase(),
    parts.canonicalUri,
    query,
    canonicalHeaders,
    signedHeaders,
    input.payloadHash,
  ].join("\n");

  const scope = `${stamp}/${input.config.region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signature = createHmac(
    "sha256",
    signingKey(input.config.secretAccessKey, stamp, input.config.region),
  )
    .update(stringToSign)
    .digest("hex");

  const url = `${parts.origin}${parts.canonicalUri}${query ? `?${query}` : ""}`;

  return {
    url,
    amzDate,
    payloadHash: input.payloadHash,
    authorization: `AWS4-HMAC-SHA256 Credential=${input.config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

async function signedXmlRequest(input: {
  method: "POST";
  key: string;
  queryEntries: Array<[string, string]>;
  body?: string;
}) {
  const config = getS3CompatibleStorageConfig();
  const body = input.body || "";
  const payloadHash = sha256Hex(body);
  const contentType = body ? "application/xml" : undefined;
  const signed = authorizationSignature({
    config,
    method: input.method,
    key: input.key,
    queryEntries: input.queryEntries,
    payloadHash,
    contentType,
  });

  const headers: Record<string, string> = {
    Authorization: signed.authorization,
    "x-amz-date": signed.amzDate,
    "x-amz-content-sha256": signed.payloadHash,
  };
  if (contentType) headers["content-type"] = contentType;

  const response = await fetch(signed.url, {
    method: input.method,
    headers,
    body: body || undefined,
    cache: "no-store",
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`OBJECT_STORAGE_HTTP_${response.status}:${text.slice(0, 300)}`);
  }

  return { response, text };
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function safeObjectFileName(value: string) {
  const normalized = value
    .normalize("NFKC")
    .replace(/[\\/\0\r\n]+/g, "-")
    .replace(/[^\p{L}\p{N}._()\- ]+/gu, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(-180);

  return normalized || "water-map.bin";
}

export function newPrivateWaterObjectKey(fileName: string, mapId?: string) {
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const mapPart = (mapId || "UNASSIGNED").toUpperCase().replace(/[^A-Z0-9_-]/g, "_");

  return `water/private/raw/${yyyy}/${mm}/${dd}/${mapPart}/${randomUUID()}/${safeObjectFileName(fileName)}`;
}

export async function createMultipartUpload(key: string) {
  const { text } = await signedXmlRequest({
    method: "POST",
    key,
    queryEntries: [["uploads", ""]],
  });

  const match = text.match(/<UploadId>([^<]+)<\/UploadId>/);
  if (!match?.[1]) throw new Error("OBJECT_STORAGE_UPLOAD_ID_MISSING");

  return { uploadId: match[1] };
}

export function presignUploadPart(input: {
  key: string;
  uploadId: string;
  partNumber: number;
  expiresSeconds?: number;
}) {
  const config = getS3CompatibleStorageConfig();
  const amzDate = amzTimestamp();
  const stamp = dateStamp(amzDate);
  const expires = Math.max(60, Math.min(input.expiresSeconds || 900, 3600));
  const parts = objectUrlParts(config, input.key);
  const scope = `${stamp}/${config.region}/s3/aws4_request`;

  const entries: Array<[string, string]> = [
    ["partNumber", String(input.partNumber)],
    ["uploadId", input.uploadId],
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${config.accessKeyId}/${scope}`],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(expires)],
    ["X-Amz-SignedHeaders", "host"],
  ];

  const queryWithoutSignature = canonicalQuery(entries);
  const canonicalRequest = [
    "PUT",
    parts.canonicalUri,
    queryWithoutSignature,
    `host:${parts.host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signature = createHmac(
    "sha256",
    signingKey(config.secretAccessKey, stamp, config.region),
  )
    .update(stringToSign)
    .digest("hex");

  return {
    url: `${parts.origin}${parts.canonicalUri}?${queryWithoutSignature}&X-Amz-Signature=${signature}`,
    expiresSeconds: expires,
  };
}

export async function completeMultipartUpload(input: {
  key: string;
  uploadId: string;
  parts: Array<{ partNumber: number; etag: string }>;
}) {
  const sorted = [...input.parts].sort((a, b) => a.partNumber - b.partNumber);
  const xml =
    "<CompleteMultipartUpload>" +
    sorted
      .map(
        (part) =>
          `<Part><PartNumber>${part.partNumber}</PartNumber><ETag>${xmlEscape(part.etag)}</ETag></Part>`,
      )
      .join("") +
    "</CompleteMultipartUpload>";

  const { text } = await signedXmlRequest({
    method: "POST",
    key: input.key,
    queryEntries: [["uploadId", input.uploadId]],
    body: xml,
  });

  return { completed: true as const, responseXmlPresent: Boolean(text) };
}
