const fs = require('fs');
const Module = require('module');
const path = require('path');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const classifierPath = [
  path.join(__dirname, 'pantavion-canonical-semantic-classification-v3.cjs'),
  path.join(__dirname, 'canonical-v3.cjs'),
  path.join(__dirname, 'semantic-v3.cjs'),
].find((candidate) => fs.existsSync(candidate));
assert(classifierPath, 'Canonical semantic classifier is missing.');
const source = fs.readFileSync(classifierPath, 'utf8');
const librarySource =
  source.split('\nconst input = loadCanonicalInput();')[0] +
  '\nmodule.exports = { sourcePathAnchor, sourcePathAnchors, capabilityFromPath, capabilityFromProvenance, anchoredCapabilityRank };';
const loaded = new Module(classifierPath);
loaded.filename = classifierPath;
loaded.paths = module.paths;
loaded._compile(librarySource, classifierPath);

const {
  sourcePathAnchor,
  sourcePathAnchors,
  capabilityFromPath,
  capabilityFromProvenance,
  anchoredCapabilityRank,
} = loaded.exports;

const sessionPath = 'core/app/app-session-registry.ts';
const sessionAnchor = sourcePathAnchor(sessionPath);
assert(sessionAnchor?.strict === true, 'Session registry must use a strict source anchor.');
assert(
  capabilityFromPath(sessionPath, sessionAnchor) === 'configure',
  'Strict session registry must not conflict between session/protect and registry/configure.',
);
const sessionRanks = anchoredCapabilityRank('session registry', sessionAnchor, sessionPath);
assert(
  sessionRanks[0]?.name === 'configure' && sessionRanks[0]?.score >= 100,
  'Strict capability must dominate generic filename keywords.',
);

const exportGuardPath = 'core/app/tenant-export-access-guard.ts';
const exportGuardAnchor = sourcePathAnchor(exportGuardPath);
assert(exportGuardAnchor?.strict === true, 'Tenant export guard must use a strict source anchor.');
assert(
  capabilityFromPath(exportGuardPath, exportGuardAnchor) === 'protect',
  'Strict export guard must not conflict between export/synchronize and guard/protect.',
);

const broadWaterPath = 'docs/requirements/pantavion-professional-infrastructure-water.md';
const broadWaterAnchor = sourcePathAnchor(broadWaterPath);
assert(broadWaterAnchor && !broadWaterAnchor.strict, 'Generic Water master requirement must remain non-strict.');
assert(
  capabilityFromPath(broadWaterPath, broadWaterAnchor) === null,
  'Generic Water master requirement must remain HOLD instead of inheriting a false capability.',
);

const lockedWaterMaster = 'docs/requirements/pantavion-professional-infrastructure-water-master-locked.md';
const sourceLineCases = [
  [56, 'read'],
  [150, 'protect'],
  [276, 'synchronize'],
  [824, 'configure'],
  [887, 'observe'],
  [1587, 'create'],
  [1699, 'execute'],
  [2036, 'update'],
  [2128, 'read'],
  [2657, 'protect'],
  [3026, 'observe'],
];
for (const [sourceLine, capability] of sourceLineCases) {
  assert(
    capabilityFromProvenance({ provenance:{ sourceFile:lockedWaterMaster, sourceLine } }) === capability,
    `Locked Water master line ${sourceLine} must resolve only to ${capability}.`,
  );
}
for (const sourceLine of [1397,1413]) {
  assert(
    capabilityFromProvenance({ provenance:{ sourceFile:lockedWaterMaster, sourceLine } }) === null,
    `Broad Water master line ${sourceLine} must remain capability-unresolved.`,
  );
}
assert(
  capabilityFromProvenance({ provenance:{ sourceFile:lockedWaterMaster, sourceLine:56.5 } }) === null,
  'Non-integral source lines must fail closed.',
);

const exactLineOwnershipCases = [
  ['app/api/listings/route.ts', 35, 'read'],
  ['app/api/listings/route.ts', 88, 'create'],
  ['app/api/professional/infrastructure/water/help/thread/route.ts', 191, 'read'],
  ['app/api/professional/infrastructure/water/help/thread/route.ts', 232, 'create'],
  ['docs/requirements/pantavion-water-full-master-strategy.md', 78, 'configure'],
  ['docs/requirements/pantavion-water-full-master-strategy.md', 119, 'protect'],
  ['docs/requirements/pantavion-water-serving-architecture-decision.md', 60, 'configure'],
  ['docs/requirements/pantavion-water-serving-architecture-decision.md', 126, 'protect'],
];
for (const [sourceFile, sourceLine, capability] of exactLineOwnershipCases) {
  assert(capabilityFromProvenance({ provenance:{ sourceFile, sourceLine } }) === capability, `${sourceFile}:${sourceLine} must resolve only to ${capability}.`);
}
for (const [sourceFile, sourceLine] of [
  ['app/api/listings/route.ts', 57],
  ['app/api/professional/infrastructure/water/help/thread/route.ts', 209],
  ['docs/requirements/pantavion-water-full-master-strategy.md', 140],
  ['docs/requirements/pantavion-water-serving-architecture-decision.md', 181],
]) {
  assert(capabilityFromProvenance({ provenance:{ sourceFile, sourceLine } }) === null, `${sourceFile}:${sourceLine} must remain capability-unresolved.`);
}

