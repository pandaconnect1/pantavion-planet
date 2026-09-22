import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const evidenceRoot = path.join(root, "docs/recovery/vercel-evidence/20260922");
const outRoot = path.join(evidenceRoot, "phase2");
fs.mkdirSync(outRoot, { recursive: true });

const ignoredDirs = new Set(["phase2", "blob-rescue"]);
const canonicalDeploymentFiles = new Set([
  "pantavion-planet-deployments.json",
  "pantavion-planet-vmxx-deployments.json",
  "legacy-pantavion-deployments.json",
  "legacy-ai-and-empty-projects.json"
]);

const sourceFiles = fs.readdirSync(evidenceRoot, { withFileTypes: true })
  .filter(d =>
    d.isFile() &&
    d.name.endsWith(".json") &&
    (canonicalDeploymentFiles.has(d.name) || d.name.includes("-batch-"))
  )
  .map(d => path.join(evidenceRoot, d.name))
  .sort();

const seen = new Map();
let candidateOccurrences = 0;
const parseFailures = [];

function clean(v) {
  return typeof v === "string" ? v.trim() : "";
}

function projectFallback(projectName) {
  const v = clean(projectName).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  return `unknown:${v || "project"}`;
}

function collect(node, ctx, sourceFile) {
  if (Array.isArray(node)) {
    for (const item of node) collect(item, ctx, sourceFile);
    return;
  }
  if (!node || typeof node !== "object") return;

  const nextCtx = {
    projectId: clean(node.projectId) || ctx.projectId,
    project: clean(node.project) || clean(node.name) || ctx.project,
  };

  const depId = clean(node.deploymentId) || (clean(node.id).startsWith("dpl_") ? clean(node.id) : "");
  if (depId) {
    candidateOccurrences += 1;
    const projectName = clean(node.project) || clean(node.name) || nextCtx.project || "unknown-project";
    const projectId = nextCtx.projectId || projectFallback(projectName);
    const deploymentKey = `${projectId}:${depId}`;
    const meta = node.meta && typeof node.meta === "object" ? node.meta : {};
    const existing = seen.get(deploymentKey);

    const candidate = {
      deployment_key: deploymentKey,
      project_id: projectId,
      project_name: projectName,
      deployment_id: depId,
      created_ms: Number.isFinite(Number(node.created)) ? Number(node.created) : null,
      state: clean(node.state) || null,
      target: clean(node.target) || null,
      deployment_url: clean(node.url) || null,
      git_repo: clean(meta.githubRepo) || clean(node.gitRepo) || null,
      git_org: clean(meta.githubOrg) || clean(node.gitOrg) || null,
      git_ref: clean(meta.githubCommitRef) || clean(node.gitRef) || null,
      git_sha: clean(meta.githubCommitSha) || clean(node.gitSha) || null,
      git_message: clean(meta.githubCommitMessage) || clean(node.gitMessage) || null,
      is_rollback_candidate: Boolean(node.isRollbackCandidate),
      provenance_files: [path.relative(root, sourceFile).replaceAll("\\", "/")],
      inspector_url: clean(node.inspectorUrl) || null,
    };

    if (!existing) {
      seen.set(deploymentKey, candidate);
    } else {
      for (const [key, value] of Object.entries(candidate)) {
        if (key === "provenance_files") continue;
        if ((existing[key] === null || existing[key] === "" || existing[key] === false) && value !== null && value !== "") {
          existing[key] = value;
        }
      }
      for (const f of candidate.provenance_files) {
        if (!existing.provenance_files.includes(f)) existing.provenance_files.push(f);
      }
      existing.is_rollback_candidate = existing.is_rollback_candidate || candidate.is_rollback_candidate;
    }
  }

  for (const value of Object.values(node)) {
    if (value && typeof value === "object") collect(value, nextCtx, sourceFile);
  }
}

for (const file of sourceFiles) {
  try {
    collect(JSON.parse(fs.readFileSync(file, "utf8")), { projectId: "", project: "" }, file);
  } catch (error) {
    parseFailures.push({ file: path.relative(root, file), error: String(error?.message || error) });
  }
}

