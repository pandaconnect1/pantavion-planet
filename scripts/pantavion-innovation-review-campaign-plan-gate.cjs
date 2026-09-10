const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const sourcePath = path.join(root, 'data', 'recovery', 'innovation-maturity-review-batches', 'review-batches.json');
const dir = path.join(root, 'data', 'recovery', 'innovation-review-campaign-plan');
const manifestPath = path.join(dir, 'manifest.json');
const campaignPath = path.join(dir, 'review-campaign.json');
const ndjsonPath = path.join(dir, 'review-waves.ndjson');
const expectedBatchCount = 381;
const expectedReviewCount = 38014;
const expectedWaveBatchLimit = 10;
const expectedBatchSetFingerprint = 'd0c8978a91c422668f167b396129ca72a7857cd411a2e24d002fcf9b683ccea3';
const priorities = [
  'P0_SOURCE_TRACE_MISSING_HOLD',
  'P1_OVERLAP_ADJUDICATION_REQUIRED',
  'P2_EXTERNAL_ONLY_ORIGIN_REVIEW',
  'P3_MATURITY_EVIDENCE_REVIEW',
];

function fail(message) {
  console.error('PANTAVION INNOVATION REVIEW CAMPAIGN GATE: FAIL - ' + message);
  process.exit(1);
}
function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
function zeroPriorityCounts() {
  return Object.fromEntries(priorities.map(priority => [priority, 0]));
}
function expectedSummary(batch) {
  const priorityCounts = zeroPriorityCounts();
  for (const item of batch.items || []) {
    if (!(item.reviewPriority in priorityCounts)) fail('unknown source priority: ' + item.reviewPriority);
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

for (const file of [sourcePath, manifestPath, campaignPath, ndjsonPath]) {
  if (!fs.existsSync(file)) fail('required artifact missing: ' + path.relative(root, file));
}
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const campaign = JSON.parse(fs.readFileSync(campaignPath, 'utf8'));
const ndjson = fs.readFileSync(ndjsonPath, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));

if (!Array.isArray(source.batches) || !Array.isArray(campaign.waves)) fail('required arrays missing');
if (manifest.id !== 'pantavion_innovation_review_campaign_plan_v1') fail('unexpected manifest id');
if (JSON.stringify(campaign.manifest) !== JSON.stringify(manifest)) fail('embedded manifest mismatch');
if (JSON.stringify(ndjson) !== JSON.stringify(campaign.waves)) fail('NDJSON projection mismatch');
if (source.manifest?.reviewBatchSetFingerprint !== expectedBatchSetFingerprint) fail('exact parent batch fingerprint drifted');
if (manifest.sourceReviewBatchSetFingerprint !== expectedBatchSetFingerprint) fail('manifest parent fingerprint mismatch');
if (source.batches.length !== expectedBatchCount) fail('exact parent batch count drifted');
if (manifest.waveBatchLimit !== expectedWaveBatchLimit) fail('unexpected wave batch limit');

const expectedWaveCount = Math.ceil(source.batches.length / expectedWaveBatchLimit);
if (campaign.waves.length !== expectedWaveCount) fail('wave count mismatch');
const seenBatches = new Set();
const seenItems = new Set();
const priorityTotals = zeroPriorityCounts();
let scheduledItems = 0;

for (let waveIndex = 0; waveIndex < campaign.waves.length; waveIndex += 1) {
  const wave = campaign.waves[waveIndex];
  const expectedSequence = waveIndex + 1;
  const expectedWaveId = 'innovation-review-wave-' + String(expectedSequence).padStart(3, '0');
  const sourceSlice = source.batches.slice(waveIndex * expectedWaveBatchLimit, (waveIndex + 1) * expectedWaveBatchLimit);
  if (wave.waveId !== expectedWaveId || wave.sequence !== expectedSequence) fail('wave identity mismatch: ' + expectedWaveId);
  if (wave.sourceBatchSetFingerprint !== expectedBatchSetFingerprint) fail('wave parent fingerprint mismatch: ' + expectedWaveId);
  if (!Array.isArray(wave.batches) || wave.batches.length !== sourceSlice.length) fail('wave batch count mismatch: ' + expectedWaveId);
  if (wave.batchCount !== sourceSlice.length || wave.batchCount < 1 || wave.batchCount > expectedWaveBatchLimit) fail('wave bounds violated: ' + expectedWaveId);
  if (wave.startBatchSequence !== sourceSlice[0].sequence || wave.endBatchSequence !== sourceSlice[sourceSlice.length - 1].sequence) fail('wave sequence bounds mismatch: ' + expectedWaveId);

  const expectedPriorityCounts = zeroPriorityCounts();
  let expectedItemCount = 0;
  for (let batchIndex = 0; batchIndex < sourceSlice.length; batchIndex += 1) {
    const sourceBatch = sourceSlice[batchIndex];
    const summary = wave.batches[batchIndex];
    if (JSON.stringify(summary) !== JSON.stringify(expectedSummary(sourceBatch))) fail('batch summary mismatch: ' + sourceBatch.batchId);
    if (seenBatches.has(summary.batchId)) fail('duplicate batch scheduled: ' + summary.batchId);
    seenBatches.add(summary.batchId);
    for (const item of sourceBatch.items || []) {
      if (seenItems.has(item.atomId)) fail('duplicate atom scheduled: ' + item.atomId);
      seenItems.add(item.atomId);
    }
    expectedItemCount += summary.itemCount;
    for (const priority of priorities) expectedPriorityCounts[priority] += summary.priorityCounts[priority];
  }
  if (wave.itemCount !== expectedItemCount || JSON.stringify(wave.priorityCounts) !== JSON.stringify(expectedPriorityCounts)) fail('wave totals mismatch: ' + expectedWaveId);
  if (wave.waveFingerprint !== hash(wave.batches.map(batchLine).join('\n'))) fail('wave fingerprint mismatch: ' + expectedWaveId);
  for (const field of ['reviewerAssigned','reviewStarted','reviewCompleted','ownerApproved','maturityClaimsAllowed','semanticMergeAllowed','executionAllowed']) {
    if (wave[field] !== false) fail('unauthorized wave state: ' + field + ' in ' + expectedWaveId);
  }
  if (wave.authorizationEffect !== 'none') fail('authorization effect must remain none: ' + expectedWaveId);
  scheduledItems += wave.itemCount;
  for (const priority of priorities) priorityTotals[priority] += wave.priorityCounts[priority];
}

if (seenBatches.size !== expectedBatchCount) fail('not all source batches scheduled exactly once');
if (seenItems.size !== expectedReviewCount || scheduledItems !== expectedReviewCount) fail('not all source atoms scheduled exactly once');
const expectedCampaignFingerprint = hash(campaign.waves.map(wave => wave.waveId + ':' + wave.waveFingerprint).join('\n'));
if (manifest.campaignFingerprint !== expectedCampaignFingerprint) fail('campaign fingerprint mismatch');
const totals = manifest.totals || {};
if (totals.sourceBatches !== expectedBatchCount || totals.scheduledBatches !== expectedBatchCount) fail('batch coverage totals mismatch');
if (totals.sourceReviews !== expectedReviewCount || totals.scheduledReviews !== expectedReviewCount) fail('review coverage totals mismatch');
if (totals.waveCount !== expectedWaveCount || totals.fullWaves !== Math.floor(expectedBatchCount / expectedWaveBatchLimit) || totals.partialWaves !== 1) fail('wave totals mismatch');
if (JSON.stringify(totals.priorityTotals) !== JSON.stringify(priorityTotals)) fail('priority totals mismatch');
for (const field of ['reviewersAssigned','reviewsStarted','reviewsCompleted','ownerApprovals','maturityClaimsAllowed','semanticMergesAllowed','executionAuthorizations','unsupportedNoveltyClaims']) {
  if (totals[field] !== 0) fail('non-zero forbidden total: ' + field);
}

console.log(JSON.stringify({
  gate: 'PANTAVION INNOVATION REVIEW CAMPAIGN PLAN',
  result: 'PASS',
  sourceBatches: expectedBatchCount,
  scheduledBatches: seenBatches.size,
  sourceReviews: expectedReviewCount,
  scheduledReviews: seenItems.size,
  waveCount: campaign.waves.length,
  fullWaves: totals.fullWaves,
  partialWaves: totals.partialWaves,
  priorityTotals,
  reviewersAssigned: 0,
  reviewsCompleted: 0,
  ownerApprovals: 0,
  semanticMergesAllowed: 0,
  executionAuthorizations: 0,
  unsupportedNoveltyClaims: 0,
  campaignFingerprint: manifest.campaignFingerprint,
}, null, 2));
