import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dir = path.join(root, 'docs/recovery/live/batches');
const pattern = /^lane-g-20260915-(\d{3})-(\d{3})-rehydrated\.json$/;
const files = fs.readdirSync(dir).filter((name) => pattern.test(name)).sort();

if (files.length !== 20) throw new Error(`lane_g_batch_count_mismatch:${files.length}`);

function findForbiddenKey(value, trail = []) {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findForbiddenKey(value[index], [...trail, String(index)]);
      if (found) return found;
    }
    return null;
  }
  if (!value || typeof value !== 'object') return null;
  for (const [key, child] of Object.entries(value)) {
    if (['creator', 'email', 'uid'].includes(key.toLowerCase())) {
      return [...trail, key].join('.');
    }
    const found = findForbiddenKey(child, [...trail, key]);
    if (found) return found;
  }
  return null;
}

const ids = new Set();
const ranges = [];
let records = 0;
for (const [index, file] of files.entries()) {
  const match = file.match(pattern);
  const expectedStart = 201 + index * 20;
  const expectedEnd = expectedStart + 19;
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (start !== expectedStart || end !== expectedEnd) {
    throw new Error(`lane_g_range_mismatch:${file}:${start}-${end}:${expectedStart}-${expectedEnd}`);
  }
  const payload = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  if (payload.lane !== 'G') throw new Error(`lane_g_marker_mismatch:${file}`);
  if (payload.projectId !== 'prj_BxhpnjvAs1seyfBU1UYFU8nDykwh') throw new Error(`lane_g_project_mismatch:${file}`);
  if (payload.recordCount !== 20 || !Array.isArray(payload.records) || payload.records.length !== 20) {
    throw new Error(`lane_g_record_count_mismatch:${file}`);
  }
  if (payload.secretValuesIncluded !== false) throw new Error(`lane_g_secret_flag_invalid:${file}`);
  const forbiddenKey = findForbiddenKey(payload);
  if (forbiddenKey) throw new Error(`lane_g_private_field_present:${file}:${forbiddenKey}`);

  for (const record of payload.records) {
    if (typeof record.deploymentId !== 'string' || !record.deploymentId.startsWith('dpl_')) {
      throw new Error(`lane_g_deployment_id_invalid:${file}`);
    }
    if (ids.has(record.deploymentId)) throw new Error(`lane_g_duplicate_deployment:${record.deploymentId}`);
    ids.add(record.deploymentId);
    if (!Number.isInteger(record.created)) throw new Error(`lane_g_created_invalid:${record.deploymentId}`);
    if (typeof record.state !== 'string' || !record.state) throw new Error(`lane_g_state_invalid:${record.deploymentId}`);
    if (typeof record.url !== 'string' || !record.url.includes('vercel.app')) throw new Error(`lane_g_url_invalid:${record.deploymentId}`);
    if (typeof record.gitRef !== 'string' || !record.gitRef) throw new Error(`lane_g_git_ref_invalid:${record.deploymentId}`);
    if (typeof record.gitSha !== 'string' || !/^[a-f0-9]{40}$/i.test(record.gitSha)) throw new Error(`lane_g_git_sha_invalid:${record.deploymentId}`);
    records += 1;
  }
  ranges.push([start, end]);
}

if (records !== 400) throw new Error(`lane_g_total_records_mismatch:${records}`);
if (ids.size !== 400) throw new Error(`lane_g_unique_ids_mismatch:${ids.size}`);

const report = {
  marker: 'pantavion_lane_g_rehydration_audit_v2',
  status: 'PASS',
  batchCount: files.length,
  recordCount: records,
  uniqueDeploymentIds: ids.size,
  firstRange: ranges[0],
  lastRange: ranges.at(-1),
  contiguousRange: '201-600',
  duplicateDeploymentIds: 0,
  privateFieldsFound: 0,
  secretValuesIncluded: false,
  deleteAllowed: false,
};
console.log(JSON.stringify(report, null, 2));