const rules = [
  { module:"Maps / World / Water", subsystem:"water", capability:"operate", confidence:0.98, tags:["water","maps"], re:/\b(water|dwg|geojson|gis|map[- ]?b|pipe|hydrant|utility)\b/i },
  { module:"Interpreter / Translation", subsystem:"translation", capability:"translate", confidence:0.97, tags:["translation","language"], re:/\b(translation|translate|interpreter|speech|stt|tts|language|subtitle|dialect)\b/i },
  { module:"Chat", subsystem:"messaging", capability:"synchronize", confidence:0.96, tags:["chat","messaging"], re:/\b(chat|message|messaging|conversation|receipt|inbox)\b/i },
  { module:"People", subsystem:"relationships", capability:"read", confidence:0.94, tags:["people","relationships"], re:/\b(people|profile|contact|relationship|friend|follow)\b/i },
  { module:"Social / Pulse / Communities", subsystem:"publishing", capability:"create", confidence:0.94, tags:["social","community"], re:/\b(social|pulse|community|feed|post|timeline)\b/i },
  { module:"SOS / Crisis", subsystem:"emergency", capability:"execute", confidence:0.97, tags:["sos","crisis"], re:/\b(sos|emergency|crisis|dispatch|panic|humanitarian)\b/i },
  { module:"Safety / Trust / Minors", subsystem:"trust", capability:"protect", confidence:0.96, tags:["safety","trust"], re:/\b(moderation|minor|guardian|trust|abuse|safety|risk gate)\b/i },
  { module:"Identity / Auth / Consent", subsystem:"authentication", capability:"protect", confidence:0.97, tags:["identity","auth"], re:/\b(auth|authentication|login|mfa|aal2|passkey|consent|session|same-origin|privileged)\b/i },
  { module:"Marketplace / Work / Business", subsystem:"business", capability:"operate", confidence:0.93, tags:["business","marketplace"], re:/\b(marketplace|listing|business|commerce|billing|stripe|ads center|advertis)\b/i },
  { module:"Learning / Knowledge", subsystem:"knowledge", capability:"read", confidence:0.92, tags:["learning","knowledge"], re:/\b(learning|lesson|curriculum|knowledge|research|pantalearn)\b/i },
  { module:"Music / Media / Creation", subsystem:"media", capability:"create", confidence:0.92, tags:["media","creation"], re:/\b(music|media|image|video|audio|studio|creator)\b/i },
  { module:"Kernel / Guardian / Runtime", subsystem:"orchestration", capability:"execute", confidence:0.96, tags:["kernel","runtime"], re:/\b(kernel|guardian|orchestrat|control plane|scheduler|durable execution|worker|runtime)\b/i },
  { module:"Recovery / Provenance", subsystem:"recovery", capability:"recover", confidence:0.98, tags:["recovery","provenance"], re:/\b(recovery|recover|restore|reconcile|canonical|semantic|provenance|excavat|donor|snapshot|migration history|production ledger)\b/i },
  { module:"Resilience / Offline / Infrastructure", subsystem:"infrastructure", capability:"operate", confidence:0.88, tags:["deployment","infrastructure"], re:/\b(vercel|deploy|deployment|build|ci\b|production|infrastructure|supabase|database|migration)\b/i },
];

function classify(r) {
  const text = [
    r.project_name, r.git_repo, r.git_ref, r.git_message, r.target, r.state
  ].filter(Boolean).join(" ");
  for (const rule of rules) {
    if (rule.re.test(text)) return { ...rule };
  }
  return {
    module:"Recovery / Provenance",
    subsystem:"deployment-evidence",
    capability:"observe",
    confidence:0.60,
    tags:["vercel","deployment-evidence"]
  };
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

const records = [...seen.values()].map(r => {
  const c = classify(r);
  const sourceKey = r.git_sha
    ? `git:${r.git_org || "unknown"}/${r.git_repo || "unknown"}:${r.git_sha}`
    : `deployment:${r.deployment_key}`;
  return {
    deployment_key:r.deployment_key,
    project_id:r.project_id,
    project_name:r.project_name,
    deployment_id:r.deployment_id,
    created_ms:r.created_ms,
    state:r.state,
    target:r.target,
    deployment_url:r.deployment_url,
    git_repo:r.git_repo,
    git_org:r.git_org,
    git_ref:r.git_ref,
    git_sha:r.git_sha,
    git_message:r.git_message,
    source_key:sourceKey,
    source_kind:r.git_sha ? "git_commit" : "deployment_only",
    primary_module:c.module,
    subsystem:c.subsystem,
    capability:c.capability,
    classification_confidence:c.confidence,
    classification_tags:c.tags,
    is_production:r.target === "production",
    is_rollback_candidate:r.is_rollback_candidate,
    provenance:{
      source:"vercel_recovery_20260922",
      sourceFiles:r.provenance_files.sort(),
      inspectorUrl:r.inspector_url,
      immutableDeploymentKey:r.deployment_key
    }
  };
}).sort((a,b) => (b.created_ms || 0) - (a.created_ms || 0) || a.deployment_key.localeCompare(b.deployment_key));

const sourceGroups = new Map();
for (const r of records) {
  if (!sourceGroups.has(r.source_key)) {
    sourceGroups.set(r.source_key, {
      sourceKey:r.source_key,
      sourceKind:r.source_kind,
      gitSha:r.git_sha,
      gitRepo:r.git_repo,
      gitOrg:r.git_org,
      primaryModule:r.primary_module,
      deploymentKeys:[],
      projects:new Set(),
      productionDeployments:0,
      states:{}
    });
  }
  const g = sourceGroups.get(r.source_key);
  g.deploymentKeys.push(r.deployment_key);
  g.projects.add(r.project_name || r.project_id);
  if (r.is_production) g.productionDeployments += 1;
  g.states[r.state || "UNKNOWN"] = (g.states[r.state || "UNKNOWN"] || 0) + 1;
}
const groups = [...sourceGroups.values()].map(g => ({
  ...g,
  projects:[...g.projects].sort(),
  mirroredAcrossProjects:g.projects.size > 1
})).sort((a,b) => b.deploymentKeys.length - a.deploymentKeys.length || a.sourceKey.localeCompare(b.sourceKey));

function countsBy(field) {
  const out = {};
  for (const r of records) {
    const k = r[field] ?? "UNKNOWN";
    out[k] = (out[k] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])));
}

