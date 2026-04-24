// scripts/run-security-enforcement-wave.ts

import { runSecurityEnforcementWave } from '../core/security/security-enforcement-wave';

async function main(): Promise<void> {
  const output = await runSecurityEnforcementWave();
  console.log(output.rendered);
}

void main();
