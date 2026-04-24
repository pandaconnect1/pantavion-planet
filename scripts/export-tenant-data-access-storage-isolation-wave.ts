// scripts/export-tenant-data-access-storage-isolation-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runTenantDataAccessStorageIsolationWave } from '../core/app/tenant-data-access-storage-isolation-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runTenantDataAccessStorageIsolationWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/tenant-data-access-storage-isolation-${stamp}.json`;
  const txtPath = `./exports/tenant-data-access-storage-isolation-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('TENANT_DATA_ACCESS_STORAGE_ISOLATION_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
