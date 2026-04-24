// scripts/export-app-auth-role-session-integration-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runAppAuthRoleSessionIntegrationWave } from '../core/app/app-auth-role-session-integration-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runAppAuthRoleSessionIntegrationWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/app-auth-role-session-integration-${stamp}.json`;
  const txtPath = `./exports/app-auth-role-session-integration-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('APP_AUTH_ROLE_SESSION_INTEGRATION_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
