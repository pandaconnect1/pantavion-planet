const fs = require('fs');
const Module = require('module');
const path = require('path');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const classifierPath = path.join(__dirname, 'semantic-v3.cjs');
const source = fs.readFileSync(classifierPath, 'utf8');
const librarySource =
  source.split('\nconst input = loadCanonicalInput();')[0] +
  '\nmodule.exports = { sourcePathAnchor, sourcePathAnchors, capabilityFromPath, anchoredCapabilityRank };';
const loaded = new Module(classifierPath);
loaded.filename = classifierPath;
loaded.paths = module.paths;
loaded._compile(librarySource, classifierPath);

const { sourcePathAnchor, sourcePathAnchors, capabilityFromPath, anchoredCapabilityRank } = loaded.exports;

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

const strictOwnershipCases = [
  ['app/api/professional/infrastructure/water/help/request/route.ts', 'Maps / World / Water', 'water', 'create'],
  ['app/api/translate/text/route.ts', 'Interpreter / Translation', 'translation', 'translate'],
  ['core/startup/pantavion-startup-engine.ts', 'Personal AI / PantaAI', 'orchestration', 'execute'],
  ['data/pantavion-source-inventory/inventory.json', 'Recovery / Provenance', 'evidence', 'observe'],
  ['app/listings/[listingid]/page.tsx', 'Marketplace / Work / Business', 'marketplace', 'read'],
  ['app/backend-claims/page.tsx', 'Kernel / Guardian / Runtime', 'guardian', 'observe'],
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
  'app/api/listings/route.ts',
  'app/dashboard/page.tsx',
  'app/readiness/page.tsx',
  'app/distribution/page.tsx',
  'app/api/professional/infrastructure/water/help/thread/route.ts',
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
