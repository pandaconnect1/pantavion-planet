// scripts/export-project-recovery-audit-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runProjectRecoveryAuditWave } from '../core/recovery/project-recovery-audit-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runProjectRecoveryAuditWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/project-recovery-audit-${stamp}.json`;
  const txtPath = `./exports/project-recovery-audit-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('PROJECT_RECOVERY_AUDIT_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
