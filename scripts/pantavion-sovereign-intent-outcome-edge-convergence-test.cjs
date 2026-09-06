const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pantavion-sovereign-edge-'));
const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');

try {
  execFileSync(process.execPath, [
    tsc,
    '--module', 'commonjs',
    '--moduleResolution', 'node',
    '--target', 'ES2022',
    '--rootDir', path.join(root, 'core', 'sovereign'),
    '--outDir', outDir,
    '--esModuleInterop', 'true',
    '--skipLibCheck', 'true',
    '--declaration', 'false',
    '--noEmit', 'false',
    path.join(root, 'core', 'sovereign', 'sovereign-capability-kernel.ts'),
    path.join(root, 'core', 'sovereign', 'intent-to-outcome-fabric.ts'),
  ], { cwd: root, stdio: 'pipe' });

  const { compileSovereignKernelDecision } = require(path.join(outDir, 'sovereign-capability-kernel.js'));
  const { compileOutcomePlan } = require(path.join(outDir, 'intent-to-outcome-fabric.js'));

  const intent = {
    id: 'intent_edge_convergence',
    userId: 'founder_test',
    text: 'Classify a preserved batch while disconnected.',
    desiredOutcome: 'Deterministic offline classification plan.',
    jurisdiction: 'CY',
    maxCost: 3,
  };
  const steps = [{
    id: 'classify',
    title: 'Classify preserved batch',
    kind: 'workflow',
    capability: 'classify',
    risk: 'low',
    reversible: true,
    requiresOwnerApproval: false,
    dependsOn: [],
  }];
  const outcomePolicy = {
    ownerApprovalRisks: ['high', 'critical'],
    requireApprovalForIrreversible: true,
    maximumAutomaticCost: 3,
  };
  const firewallPolicy = {
    allowedJurisdictions: ['CY', 'EU'],
    automaticCapabilities: ['classify'],
    maximumAutomaticCost: 3,
    ownerApprovalRisks: ['high', 'critical'],
    requireConsentForSensitiveData: true,
    productionMutationMode: 'owner_approval',
    publicExposureMode: 'owner_approval',
  };
  const firewallRequest = {
    intentId: intent.id,
    actorId: intent.userId,
    actorKind: 'founder',
    jurisdiction: intent.jurisdiction,
    capabilities: ['classify'],
    dataClasses: ['private'],
    estimatedCost: 1,
    risk: 'low',
    reversible: true,
    legalConsentRecorded: true,
    writesProduction: false,
    publishesToUsers: false,
    sendsExternalMessage: false,
    changesIdentityOrAccess: false,
  };

  const planA = compileOutcomePlan({ intent, steps, policy: outcomePolicy });
  const planB = compileOutcomePlan({ intent, steps, policy: outcomePolicy });
  assert(JSON.stringify(planA) === JSON.stringify(planB), 'Equivalent intent inputs must produce deterministic outcome plans.');
  assert(planA.steps.length === 1 && planA.steps[0].capability === 'classify', 'Outcome plan must preserve the bounded capability.');

  const ready = compileSovereignKernelDecision({
    intent,
    steps,
    estimatedCost: 1,
    outcomePolicy,
    firewallRequest,
    firewallPolicy,
  });
  assert(ready.disposition === 'ready_for_bounded_execution', 'Safe reversible work must remain executable at the bounded boundary.');
  assert(!ready.mayMerge && !ready.mayDeployProduction && !ready.mayPublishToUsers, 'Disconnected convergence must not grant release authority.');

  const networkRequired = compileSovereignKernelDecision({
    intent,
    steps,
    estimatedCost: 1,
    outcomePolicy,
    firewallRequest: { ...firewallRequest, sendsExternalMessage: true },
    firewallPolicy,
  });
  assert(networkRequired.disposition === 'awaiting_owner', 'External/network-required work must stop at owner review.');

  const overBudget = compileSovereignKernelDecision({
    intent,
    steps,
    estimatedCost: 4,
    outcomePolicy,
    firewallRequest: { ...firewallRequest, estimatedCost: 4 },
    firewallPolicy,
  });
  assert(overBudget.disposition !== 'ready_for_bounded_execution', 'Budget exhaustion must fail closed.');

  console.log('PANTAVION SOVEREIGN INTENT-OUTCOME EDGE CONVERGENCE TEST: PASSED');
  console.log('- equivalent intent inputs produce deterministic outcome plans');
  console.log('- safe offline work remains bounded and non-authorizing');
  console.log('- network-required and over-budget work fail closed');
} finally {
  fs.rmSync(outDir, { recursive: true, force: true });
}
