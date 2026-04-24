// scripts/export-visibility-inspector-surface.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runVisibilityInspectorSurface } from '../core/inspector/visibility-inspector-surface';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runVisibilityInspectorSurface();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/visibility-inspector-surface-${stamp}.json`;
  const txtPath = `./exports/visibility-inspector-surface-${stamp}.txt`;
  const htmlPath = `./exports/visibility-inspector-surface-${stamp}.html`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');
  await writeFile(htmlPath, output.html, 'utf8');

  console.log('VISIBILITY_INSPECTOR_SURFACE_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
  console.log(`htmlPath=${htmlPath}`);
}

void main();
