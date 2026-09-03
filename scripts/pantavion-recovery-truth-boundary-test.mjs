import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('data/recovery/recovery-runtime-fabric-v1.json');
const fabric = JSON.parse(fs.readFileSync(file, 'utf8'));

assert.equal(fabric.corpus.records, 82413);
assert.equal(fabric.materializationTruth.workUnitCount, fabric.corpus.records);
assert.equal(fabric.semanticTruth.classifiedCandidates, 31779);
assert.equal(fabric.semanticTruth.recursiveQuarantine, 50279);
assert.equal(fabric.semanticTruth.governedHold, 355);
assert.equal(fabric.semanticTruth.completion, false);
assert.equal(fabric.materializationTruth.rawPayloadDuplicatedIntoControlPlane, false);
assert.equal(fabric.authority.executionAuthority, false);
assert.equal(fabric.authority.mergeAuthority, false);
assert.equal(fabric.authority.deploymentAuthority, false);
assert.equal(fabric.authority.productionWriteAuthority, false);
assert.equal(fabric.authority.publicExposureAuthority, false);
assert.equal(fabric.authority.releaseAuthority, false);
assert.match(fabric.truthRule, /materialize exactly once/i);
assert.match(fabric.truthRule, /HOLD and recursive artifacts remain preserved/i);

console.log('recovery truth boundary: PASS');
