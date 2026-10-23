import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {gzipSync} from 'node:zlib';
import * as directory from '../core/infrastructure/water/water-street-directory.ts';
import {readWaterDiscoveryPage} from '../core/infrastructure/water/water-discovery-stream.ts';
let allowed=false,calls=0,badSource=false;
const sha='6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16';
function builder(table){const b={};for(const name of ['select','in','eq','order','limit','range'])b[name]=()=>b;
 b.then=(resolve)=>Promise.resolve({error:null,data:table==='water_spatial_patches'?[{asset_type:'road_reference',patch_id:'new-road',status:'pending_review',street_name:'Νέα Οδός',area:'Ύψωνας',geometry:{type:'LineString',coordinates:[[33,34],[33.01,34.01]],crs:{authority:'EPSG',code:'4326'}}}]:[]}).then(resolve);return b;}
globalThis.__streets={...directory,readWaterDiscoveryPage,postalSource:JSON.parse(readFileSync('data/water/limassol-postal-source-2024.json','utf8')),
 NextResponse:{json:(body,options={})=>({body,status:options.status||200})},authorizeWaterMapRequest:async()=>allowed?{ok:true}:{ok:false,error:'denied'},
 createAdminClient:()=>{calls++;return{from:builder,storage:{from:()=>({download:async()=>({error:null,data:new Blob([gzipSync([JSON.stringify({recordType:'metadata',sourceSha256:badSource?'wrong':sha,summary:{evidence:1}}),JSON.stringify({recordType:'item',ref:'text:1',category:'street',label:'ATHINON',layer:'STREET',x:10,y:20,registerNumbers:[]})].join('\n')+'\n')])})})}};}};
let source=readFileSync('app/api/professional/infrastructure/water/street-directory/route.ts','utf8')
 .replace(/import \{ NextRequest, NextResponse \}[^;]+;/,'const {NextResponse}=globalThis.__streets;')
 .replace(/import \{ authorizeWaterMapRequest \}[^;]+;/,'const {authorizeWaterMapRequest}=globalThis.__streets;')
 .replace(/import \{ createAdminClient \}[^;]+;/,'const {createAdminClient}=globalThis.__streets;')
 .replace(/import postalSource[^;]+;/,'const {postalSource}=globalThis.__streets;')
 .replace(/import \{ readWaterDiscoveryPage \}[^;]+;/,'const {readWaterDiscoveryPage}=globalThis.__streets;')
 .replace(/import \{ postalDirectoryRows[^;]+;/,'const {postalDirectoryRows,drawingStreetRows,fieldStreetRows,mergeStreetSources,streetDirectoryPage}=globalThis.__streets;');
const load=async(s)=>import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(s)).toString('base64'));
const {GET}=await load(source);const request=(s='')=>({nextUrl:new URL('https://example.test/?'+s)});
assert.equal((await GET(request())).status,403);assert.equal(calls,0,'Unauthorized reads must not touch cached private drawing sources or the database');
allowed=true;let r=await GET(request());assert.equal(r.status,200);assert.equal(r.body.total,8802);assert.equal(r.body.partial,false);assert.equal(r.body.coverage.drawingLabels,1);assert.equal(r.body.fullCoverageVerified,false);
r=await GET(request('source=field'));assert.equal(r.body.total,1);assert.equal(r.body.streets[0].status,'pending_review');
r=await GET(request('q=Athinwn%20Ypsonas'));assert(r.body.total>0);assert(r.body.streets.every(r=>r.locality_lat==='Ypsonas'));
badSource=true;const other=await load(source+'\n// fresh cache');r=await other.GET(request());assert.equal(r.body.partial,true);assert.equal(r.body.coverage.drawingLabels,0);assert(r.body.warnings.length>0);assert.equal(r.body.total,8801);
console.log('Unified street API: approved access, complete source union, bilingual filtering, live field records and explicit missing-source warnings passed');
