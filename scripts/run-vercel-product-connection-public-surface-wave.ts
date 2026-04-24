// scripts/run-vercel-product-connection-public-surface-wave.ts

import { runVercelProductConnectionPublicSurfaceWave } from '../core/app/vercel-product-connection-public-surface-wave';

async function main(): Promise<void> {
  const output = await runVercelProductConnectionPublicSurfaceWave();
  console.log(output.rendered);
}

void main();
