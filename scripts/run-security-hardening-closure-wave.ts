// scripts/run-security-hardening-closure-wave.ts

import { runSecurityHardeningClosureWave } from '../core/security/security-hardening-closure-wave';

async function main(): Promise<void> {
  const output = await runSecurityHardeningClosureWave();
  console.log(output.rendered);
}

void main();
