import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig, globalIgnores } from "eslint/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseDirectory = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
  baseDirectory,
  resolvePluginsRelativeTo: baseDirectory,
});

// These are explicit legacy-debt baselines, not broad rule suppressions. The
// warning ceiling in `npm run lint` prevents new warnings from being added.
const legacyAnyPaths = [
  "app/api/pantavion/detect-language/route.ts",
  "app/api/pantavion/speech-to-text/route.ts",
  "app/api/professional/infrastructure/water/access/admin/**/*.ts",
  "app/evolution/page.tsx",
  "app/professional/infrastructure/water/components/water-derived-map-client.tsx",
  "app/professional/infrastructure/water/components/water-map-b-authentic-client.tsx",
  "app/professional/infrastructure/water/live/controlled-water-segment-client.tsx",
  "app/professional/infrastructure/water/readiness/water-multimodal-language-console.tsx",
  "app/social/communities/page.tsx",
  "app/social/map/social-map-client.tsx",
  "app/social/notifications/page.tsx",
  "core/pantavion-kernel-executor.ts",
  "core/pantavion-kernel-ledger.ts",
  "core/translation/pantavion-speech-accessibility.ts",
];

const legacyHtmlLinkPaths = [
  "app/acceptable-use/page.tsx",
  "app/ads/page.tsx",
  "app/adult-connect/page.tsx",
  "app/build-services/page.tsx",
  "app/connect/page.tsx",
  "app/download/page.tsx",
  "app/founding-access/page.tsx",
  "app/import-world/page.tsx",
  "app/intelligence/page.tsx",
  "app/market/page.tsx",
  "app/minors/page.tsx",
  "app/newspaper/page.tsx",
  "app/radio/page.tsx",
  "app/refund-policy/page.tsx",
  "app/services/page.tsx",
  "app/studio/page.tsx",
  "app/terms/page.tsx",
  "app/work/page.tsx",
];

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: legacyAnyPaths,
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: legacyHtmlLinkPaths,
    rules: {
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".pantavion-backup/**",
    "recovery/**",
  ]),
]);

export default eslintConfig;
