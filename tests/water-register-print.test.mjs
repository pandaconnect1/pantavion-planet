import assert from 'node:assert/strict';
import { collectWaterRegisterPrintRows } from '../core/infrastructure/water/water-register-print.ts';
const offsets=[];
const rows=await collectWaterRegisterPrintRows(async offset=>{
 offsets.push(offset);
 return {total:3,assets:offset===0?[{number:'A'},{number:'B'}]:[{number:'C'}]};
});
assert.deepEqual(offsets,[0,2]);
assert.equal(rows.length,3);
assert.deepEqual(await collectWaterRegisterPrintRows(async()=>({total:0,assets:[]})),[]);
await assert.rejects(()=>collectWaterRegisterPrintRows(async()=>({total:2,assets:[{number:'A'}]})),/duplicate/);
let count=0;
await assert.rejects(()=>collectWaterRegisterPrintRows(async()=>({total:++count===1?2:3,assets:[{number:'A'}]})),/changed/);
await assert.rejects(()=>collectWaterRegisterPrintRows(async()=>({total:1,assets:[]})),/incomplete/);
await assert.rejects(()=>collectWaterRegisterPrintRows(async()=>({total:100001,assets:[]})),/invalid/);
await assert.rejects(()=>collectWaterRegisterPrintRows(async()=>{throw Error('403');}),/403/);
console.log('PASS: full multipage collection, empty results, duplicates, changed counts, missing pages, bounds and denied access');
