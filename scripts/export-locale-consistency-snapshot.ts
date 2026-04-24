// scripts/export-locale-consistency-snapshot.ts

import { mkdir, writeFile } from 'node:fs/promises';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    locales: ['el', 'en'],
    localeCookie: 'pantavion_lang',
    roleCookie: 'pantavion_role',
    fixedRoleLabels: {
      guest: 'Επισκέπτης / Guest',
      user: 'Χρήστης / User',
      operator: 'Χειριστής / Operator',
      founder: 'Ιδρυτής / Founder',
    },
    localizedRoutes: [
      '/',
      '/memory',
      '/inspector',
      '/intelligence',
      '/security',
      '/commercial',
      '/governance',
    ],
  };

  const jsonPath = `./exports/locale-consistency-snapshot-${stamp}.json`;
  await writeFile(jsonPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log('LOCALE_CONSISTENCY_SNAPSHOT_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
}

void main();
