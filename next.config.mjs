/** @type {import('next').NextConfig} */

const canonicalOrigin = "https://pantavion.com";

const objectStorageProvider = (process.env.PANTAVION_OBJECT_STORAGE_PROVIDER || "").trim();
const objectStorageEndpointConfigured = Boolean((process.env.PANTAVION_OBJECT_STORAGE_ENDPOINT || "").trim());
const objectStorageBucketConfigured = Boolean((process.env.PANTAVION_OBJECT_STORAGE_BUCKET || "").trim());
const objectStorageCredentialsConfigured = Boolean(
  (process.env.PANTAVION_OBJECT_STORAGE_ACCESS_KEY_ID || "").trim() &&
  (process.env.PANTAVION_OBJECT_STORAGE_SECRET_ACCESS_KEY || "").trim(),
);

console.log(
  JSON.stringify({
    marker: "pantavion_object_storage_build_status_v1",
    providerConfigured: Boolean(objectStorageProvider),
    endpointConfigured: objectStorageEndpointConfigured,
    bucketConfigured: objectStorageBucketConfigured,
    credentialsConfigured: objectStorageCredentialsConfigured,
    configured:
      objectStorageEndpointConfigured &&
      objectStorageBucketConfigured &&
      objectStorageCredentialsConfigured,
  }),
);

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self'",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(self), geolocation=(self), payment=(), usb=(), bluetooth=()",
  },
];

const nextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.pantavion.com" }],
        destination: `${canonicalOrigin}/:path*`,
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "pantavion-planet.vercel.app" }],
        destination: `${canonicalOrigin}/:path*`,
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
