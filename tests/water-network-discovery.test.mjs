import assert from 'node:assert/strict';
import {buildWaterNetworkDiscovery} from '../scripts/water-network-discovery.mjs';
const report=buildWaterNetworkDiscovery({
 layers:[{name:'OTHER ROAD NAMES',off:true},{name:'930 SYKAMINOU',frozen:true},{name:'OTHER EQUIPMENT'}],
 texts:[[1,2,0,0,'ΑΝΔΡΕΑ ΠΑΠΑΔΟΠΟΥΛΟΥ'],[3,4,1,0,'ΔΕΞΑΜΕΝΗ'],[5,6,2,0,'ΕΞΑΓΩΓΗ ΝΕΡΟΥ']],
 blockRefs:[[1000,200,2,'VALVE-SPECIAL'],[7,8,2,'UNKNOWN-SYMBOL']],segments:[[1,2,3,4,0,0]],
 leaders:[{layerId:1,vertices:[[10,20],[30,40]],sourceHandle:"L1",arrowheadEnabled:true}],
 duplicateCutoff:500,register:{assets:[{number:'T1',x:3,y:4,layer:'930 SYKAMINOU'}]},stats:{notReproduced:{SOMETYPE:2}},
});
assert.equal(report.summary.sourceBlocks,2);
assert.equal(report.summary.categories.street,1);
assert.equal(report.summary.categories.unclassified_block,1);
assert.equal(report.items.find(r=>r.label==='VALVE-SPECIAL').beyondPriorCutoff,true);
assert.equal(report.items.find(r=>r.label==='ΔΕΞΑΜΕΝΗ').registerNumbers[0],'T1');
assert(report.items.find(r=>r.label==='ΔΕΞΑΜΕΝΗ').frozen);
assert(report.sykamCandidateRefs.length>=2);
assert.equal(report.truth.physicalAssetCountsVerified,false);
assert.equal(report.extractorStats.notReproduced.SOMETYPE,2);
assert.equal(report.layers[0].segments,1);
console.log('PASS: extra street layers, unmatched symbols, hidden evidence, excluded coordinate copies and source matching remain evidence only');

assert.equal(report.items.find(r=>r.category==='leader').vertices[1][0],30);
assert.equal(report.summary.sourceLeaders,1);
