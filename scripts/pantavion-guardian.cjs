const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'types/pantavion.ts',
  'core/canonical/canonical-registry.ts',
  'core/registry/capability-registry.ts',
  'core/security/security-policy.ts',
  'core/admin/admin-alerts.ts',
  'core/kernel/kernel.ts',
  'core/identity/identity-model.ts',
  'core/identity/delegation-model.ts',
  'core/protocol/protocol-types.ts',
  'core/protocol/protocol-gateway.ts',
  'core/runtime/durable-execution.ts',
  'core/runtime/workspace-runtime.ts',
  'core/runtime/voice-runtime.ts',
  'core/runtime/resilience-runtime.ts',
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.resolve(process.cwd(), file)));

if (missing.length) {
  console.error('Pantavion guardian check failed. Missing files:');
  for (const file of missing) console.error(` - ${file}`);
  process.exit(1);
}

console.log('Pantavion guardian check passed.');