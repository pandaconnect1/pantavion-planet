const fs = require('fs');
const path = require('path');

const required = [
  'core/kernel/kernel.ts',
  'core/kernel/kernel-bootstrap.ts',
  'core/identity/delegation-model.ts',
  'core/protocol/protocol-gateway.ts',
  'core/runtime/durable-execution.ts',
  'core/runtime/workspace-runtime.ts',
  'core/runtime/voice-runtime.ts',
  'core/runtime/resilience-runtime.ts',
  'scripts/pantavion-runtime-smoke.cjs'
];

const missing = required.filter((file) => !fs.existsSync(path.resolve(process.cwd(), file)));

if (missing.length) {
  console.error('Pantavion runtime smoke failed. Missing files:');
  for (const file of missing) console.error(` - ${file}`);
  process.exit(1);
}

console.log('Pantavion runtime smoke passed.');