const strictOwnershipCases = [
  ['app/api/professional/infrastructure/water/help/request/route.ts', 'Maps / World / Water', 'water', 'create'],
  ['app/api/listings/route.ts', 'Marketplace / Work / Business', 'marketplace', null],
  ['app/api/translate/text/route.ts', 'Interpreter / Translation', 'translation', 'translate'],
  ['core/startup/pantavion-startup-engine.ts', 'Personal AI / PantaAI', 'orchestration', 'execute'],
  ['data/pantavion-source-inventory/inventory.json', 'Recovery / Provenance', 'evidence', 'observe'],
  ['app/listings/[listingid]/page.tsx', 'Marketplace / Work / Business', 'marketplace', 'read'],
  ['app/backend-claims/page.tsx', 'Kernel / Guardian / Runtime', 'guardian', 'observe'],
  ['app/feedback/page.tsx', 'Experience / Navigation', 'shell', 'present'],
  ['scripts/pantavion-knowledge-photo-marriage.cjs', 'Recovery / Provenance', 'recovery', 'recover'],
  ['core/intelligence/pantaai-engine.ts', 'Personal AI / PantaAI', 'orchestration', 'execute'],
  ['core/pantavion/sovereignty-ledger.ts', 'Kernel / Guardian / Runtime', 'providers', 'observe'],
  ['app/api/owner/safety/cases/route.ts', 'Safety / Trust / Minors', 'moderation', 'read'],
  ['app/social/communities/actions.ts', 'Social / Pulse / Communities', 'communities', 'create'],
  ['app/professional/infrastructure/water/legacy-secret-cleanup.tsx', 'Maps / World / Water', 'water', 'protect'],
  ['app/api/pantavion/intelligence/health/route.ts', 'Personal AI / PantaAI', 'orchestration', 'observe'],
  ['core/security/audit-append-only-writer.ts', 'Recovery / Provenance', 'evidence', 'create'],
  ['app/import-world/page.tsx', 'Identity / Auth / Consent', 'consent', 'present'],
];
for (const [sourcePath, module, subsystem, capability] of strictOwnershipCases) {
  const anchor = sourcePathAnchor(sourcePath);
  assert(anchor?.strict === true, `${sourcePath} must have strict ownership.`);
  assert(anchor.module === module, `${sourcePath} must belong to ${module}.`);
  assert(anchor.subsystem === subsystem, `${sourcePath} must belong to ${subsystem}.`);
  assert(capabilityFromPath(sourcePath, anchor) === capability, `${sourcePath} must resolve to ${capability}.`);
}

const ambiguousSources = [
  'docs/requirements/pantavion-professional-infrastructure-water-master-locked.md',
  'docs/requirements/pantavion-water-full-master-strategy.md',
  'docs/requirements/pantavion-water-serving-architecture-decision.md',
  'scripts/global-emergency-languages-patch.cjs',
  'core/runtime/voice-multilingual-policy.ts',
  'core/public/pantavion-public-surfaces.ts',
  'app/dashboard/page.tsx',
  'app/readiness/page.tsx',
  'app/distribution/page.tsx',
  'app/api/professional/infrastructure/water/help/thread/route.ts',
  'core/app/vercel-product-connection-public-surface-wave.ts',
  'app/sos-interpreter/page.tsx',
  'core/public/pantavion-public-surfaces.ts',
  'core/communication/pantavion-unified-communication-contract.ts',
  'docs/requirements/pantavion-pantaai-water-sentinel.md',
];
for (const sourcePath of ambiguousSources) {
  const anchor = sourcePathAnchor(sourcePath);
  assert(!anchor?.strict, `${sourcePath} must not acquire strict ownership.`);
  assert(capabilityFromPath(sourcePath, anchor) === null, `${sourcePath} must remain capability-unresolved.`);
}

const exactSources = [...strictOwnershipCases.map(([sourcePath]) => sourcePath), ...ambiguousSources];
for (const sourcePath of exactSources) {
  const strictMatches = sourcePathAnchors.filter(
    (anchor) => anchor.strict && anchor.patterns.some((pattern) => pattern.test(sourcePath)),
  );
  assert(strictMatches.length <= 1, `${sourcePath} has conflicting strict anchors.`);
}

console.log('PANTAVION STRICT ANCHOR CONTRACT TEST: PASSED');
console.log('- strict exact paths own their declared capability');
console.log('- multi-capability sources remain unresolved');
console.log('- exact anchors have no strict ownership collisions');
