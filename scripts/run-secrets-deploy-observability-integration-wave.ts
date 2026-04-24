// scripts/run-secrets-deploy-observability-integration-wave.ts

import { runSecretsDeployObservabilityIntegrationWave } from '../core/app/secrets-deploy-observability-integration-wave';

async function main(): Promise<void> {
  const output = await runSecretsDeployObservabilityIntegrationWave();
  console.log(output.rendered);
}

void main();
