// scripts/run-app-auth-role-session-integration-wave.ts

import { runAppAuthRoleSessionIntegrationWave } from '../core/app/app-auth-role-session-integration-wave';

async function main(): Promise<void> {
  const output = await runAppAuthRoleSessionIntegrationWave();
  console.log(output.rendered);
}

void main();
