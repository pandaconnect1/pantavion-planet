#!/usr/bin/env node
"use strict";
// Read-only integrity check of the existing kernel ledger implementation.
// Does not alter the ledger, production data, or workflow state.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

function audit(root) {
  const file = path.join(root, "core/pantavion-kernel-ledger.ts");
  const source = fs.readFileSync(file, "utf8");
  const findings = [];
  if (/path\.join\(process\.cwd\(\),\s*["']pantavion-kernel-ledger\.json["']\)/.test(source)) {
    findings.push({id:"LEDGER_LOCAL_FILESYSTEM",severity:"critical",reason:"Ledger uses a process-local JSON file; cross-instance persistence and restart durability are not proven."});
  }
  if (/catch\s*\{\s*return\s*\[\];/s.test(source)) {
    findings.push({id:"LEDGER_READ_FAILS_OPEN_EMPTY",severity:"high",reason:"Read errors silently return an empty ledger, potentially hiding existing tasks."});
  }
  if (/fs\.writeFileSync\(LEDGER_PATH,\s*JSON\.stringify\(current/.test(source)) {
    findings.push({id:"LEDGER_NON_ATOMIC_READ_MODIFY_WRITE",severity:"high",reason:"Concurrent append operations may overwrite each other without locking or transactions."});
  }
  return {ok:findings.length===0,source:"core/pantavion-kernel-ledger.ts",findings};
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) {
    const temp = fs.mkdtempSync(path.join(require("node:os").tmpdir(),"pantavion-ledger-audit-"));
    try {
      const dir=path.join(temp,"core");fs.mkdirSync(dir);
      fs.writeFileSync(path.join(dir,"pantavion-kernel-ledger.ts"),`const LEDGER_PATH = path.join(process.cwd(), "pantavion-kernel-ledger.json");
try { return JSON.parse(raw); } catch { return []; }
fs.writeFileSync(LEDGER_PATH, JSON.stringify(current, null, 2));`);
      const result=audit(temp);
      assert.equal(result.findings.length,3);
      assert.equal(result.ok,false);
      process.stdout.write("Ledger audit self-test PASSED\\n");
    } finally { fs.rmSync(temp,{recursive:true,force:true}); }
  } else {
    const result=audit(process.cwd());
    process.stdout.write(JSON.stringify(result,null,2)+"\\n");
    if (!result.ok) process.exitCode=1;
  }
}
module.exports={audit};
