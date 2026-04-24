// scripts/export-app-route-wiring-snapshot.ts

import { mkdir, writeFile } from 'node:fs/promises';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    routes: [
      '/',
      '/memory',
      '/inspector',
      '/intelligence',
      '/security',
      '/commercial',
      '/governance',
    ],
    middlewareEnabled: true,
    accessModel: {
      public: ['/'],
      authenticated: ['/memory', '/inspector'],
      operator: ['/intelligence', '/security'],
      founder: ['/commercial', '/governance'],
    },
  };

  const jsonPath = `./exports/app-route-wiring-snapshot-${stamp}.json`;
  await writeFile(jsonPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log('APP_ROUTE_WIRING_SNAPSHOT_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
}

void main();
