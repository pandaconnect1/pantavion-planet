const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectThrows(operation, message) {
  let threw = false;
  try {
    operation();
  } catch {
    threw = true;
  }
  assert(threw, message);
}

const root = process.cwd();
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pantavion-sovereign-kernel-'));
const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');

try {
  execFileSync(
    process.execPath,
    [
      tsc,
      '--module',
      'commonjs',
      '--moduleResolution',
      'node',
      '--target',
      'ES2022',
      '--rootDir',
      path.join(root, 'core', 'sovereign'),
      '--outDir',
      outDir,
      '--esModuleInterop',
      'true',
      '--skipLibCheck',
      'true',
      '--declaration',
      'false',
      '--noEmit',
      'false',
      path.join(root, 'core', 'sovereign', 'sovereign-capability-kernel.ts'),
    ],
    { cwd: root, stdio: 'pipe' },
  );

  const { compileSovereignKernelDecision } = require(path.join(outDir, 'sovereign-capability-kernel.js'));
  const intent = {
    id: 'intent_kernel_test',
    userId: 'founder_test',
    text: 'Classify the preserved corpus.',
    desiredOutcome: 'Evidence-backed canonical routing.',
    jurisdiction: 'CY',
    maxCost: 5,
  };
  const steps = [
    {
      id: 'classify',
      title: 'Classify',
      kind: 'workflow',
      capability: 'classify',
      risk: 'low',
      reversible: true,
      requiresOwnerApproval: false,
      dependsOn: [],
    },
  ];
  const outcomePolicy = {
    ownerApprovalRisks: ['high', 'critical'],
    requireApprovalForIrreversible: true,
    maximumAutomaticCost: 5,
  };
  const firewallPolicy = {
    allowedJurisdictions: ['CY', 'EU'],
    automaticCapabilities: ['classify'],
    maximumAutomaticCost: 5,
    ownerApprovalRisks: ['high', 'critical'],
    requireConsentForSensitiveData: true,
    productionMutationMode: 'owner_approval',
    publicExposureMode: 'owner_approval',
  };
  const firewallRequest = {
    intentId: intent.id,
    actorId: 'founder_test',
    actorKind: 'founder',
    jurisdiction: 'CY',
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

  const ready = compileSovereignKernelDecision({
    intent,
    steps,
    estimatedCost: 1,
    outcomePolicy,
    firewallRequest,
    firewallPolicy,
  });
  assert(ready.disposition === 'ready_for_bounded_execution', 'Safe reversible intent must reach bounded execution.');
  assert(!ready.mayMerge && !ready.mayDeployProduction && !ready.mayPublishToUsers, 'Kernel must never grant protected release authority.');

  const production = compileSovereignKernelDecision({
    intent,
    steps,
    estimatedCost: 1,
    outcomePolicy,
    firewallRequest: { ...firewallRequest, writesProduction: true },
    firewallPolicy,
  });
  assert(production.disposition === 'awaiting_owner', 'Production mutation must stop at the owner boundary.');

  const denied = compileSovereignKernelDecision({
    intent,
    steps,
    estimatedCost: 1,
    outcomePolicy,
    firewallRequest: { ...firewallRequest, actorId: '' },
    firewallPolicy,
  });
  assert(denied.disposition === 'denied', 'Missing actor identity must fail closed through the integrated kernel.');

  expectThrows(
    () =>
      compileSovereignKernelDecision({
        intent,
        steps,
        estimatedCost: 1,
        outcomePolicy,
        firewallRequest: { ...firewallRequest, intentId: 'different_intent' },
        firewallPolicy,
      }),
    'Mismatched fabric/firewall intent identities must be rejected.',
  );

  console.log('PANTAVION SOVEREIGN KERNEL INTEGRATION TEST: PASSED');
  console.log('- safe intent reaches bounded execution without release authority');
  console.log('- production mutation waits for explicit founder approval');
  console.log('- missing or mismatched identity fails closed');
} finally {
  fs.rmSync(outDir, { recursive: true, force: true });
}
