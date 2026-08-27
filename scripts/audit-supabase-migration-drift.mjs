import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';

const index = JSON.parse(await readFile('supabase/production-migration-index.json', 'utf8'));
const productionByVersion = new Map(index.migrations.map((m) => [m.version, m]));
const files = (await readdir('supabase/migrations')).filter((f) => /^\d{14}_.+\.sql$/.test(f)).sort();
const byVersion = new Map(files.map((f) => [f.slice(0, 14), f]));
const missingProduction = index.migrations.filter((m) => !byVersion.has(m.version));

if (missingProduction.length) {
  console.error('Production migration versions missing from repository:');
  for (const m of missingProduction) console.error(`- ${m.version}_${m.name}.sql`);
  process.exit(1);
}

function normalize(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n\r]*/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(sql) {
  return new Set(normalize(sql).match(/[a-z_][a-z0-9_]*|\d+(?:\.\d+)?|<>|<=|>=|::|:=|[-+*/=(),.;]/g) ?? []);
}

function jaccard(a, b) {
  let common = 0;
  for (const value of a) if (b.has(value)) common++;
  const union = a.size + b.size - common;
  return union === 0 ? 1 : common / union;
}

const productionDocs = [];
for (const migration of index.migrations) {
  const file = byVersion.get(migration.version);
  const text = await readFile(`supabase/migrations/${file}`, 'utf8');
  productionDocs.push({ migration, file, text, normalized: normalize(text), tokens: tokens(text) });
}

const localOnly = [];
for (const file of files) {
  const version = file.slice(0, 14);
  if (productionByVersion.has(version)) continue;
  const text = await readFile(`supabase/migrations/${file}`, 'utf8');
  const normalized = normalize(text);
  const sourceTokens = tokens(text);
  let exact = null;
  let best = null;
  for (const target of productionDocs) {
    if (normalized === target.normalized) exact = target;
    const score = jaccard(sourceTokens, target.tokens);
    if (!best || score > best.score) best = { score, target };
  }
  localOnly.push({
    file,
    md5: createHash('md5').update(text, 'utf8').digest('hex'),
    chars: text.length,
    normalizedEquivalent: exact ? `${exact.migration.version}_${exact.migration.name}.sql` : null,
    bestProductionMatch: best ? `${best.target.migration.version}_${best.target.migration.name}.sql` : null,
    similarity: best ? Number(best.score.toFixed(4)) : null
  });
}

console.log(JSON.stringify({ productionCount: index.migrations.length, repositoryMigrationCount: files.length, localOnlyCount: localOnly.length, localOnly }, null, 2));

if (files.length !== index.migrations.length || localOnly.length !== 0) {
  console.error(`Migration history drift remains: repository=${files.length}, production=${index.migrations.length}, localOnly=${localOnly.length}`);
  process.exit(1);
}
