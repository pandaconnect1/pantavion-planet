// scripts/export-secrets-deploy-observability-integration-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runSecretsDeployObservabilityIntegrationWave } from '../core/app/secrets-deploy-observability-integration-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runSecretsDeployObservabilityIntegrationWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/secrets-deploy-observability-integration-${stamp}.json`;
  const txtPath = `./exports/secrets-deploy-observability-integration-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('SECRETS_DEPLOY_OBSERVABILITY_INTEGRATION_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
