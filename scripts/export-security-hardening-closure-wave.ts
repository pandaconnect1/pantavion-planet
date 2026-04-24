// scripts/export-security-hardening-closure-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runSecurityHardeningClosureWave } from '../core/security/security-hardening-closure-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runSecurityHardeningClosureWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/security-hardening-closure-${stamp}.json`;
  const txtPath = `./exports/security-hardening-closure-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('SECURITY_HARDENING_CLOSURE_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
