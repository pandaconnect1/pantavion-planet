const fs = require('fs');
const path = require('path');

const VERSION = '1.5.5';
const BASE = `https://cdn.jsdelivr.net/npm/@mlightcad/cad-simple-viewer@${VERSION}/dist`;
const OUT_DIR = path.join(process.cwd(), 'public', 'cad-workers');
const FILES = [
  'dxf-parser-worker.js',
  'libredwg-parser-worker.js',
  'mtext-renderer-worker.js',
];

async function download(fileName) {
  const url = `${BASE}/${fileName}`;
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Failed to download ${fileName}: HTTP ${response.status}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000) {
    throw new Error(`Refusing suspiciously small CAD worker ${fileName}: ${bytes.length} bytes`);
  }
  fs.writeFileSync(path.join(OUT_DIR, fileName), bytes);
  console.log(`Prepared ${fileName} (${bytes.length} bytes)`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const fileName of FILES) {
    await download(fileName);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
