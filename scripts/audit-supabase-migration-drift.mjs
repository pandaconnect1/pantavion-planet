import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';

const baselineIndex = JSON.parse(await readFile('supabase/production-migration-index.json', 'utf8'));
const addendumIndex = JSON.parse(await readFile('supabase/production-migration-index-addendum-20260830.json', 'utf8'));
if (baselineIndex.projectRef !== addendumIndex.projectRef) {
  throw new Error(`Production migration index project mismatch: baseline=${baselineIndex.projectRef} addendum=${addendumIndex.projectRef}`);
}
const migrations = [...baselineIndex.migrations, ...addendumIndex.migrations];
const versions = migrations.map((migration) => migration.version);
if (new Set(versions).size !== versions.length) {
  throw new Error('Duplicate production migration version across baseline/addendum index.');
}

const allowForwardMigrations = process.env.ALLOW_FORWARD_MIGRATIONS === '1';
const productionByVersion = new Map(migrations.map((m) => [m.version, m]));
const productionHead = migrations.map((m) => m.version).sort().at(-1) ?? '00000000000000';
const files = (await readdir('supabase/migrations')).filter((f) => /^\d{14}_.+\.sql$/.test(f)).sort();

const filesByVersion = new Map();
for (const file of files) {
  const version = file.slice(0, 14);
  const group = filesByVersion.get(version) ?? [];
  group.push(file);
  filesByVersion.set(version, group);
}

const duplicateVersions = [...filesByVersion.entries()].filter(([, group]) => group.length > 1);
if (duplicateVersions.length) {
  console.error('Duplicate repository migration versions are forbidden:');
  for (const [version, group] of duplicateVersions) console.error(`- ${version}: ${group.join(', ')}`);
  process.exit(1);
}

const byVersion = new Map([...filesByVersion.entries()].map(([version, group]) => [version, group[0]]));
const missingProduction = migrations.filter((m) => !byVersion.has(m.version));

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
for (const migration of migrations) {
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
    version,
    forwardOfProductionHead: version > productionHead,
    md5: createHash('md5').update(text, 'utf8').digest('hex'),
    chars: text.length,
    normalizedEquivalent: exact ? `${exact.migration.version}_${exact.migration.name}.sql` : null,
    bestProductionMatch: best ? `${best.target.migration.version}_${best.target.migration.name}.sql` : null,
    similarity: best ? Number(best.score.toFixed(4)) : null,
  });
}

const historicalDrift = localOnly.filter((item) => !item.forwardOfProductionHead);
const forwardPending = localOnly.filter((item) => item.forwardOfProductionHead);
const duplicateForwardSql = forwardPending.filter((item) => item.normalizedEquivalent !== null);

console.log(JSON.stringify({
  productionHead,
  productionCount: migrations.length,
  repositoryMigrationCount: files.length,
  historicalDriftCount: historicalDrift.length,
  forwardPendingCount: forwardPending.length,
  allowForwardMigrations,
  historicalDrift,
  forwardPending,
}, null, 2));

if (historicalDrift.length) {
  console.error(`Historical migration drift is forbidden: ${historicalDrift.length} local migration(s) are not newer than production head ${productionHead}.`);
  process.exit(1);
}

if (duplicateForwardSql.length) {
  console.error('Forward migrations must not reissue SQL that is already canonical production history:');
  for (const item of duplicateForwardSql) console.error(`- ${item.file} duplicates ${item.normalizedEquivalent}`);
  process.exit(1);
}

if (forwardPending.length && !allowForwardMigrations) {
  console.error(`Pending forward migrations are allowed only in PR validation. Found ${forwardPending.length} while production head is ${productionHead}.`);
  process.exit(1);
}

if (files.length !== migrations.length + forwardPending.length) {
  console.error(`Unexpected migration count: repository=${files.length}, production=${migrations.length}, forwardPending=${forwardPending.length}`);
  process.exit(1);
}
