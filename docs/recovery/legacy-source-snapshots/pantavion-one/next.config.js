const canonicalOrigin = "https://www.pantavion.com";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      {
        source: "/:path*",
        destination: `${canonicalOrigin}/:path*`,
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
