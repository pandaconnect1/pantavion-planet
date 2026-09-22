import assert from "node:assert/strict";
import fs from "node:fs";

const mod = await import("../core/runtime/pantavion-deployment-revision.ts");

const keys = [
  "RAILWAY_GIT_COMMIT_SHA",
  "RAILWAY_DEPLOYMENT_ID",
  "RAILWAY_GIT_BRANCH",
  "RAILWAY_ENVIRONMENT_NAME",
  "VERCEL_GIT_COMMIT_SHA",
  "VERCEL_URL",
  "VERCEL_GIT_COMMIT_REF",
  "VERCEL_ENV",
  "GITHUB_SHA",
  "GITHUB_REF_NAME",
];

const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

function clear() {
  for (const key of keys) delete process.env[key];
}

try {
  clear();
  process.env.RAILWAY_GIT_COMMIT_SHA = "railway-sha";
  process.env.RAILWAY_DEPLOYMENT_ID = "railway-deploy";
  process.env.RAILWAY_GIT_BRANCH = "main";
  process.env.RAILWAY_ENVIRONMENT_NAME = "production";
  let snapshot = mod.getPantavionDeploymentRevision();
  assert.equal(snapshot.provider, "railway");
  assert.equal(snapshot.revision, "railway-sha");
  assert.equal(snapshot.deploymentId, "railway-deploy");

  clear();
  process.env.VERCEL_GIT_COMMIT_SHA = "vercel-sha";
  process.env.VERCEL_URL = "legacy.example";
  snapshot = mod.getPantavionDeploymentRevision();
  assert.equal(snapshot.provider, "vercel");
  assert.equal(snapshot.revision, "vercel-sha");

  clear();
  process.env.GITHUB_SHA = "github-sha";
  snapshot = mod.getPantavionDeploymentRevision();
  assert.equal(snapshot.provider, "github");
  assert.equal(snapshot.revision, "github-sha");

  clear();
  snapshot = mod.getPantavionDeploymentRevision();
  assert.equal(snapshot.provider, "unknown");
  assert.equal(snapshot.revision, null);

  const guardian = fs.readFileSync("scripts/water-guardian-production-smoke.cjs", "utf8");
  assert(guardian.includes("/api/pantavion/runtime/revision"));
  assert(guardian.includes("PANTAVION_CANONICAL_APEX_URL"));
  assert(!guardian.includes("waitForVercelDeployment"));
  assert(!guardian.includes("deploymentIdFromTargetUrl"));
  assert(!guardian.includes("dpl_"));

  console.log(JSON.stringify({
    marker: "pantavion_provider_neutral_runtime_audit_v1",
    ok: true,
    priority: ["railway", "vercel", "github", "unknown"],
    guardianUsesRuntimeRevision: true,
    apexParityRequired: true,
    vercelDeploymentIdDependency: false,
  }, null, 2));
} finally {
  clear();
  for (const [key, value] of Object.entries(previous)) {
    if (value !== undefined) process.env[key] = value;
  }
}
