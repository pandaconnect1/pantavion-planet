#!/usr/bin/env node
"use strict";
// Deterministic, fail-closed intake classifier for historical Pantavion findings.
// Usage: node scripts/pantavion-excavation-classify.cjs < findings.json
const fs=require("node:fs"), crypto=require("node:crypto");
const input=JSON.parse(fs.readFileSync(0,"utf8"));
if(!Array.isArray(input)||input.length>500)throw Error("Expected <=500 findings");
const rules=[
 ["maps",/\b(map|maps|gis|geospatial|dwg|geolocation|coordinate|χαρτ|γεωχωρ)\b/i],
 ["water",/\b(water|hydrant|valve|tank|pipeline|υδρευ|δεξαμεν|κρουν)\b/i],
 ["voice_video",/\b(voice|video|webrtc|call|κλήσ|βιντεοκλήσ)\b/i],
 ["chat",/\b(chat|message|dm|inbox|messaging|συνομιλ|μήνυμα)\b/i],
 ["social",/\b(social|feed|post|community|reaction|κοινότητ|δημοσίευσ)\b/i],
 ["identity",/\b(auth|identity|mfa|login|consent|ταυτότ|συναίνεσ)\b/i]
];
const seen=new Set();
const results=input.map((item,i)=>{
 if(!item||typeof item!=="object"||typeof item.source!=="string"||typeof item.description!=="string")throw Error("Invalid finding "+i);
 const source=item.source.slice(0,500),description=item.description.slice(0,4000);
 const id=crypto.createHash("sha256").update(source+"\n"+description).digest("hex");
 if(seen.has(id))return {id,source,status:"duplicate"};
 seen.add(id);
 const matched=rules.filter(([_,re])=>re.test(source+" "+description)).map(([k])=>k);
 // Maps/Water, Chat/Voice and Social are never automatically merged.
 return {id,source,status:matched.length===1?"classified":"manual_review",kernel_id:matched.length===1?matched[0]:null,candidates:matched,verification:"required",automatic_merge:false};
});
process.stdout.write(JSON.stringify({schema_version:1,findings:results},null,2)+"\n");
