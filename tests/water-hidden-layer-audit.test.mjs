import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync('scripts/pantavion-water-map-b-generate-derived.mjs', 'utf8');
const keywords = source.slice(source.indexOf('const INVENTORY_KEYWORDS'), source.indexOf('// Magenta/pink'));
const pink = source.slice(source.indexOf('function isPinkColor'), source.indexOf('// ---- network register'));
const inventory = source.slice(source.indexOf('function buildNetworkInventory'), source.indexOf('function fail'));
const context = vm.createContext({});
vm.runInContext(`const finite = Number.isFinite; ${keywords}\n${pink}\n${inventory}\nglobalThis.audit = buildNetworkInventory;`, context);
const result = context.audit({
  layers: [{name:'Hidden supply',off:true,frozen:false},{name:'Frozen tanks',off:false,frozen:true},{name:'Empty hidden',off:true}],
  segments: [[0,0,10,0,0,0]],
  texts: [[1,2,0,0,'Ροή προς δεξαμενή'],[3,4,1,0,'ΔΕΞΑΜΕΝΗ']],
  blockRefs: [[5,6,0,'FLOW_ARROW']], points: [], styles: [],
});
assert.equal(result.layers.find(l=>l.layer==='Hidden supply').sourceOff,true);
assert.equal(result.layers.find(l=>l.layer==='Frozen tanks').sourceFrozen,true);
assert.equal(result.coverage.unrepresentedLayers[0].name,'Empty hidden');
assert.equal(result.flowEvidence.labelCandidates.length,1);
assert.equal(result.flowEvidence.symbolCandidates.length,1);
assert.equal(result.flowEvidence.labelCandidates[0].x,1);
assert.equal(result.flowEvidence.verifiedConnections.length,0);
assert.equal(result.coverage.directionOfWaterFlowVerified,false);
const worker = readFileSync('scripts/pantavion-water-owner-b-derived-job.mjs','utf8');
const guard = worker.indexOf('if (process.env.PANTAVION_WATER_INVENTORY_READ_ONLY');
assert(guard>=0 && guard<worker.indexOf('const reg = inv.register'));
assert(worker.slice(guard,worker.indexOf('const reg = inv.register')).includes('return;'));
console.log('PASS: hidden/frozen/empty layers retained, flow candidates preserve evidence, no asserted supply, audit returns before asset writes');
