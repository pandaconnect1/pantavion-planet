// scripts/export-vercel-product-connection-public-surface-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runVercelProductConnectionPublicSurfaceWave } from '../core/app/vercel-product-connection-public-surface-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runVercelProductConnectionPublicSurfaceWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/vercel-product-connection-public-surface-${stamp}.json`;
  const txtPath = `./exports/vercel-product-connection-public-surface-${stamp}.txt`;
  const htmlPath = `./exports/vercel-product-connection-public-surface-${stamp}.html`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');
  await writeFile(htmlPath, output.html, 'utf8');

  console.log('VERCEL_PRODUCT_CONNECTION_PUBLIC_SURFACE_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
  console.log(`htmlPath=${htmlPath}`);
}

void main();
