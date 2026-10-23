import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { postalDatabaseRecords } from '../core/infrastructure/water/water-street-directory.ts';

const project = 'cxhulvwkagzufbjsdwwu';
if (process.env.SUPABASE_PROJECT_REF !== project || process.env.SUPABASE_URL !== `https://${project}.supabase.co`) throw new Error('postal_import_project_mismatch');
const source = JSON.parse(readFileSync('data/water/limassol-postal-source-2024.json','utf8'));
if(source.sha256 !== '5e89b5768cb914af3a22e2df0438532bbfd69a5f8556e1cc2ec87d665a96db04' || source.rows.length !== 8978) throw new Error('postal_import_source_mismatch');
const records = postalDatabaseRecords(source);
if(records.length !== 8800 || new Set(records.map(r=>r.municipality_or_community)).size !== 143) throw new Error('postal_import_count_mismatch');
const admin=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const existing=new Set();
for(let offset=0;;offset+=1000){
  const {data,error}=await admin.from('pantavion_cyprus_streets').select('source_ref').eq('source','CYPRUS_POST').like('source_ref','cyprus-post-2024:%').order('source_ref').range(offset,offset+999);
  if(error)throw new Error('postal_existing_read_failed');
  data.forEach(r=>existing.add(r.source_ref));if(data.length<1000)break;
}
const missing=records.filter(r=>!existing.has(r.source_ref));
for(let offset=0;offset<missing.length;offset+=200){
  const {error}=await admin.from('pantavion_cyprus_streets').insert(missing.slice(offset,offset+200));
  if(error)throw new Error(`postal_insert_failed:${error.code}`);
}
const {count,error}=await admin.from('pantavion_cyprus_streets').select('id',{count:'exact',head:true}).eq('source','CYPRUS_POST').like('source_ref','cyprus-post-2024:%');
if(error || count!==records.length)throw new Error('postal_import_verification_failed');
console.log(JSON.stringify({ok:true,sourceSha256:source.sha256,sourceRows:source.rows.length,verifiedStreetLocalityPairs:count,streetLocalities:143,inserted:missing.length,preservedExistingRecords:true,geographicCoordinatesInvented:false}));
