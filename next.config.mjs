/** @type {import('next').NextConfig} */

const canonicalOrigin = "https://www.pantavion.com";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
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
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  reactStrictMode: true,

  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "pantavion.com" }],
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
