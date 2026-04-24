// scripts/run-tenant-data-access-storage-isolation-wave.ts

import { runTenantDataAccessStorageIsolationWave } from '../core/app/tenant-data-access-storage-isolation-wave';

async function main(): Promise<void> {
  const output = await runTenantDataAccessStorageIsolationWave();
  console.log(output.rendered);
}

void main();
