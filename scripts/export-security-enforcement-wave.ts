// scripts/export-security-enforcement-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runSecurityEnforcementWave } from '../core/security/security-enforcement-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runSecurityEnforcementWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/security-enforcement-${stamp}.json`;
  const txtPath = `./exports/security-enforcement-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('SECURITY_ENFORCEMENT_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
