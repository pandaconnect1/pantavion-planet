// scripts/export-final-closure-audit-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runFinalClosureAuditWave } from '../core/kernel/final-closure-audit-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runFinalClosureAuditWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/final-closure-audit-${stamp}.json`;
  const txtPath = `./exports/final-closure-audit-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('FINAL_CLOSURE_AUDIT_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
