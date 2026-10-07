import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const worker = fs.readFileSync(new URL('./pantavion-water-dwg-derived-worker.mjs', import.meta.url), 'utf8');
const generator = fs.readFileSync(new URL('./pantavion-water-map-b-generate-derived.mjs', import.meta.url), 'utf8');
const source = { sourceKey: 'canonical-2026-andreaspap', mapId: 'B', sha256: 'a'.repeat(64), byteSize: 12, storagePath: 'raw/b.dwg' };
const valid = { marker: 'pantavion_water_canonical_object_verification_v1', sourceKey: source.sourceKey, sha256: source.sha256, sizeBytes: source.byteSize, header: 'AC1032' };
function markerReader(download) {
  const context = vm.createContext({ BUCKET: 'personal-media', admin: { storage: { from: () => ({ download }) } } });
  vm.runInContext(worker.slice(worker.indexOf('async function verifiedTransferExists'), worker.indexOf('async function verifiedIngestExists')), context);
  return context.verifiedTransferExists;
}
const blob = (value) => ({data: {text: async () => JSON.stringify(value)}, error: null});
const missing = () => ({data: null, error: {statusCode: '404', message: 'Object not found'}});
test('accepts exact protected single-object verification', async () => {
  assert.equal(await markerReader(async () => blob(valid))(source), true);
});
test('accepts chunk verification when single-object marker is absent', async () => {
  const reads = [];
  assert.equal(await markerReader(async p => { reads.push(p); return reads.length === 1 ? missing() : blob({...valid, marker: 'pantavion_water_canonical_chunked_verification_v1'}); })(source), true);
  assert.match(reads[1], /chunked\/map-b\/a{64}\/verified.json$/);
});
test('absent markers remain waiting', async () => {
  assert.equal(await markerReader(async () => missing())(source), false);
});
test('rejects identity mismatches and malformed markers', async () => {
  for (const change of [{sha256:'b'.repeat(64)}, {sizeBytes:13}, {sourceKey:'other'}, {header:'AC1015'}, {marker:'other'}]) {
    await assert.rejects(markerReader(async () => blob({...valid,...change}))(source), /identity_mismatch/);
  }
  await assert.rejects(markerReader(async () => ({data: {text:async () => '{'}, error:null}))(source), /invalid_json/);
});
test('does not disguise authorization or server errors as missing files', async () => {
  for (const statusCode of ['403','500']) {
    await assert.rejects(markerReader(async () => ({data:null,error:{statusCode,message:'Forbidden'}}))(source), /read_failed/);
  }
});
async function publish(failTile) {
  const writes = [];
  const context = vm.createContext({
    process: {env: {PANTAVION_WATER_MAP_B_UPLOAD_DERIVED:'YES', SUPABASE_SECRET_KEY:'test'}},
    STORAGE:{bucket:'private',derivedPrefix:'derived/b'}, Buffer, path,
    fs:{readFileSync: () => Buffer.from('tile')},
    fail:(reason) => { throw new Error(reason); },
    createClient: () => ({storage:{from:() => ({upload:async p => { writes.push(p); return {error:failTile && p.includes('/tiles/') ? {message:'failed'} : null}; }})}}),
  });
  vm.runInContext(generator.slice(generator.indexOf('async function uploadDerived'), generator.indexOf('async function main')), context);
  try { await context.uploadDerived('/temporary', {ok:true}, ['one.json','two.json']); } catch (e) { return {writes,error:e.message}; }
  return {writes,error:null};
}
test('publishes manifest after every tile', async () => {
  const {writes,error} = await publish(false);
  assert.equal(error,null);
  assert.deepEqual(writes,['derived/b/tiles/one.json','derived/b/tiles/two.json','derived/b/manifest.json']);
});
test('tile failure never publishes a ready manifest', async () => {
  const {writes,error} = await publish(true);
  assert.equal(error,'map_b_derived_tile_upload_failed');
  assert.equal(writes.some(p => p.endsWith('/manifest.json')),false);
});
