import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

// Execute the real route against a recording database double. No network or keys.
const calls = [];
let allowed = true;
let fail = false;
const rows = [
  {number:'224-V0002',area_code:'224',street:'ΒΗΤΑ',tag:'SV 2'},
  {number:'123-V0001',area_code:'123',street:'ΑΛΦΑ',tag:'SV 1'},
];
function builder(table) {
  let orders=[]; let bounds=null;
  const b = {};
  for (const method of ['select','eq','is','in','ilike','or','gte','lte','limit']) b[method]=(...args)=>{calls.push([table,method,...args]);return b;};
  b.order=(column)=>{orders.push(column);calls.push([table,'order',column]);return b;};
  b.range=(from,to)=>{bounds=[from,to];return b;};
  b.then=(resolve)=>{
    if(fail) return Promise.resolve({data:null,error:new Error('database failed')}).then(resolve);
    let data=table==='water_network_areas'?[{code:'224',group_name:'ΖΩΝΗ Α'}]:[...rows];
    if(table==='water_network_assets') data.sort((a,b)=>{for(const key of orders){const n=String(a[key]).localeCompare(String(b[key]),'el');if(n)return n;}return 0;});
    const count=data.length;
    if(bounds) data=data.slice(bounds[0],bounds[1]+1);
    return Promise.resolve({data,error:null,count}).then(resolve);
  };
  return b;
}
globalThis.__waterRegisterTest={
  NextResponse:{json:(body,options={})=>({body,status:options.status||200})},
  authorize:async()=>allowed?{ok:true}:{ok:false,error:'denied'},
  admin:()=>({from:builder,rpc:async()=>({data:[],error:null})}),
};
let source=readFileSync('app/api/professional/infrastructure/water/register/route.ts','utf8')
  .replace(/import \{ NextRequest, NextResponse \} from "next\/server";/,'const {NextResponse}=globalThis.__waterRegisterTest;')
  .replace(/import \{ authorizeWaterMapRequest \}[^;]+;/,'const authorizeWaterMapRequest=globalThis.__waterRegisterTest.authorize;')
  .replace(/import \{ createAdminClient \}[^;]+;/,'const createAdminClient=globalThis.__waterRegisterTest.admin;')
  .replace(/import \{ waterRegisterNumberCandidates, waterRegisterAlternateStreetOrder \}[^;]+;/, readFileSync('core/infrastructure/water/water-register-search.ts','utf8').replaceAll('export function','function'));
const {GET}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
const request=(query)=>({nextUrl:new URL('https://example.test/?'+query)});
allowed=false;
assert.equal((await GET(request('q=SV'))).status,403);
assert.equal(calls.length,0,'unauthorized request must not touch database');
allowed=true;
let r=await GET(request('sort=number&limit=1&offset=0'));
assert.equal(r.body.assets[0].number,'123-V0001');
r=await GET(request('sort=number&limit=1&offset=1'));
assert.equal(r.body.assets[0].number,'224-V0002');
calls.length=0;
await GET(request('sort=street'));
assert.deepEqual(calls.filter(c=>c[1]==='order').map(c=>c[2]),['street','area_code','number']);
calls.length=0;
await GET(request('sort=DROP%20TABLE'));
assert.deepEqual(calls.filter(c=>c[1]==='order').map(c=>c[2]),['area_code','street','number']);
calls.length=0;
await GET(request('q=224&zone='+encodeURIComponent('ΖΩΝΗ Α')));
assert(calls.some(c=>c[1]==='in'&&c[2]==='area_code'&&c[3][0]==='224'));
assert(calls.some(c=>c[1]==='or'&&c[2].includes('area_code.ilike.%224%')));
assert(calls.some(c=>c[1]==='or'&&c[2].includes('area_code.eq.224')));
calls.length=0;
r=await GET(request('view=streets&q='+encodeURIComponent('ΛΕΜΕΣΟΣ')));
assert.equal(r.body.coverage,'recorded_only');
assert.equal(r.body.fullCoverageVerified,false);
assert(calls.some(c=>c[0]==='pantavion_cyprus_streets'&&c[1]==='select'));
assert(!calls.some(c=>c[0]==='water_network_assets'),'street directory must not depend on assets');
assert(calls.some(c=>c[1]==='or'&&c[2].includes('area_or_parish.ilike.')));
assert.deepEqual(calls.filter(c=>c[1]==='order').map(c=>c[2]),['municipality_or_community','area_or_parish','zone_or_section','name_el','name_lat','id']);
calls.length=0;
await GET(request('sv=123&street='+encodeURIComponent('ΑΘΗΝΩΝ')+'&area=224'));
const expressions=calls.filter(c=>c[1]==='or').map(c=>c[2]);
assert(expressions.some(c=>c.includes('tag.ilike.SV 123')));
assert(!expressions.some(c=>c.includes('tag.ilike.%123%')),'SV must be an exact tag, not a substring');
assert(expressions.some(c=>c.includes('street_key.ilike.')));
assert(calls.some(c=>c[1]==='eq'&&c[2]==='area_code'&&c[3]==='224'));
calls.length=0;
await GET(request('view=streets&q='+encodeURIComponent('Αθηνών Ύψωνας')+'&locality='+encodeURIComponent('Ύψωνας')));
assert(calls.some(c=>c[0]==='pantavion_cyprus_streets'&&c[1]==='in'&&c[2]==='district_name'&&c[3].includes('Lemesos')));
assert(calls.filter(c=>c[1]==='or').length===3,'street and locality tokens form separate required groups');
fail=true;
assert.equal((await GET(request('q=SV'))).status,500);
console.log('PASS: authorization, global sorting across pages, sort allowlist, zone filter, area search, database failure');
