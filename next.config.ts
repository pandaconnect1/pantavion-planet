import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/pantavion/intelligence/cron": [
      "./data/recovery/source-batch-index-v1.json",
      "./data/recovery/imported-pr248/canonical-ledger/corpus/batches/**/*.json",
    ],
  },
};

export default nextConfig;
