const fs = require('fs');
const path = require('path');

const required = [
  'services/runtime-types.ts',
  'services/kernel-governor/index.ts',
  'services/repo-guardian/index.ts',
  'services/build-guardian/index.ts',
  'services/approval-inbox/index.ts',
  'services/control-room-api/index.ts',
  'db/schema/pantavion-runtime.sql',
  '.github/workflows/pantavion-runtime-services.yml'
];

const missing = required.filter((file) => !fs.existsSync(path.resolve(process.cwd(), file)));

if (missing.length) {
  console.error('Pantavion runtime smoke failed. Missing files:');
  for (const file of missing) console.error(` - ${file}`);
  process.exit(1);
}

console.log('Pantavion runtime smoke passed.');