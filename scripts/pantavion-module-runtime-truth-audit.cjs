#!/usr/bin/env node
"use strict";
// Read-only audit: do not claim a route is live merely because a page exists.
// Usage: node scripts/pantavion-module-runtime-truth-audit.cjs
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const registry = fs.readFileSync(path.join(root, "core/pantavion/real-backend-claims-registry.ts"), "utf8");
const re = /\{\s*module:\s*"([^"]+)",\s*route:\s*"([^"]+)",\s*status:\s*"([^"]+)"/g;
const rows = [];
for (const match of registry.matchAll(re)) {
  const [, module, route, status] = match;
  const rel = route === "/" ? "app/page.tsx" : "app" + route + "/page.tsx";
  const present = fs.existsSync(path.join(root, rel));
  const liveEvidence = status === "production_operational" ? "UNVERIFIED: requires authenticated production E2E and deployment revision" : "NOT_CLAIMED";
  rows.push({ module, route, declaredStatus: status, pageExists: present, liveEvidence });
}
if (!rows.length) { console.error("FAIL: no registry entries parsed"); process.exit(2); }
console.log(JSON.stringify({schema:"pantavion_module_truth_audit_v1", scope:"registry entries only; not all ecosystem modules", audited:rows.length, rows},null,2));
const failures=rows.filter(r=>!r.pageExists || r.declaredStatus==="production_operational");
if(failures.length) {
  console.error("BLOCKED: missing routes or unsupported production claims:", failures.map(r=>r.module).join(", "));
  process.exitCode=1;
}