const moduleRoutes = {};
for (const r of records) {
  const key = r.primary_module;
  if (!moduleRoutes[key]) moduleRoutes[key] = { deploymentCount:0, sourceKeys:new Set(), projects:new Set(), route:`module://${key.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}` };
  moduleRoutes[key].deploymentCount += 1;
  moduleRoutes[key].sourceKeys.add(r.source_key);
  moduleRoutes[key].projects.add(r.project_name || r.project_id);
}
const routing = Object.fromEntries(Object.entries(moduleRoutes).map(([k,v]) => [k,{
  deploymentCount:v.deploymentCount,
  uniqueSourceCount:v.sourceKeys.size,
  projects:[...v.projects].sort(),
  route:v.route
}]));

const manifest = {
  schema:"pantavion_vercel_phase2_v1",
  generatedAt:new Date().toISOString(),
  sourceRoot:"docs/recovery/vercel-evidence/20260922",
  sourceFilesRead:sourceFiles.map(f => path.relative(root,f).replaceAll("\\","/")),
  parseFailures,
  preservation:{
    candidateOccurrences,
    uniqueDeployments:records.length,
    duplicateOccurrencesMerged:candidateOccurrences-records.length,
    uniqueSources:groups.length,
    gitCommitSources:groups.filter(g=>g.sourceKind==="git_commit").length,
    deploymentOnlySources:groups.filter(g=>g.sourceKind==="deployment_only").length,
    mirroredSourceGroups:groups.filter(g=>g.mirroredAcrossProjects).length
  },
  productionDeployments:records.filter(r=>r.is_production).length,
  rollbackCandidates:records.filter(r=>r.is_rollback_candidate).length,
  projectCounts:countsBy("project_name"),
  moduleCounts:countsBy("primary_module"),
  stateCounts:countsBy("state"),
  routeCount:Object.keys(routing).length,
  rules:{
    deploymentIdentity:"projectId:deploymentId",
    sourceIdentity:"git org/repo + commit SHA when available; deployment identity fallback otherwise",
    deletePolicy:"ZERO_DELETE",
    classificationTruth:"Classification/routing is recovery organization, not implementation or VERIFIED_LIVE proof."
  },
  fingerprints:{
    orderedDeploymentKeys:sha256(records.map(r=>r.deployment_key).join("\n")),
    orderedSourceKeys:sha256(groups.map(g=>g.sourceKey).sort().join("\n"))
  }
};

fs.writeFileSync(path.join(outRoot,"vercel-deployment-canonical.ndjson"), records.map(r=>JSON.stringify(r)).join("\n")+"\n");
fs.writeFileSync(path.join(outRoot,"vercel-source-groups.json"), JSON.stringify(groups,null,2)+"\n");
fs.writeFileSync(path.join(outRoot,"vercel-routing-manifest.json"), JSON.stringify(routing,null,2)+"\n");
fs.writeFileSync(path.join(outRoot,"manifest.json"), JSON.stringify(manifest,null,2)+"\n");

console.log(JSON.stringify(manifest,null,2));
