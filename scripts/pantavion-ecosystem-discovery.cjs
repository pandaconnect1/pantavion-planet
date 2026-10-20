#!/usr/bin/env node
/**
 * Read-only ecosystem discovery: derives work from the repository's canonical
 * product-family taxonomy rather than maintaining a small hardcoded agent list.
 * Does not invoke AI providers, mutate routes, or touch protected assets.
 */
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root,"core/pantavion/product-family-taxonomy.ts"),"utf8");
const rows = [];
const starts = [...source.matchAll(/^    id: "([^"]+)",/gm)];
for (let i=0;i<starts.length;i++) {
  const section = source.slice(starts[i].index,starts[i+1]?.index ?? source.length);
  const field = name => section.match(new RegExp('^    '+name+': "([^"]+)"','m'))?.[1] ?? null;
  const id=starts[i][1], status=field("status"), risk=field("riskClass"), route=field("publicRoute");
  if (!status || !risk || !route) continue;
  const routePath = path.join(root,"app",...route.split("/").filter(Boolean),"page.tsx");
  const routeJs = routePath.replace(/\.tsx$/, ".jsx");
  const routeExists = fs.existsSync(routePath) || fs.existsSync(routeJs) ||
    (route === "/" && (fs.existsSync(path.join(root,"app/page.tsx")) || fs.existsSync(path.join(root,"app/page.jsx"))));
  const activation = ["FOUNDATION","BETA","FUTURE","BLOCKED","LEGAL_REVIEW","RESTRICTED"].includes(status);
  rows.push({
    id, status, risk, route, routeExists,
    owner: "pantavion-domain-"+id,
    work: !routeExists ? "investigate_missing_route" : activation ? "verify_backend_provider_and_user_journey" : "prove_live_end_to_end",
    approvalRequired: risk==="HIGH" || risk==="CRITICAL",
    evidenceRequired: ["route_test","api_or_provider_proof","authenticated_user_journey","production_smoke"],
    state: "unverified"
  });
}
if (!rows.length) { console.error("No taxonomy families found; refusing empty success"); process.exit(1); }
const report={schema:1,source:"core/pantavion/product-family-taxonomy.ts",count:rows.length,
  missingRouteCount:rows.filter(x=>!x.routeExists).length,
  note:"Static repository inventory, NOT evidence of functioning AI agents or live services.",
  tasks:rows};
const out=path.join(root,"artifacts/ecosystem-discovery");
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,"agent-work-inventory.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({families:report.count,missingRoutes:report.missingRouteCount,artifact:"artifacts/ecosystem-discovery/agent-work-inventory.json"}));
