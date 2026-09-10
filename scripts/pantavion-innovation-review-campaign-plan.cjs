const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const sourcePath = path.join(root, 'data', 'recovery', 'innovation-maturity-review-batches', 'review-batches.json');
const outDir = path.join(root, 'data', 'recovery', 'innovation-review-campaign-plan');
const waveBatchLimit = 10;
const expectedBatchCount = 381;
const expectedReviewCount = 38014;
const expectedBatchSetFingerprint = 'd0c8978a91c422668f167b396129ca72a7857cd411a2e24d002fcf9b683ccea3';
const priorities = [
  'P0_SOURCE_TRACE_MISSING_HOLD',
  'P1_OVERLAP_ADJUDICATION_REQUIRED',
  'P2_EXTERNAL_ONLY_ORIGIN_REVIEW',
  'P3_MATURITY_EVIDENCE_REVIEW',
];

function fail(message) {
  console.error('PANTAVION INNOVATION REVIEW CAMPAIGN PLAN: FAIL - ' + message);
  process.exit(1);
}
function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
function zeroPriorityCounts() {
  return Object.fromEntries(priorities.map(priority => [priority, 0]));
}
function batchSummary(batch) {
  const priorityCounts = zeroPriorityCounts();
  for (const item of batch.items || []) {
    if (!(item.reviewPriority in priorityCounts)) fail('unknown review priority: ' + item.reviewPriority);
    priorityCounts[item.reviewPriority] += 1;
  }
  return {
    batchId: batch.batchId,
    sequence: batch.sequence,
    batchFingerprint: batch.batchFingerprint,
    startOrdinal: batch.startOrdinal,
    endOrdinal: batch.endOrdinal,
    itemCount: batch.itemCount,
    priorityCounts,
  };
}
function batchLine(batch) {
  return [
    batch.batchId,
    batch.sequence,
    batch.batchFingerprint,
    batch.startOrdinal,
    batch.endOrdinal,
    batch.itemCount,
    ...priorities.map(priority => batch.priorityCounts[priority]),
  ].join(':');
}

if (!fs.existsSync(sourcePath)) fail('missing exact tested review-batch projection');
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
if (!Array.isArray(source.batches)) fail('source batches array missing');
if (source.manifest?.reviewBatchSetFingerprint !== expectedBatchSetFingerprint) {
  fail('exact tested review-batch fingerprint drifted');
}
if (source.batches.length !== expectedBatchCount) fail('exact tested batch count drifted');

const waves = [];
for (let offset = 0; offset < source.batches.length; offset += waveBatchLimit) {
  const batches = source.batches.slice(offset, offset + waveBatchLimit).map(batchSummary);
  const sequence = waves.length + 1;
  const priorityCounts = zeroPriorityCounts();
  for (const batch of batches) {
    for (const priority of priorities) priorityCounts[priority] += batch.priorityCounts[priority];
  }
  const itemCount = batches.reduce((sum, batch) => sum + batch.itemCount, 0);
  const waveId = 'innovation-review-wave-' + String(sequence).padStart(3, '0');
  const waveFingerprint = hash(batches.map(batchLine).join('\n'));
  waves.push({
    waveId,
    sequence,
    sourceBatchSetFingerprint: expectedBatchSetFingerprint,
    startBatchSequence: batches[0].sequence,
    endBatchSequence: batches[batches.length - 1].sequence,
    batchCount: batches.length,
    itemCount,
    priorityCounts,
    batches,
    waveFingerprint,
    reviewerAssigned: false,
    reviewStarted: false,
    reviewCompleted: false,
    ownerApproved: false,
    maturityClaimsAllowed: false,
    semanticMergeAllowed: false,
    executionAllowed: false,
    authorizationEffect: 'none',
  });
}

const totalItems = waves.reduce((sum, wave) => sum + wave.itemCount, 0);
if (totalItems !== expectedReviewCount) fail('exact tested review count drifted');
const campaignFingerprint = hash(
  waves.map(wave => wave.waveId + ':' + wave.waveFingerprint).join('\n')
);
const priorityTotals = zeroPriorityCounts();
for (const wave of waves) {
  for (const priority of priorities) priorityTotals[priority] += wave.priorityCounts[priority];
}
const manifest = {
  id: 'pantavion_innovation_review_campaign_plan_v1',
  lifecycleState: 'CODED',
  sourceReviewBatchSetId: source.manifest?.id || null,
  sourceReviewBatchSetFingerprint: expectedBatchSetFingerprint,
  waveBatchLimit,
  campaignFingerprint,
  method: 'Deterministic loss-preserving grouping of exact tested review batches into bounded review waves.',
  truthRule: 'A campaign wave is scheduling evidence only. It does not assign a reviewer, record a decision, establish maturity or authorize execution.',
  totals: {
    sourceBatches: source.batches.length,
    scheduledBatches: source.batches.length,
    sourceReviews: totalItems,
    scheduledReviews: totalItems,
    waveCount: waves.length,
    fullWaves: waves.filter(wave => wave.batchCount === waveBatchLimit).length,
    partialWaves: waves.filter(wave => wave.batchCount < waveBatchLimit).length,
    priorityTotals,
    reviewersAssigned: 0,
    reviewsStarted: 0,
    reviewsCompleted: 0,
    ownerApprovals: 0,
    maturityClaimsAllowed: 0,
    semanticMergesAllowed: 0,
    executionAuthorizations: 0,
    unsupportedNoveltyClaims: 0,
  },
  requiredNextStage: 'FOUNDER_OR_DELEGATED_HUMAN_CAMPAIGN_REVIEW',
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'review-campaign.json'), JSON.stringify({ manifest, waves }, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'review-waves.ndjson'), waves.map(wave => JSON.stringify(wave)).join('\n') + '\n');
console.log(JSON.stringify(manifest, null, 2));
