const fs = require("fs");

const files = [
  "core/agents/pantavion-autonomy-governance.ts",
  "app/api/pantavion/agents/runtime/approvals/route.ts",
  "app/pantavion/agents/approvals/page.tsx",
  "components/pantavion/PantavionFounderApprovalsClient.tsx"
];

const checks = [];

function ok(label, condition) {
  checks.push({ label, ok: Boolean(condition) });
}

for (const file of files) {
  ok(`${file} present`, fs.existsSync(file));
}

const governance = fs.existsSync(files[0]) ? fs.readFileSync(files[0], "utf8") : "";
const route = fs.existsSync(files[1]) ? fs.readFileSync(files[1], "utf8") : "";
const page = fs.existsSync(files[2]) ? fs.readFileSync(files[2], "utf8") : "";
const client = fs.existsSync(files[3]) ? fs.readFileSync(files[3], "utf8") : "";
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

ok("approval queue marker present", governance.includes("founder-approval-queue.json"));
ok("approval audit marker present", governance.includes("founder-approval-audit.jsonl"));
ok("social approval present", governance.includes("approval_social_living_screen"));
ok("contacts approval present", governance.includes("approval_contacts_import"));
ok("auth approval present", governance.includes("approval_auth_login_profiles"));
ok("GET route present", route.includes("export async function GET"));
ok("POST route present", route.includes("export async function POST"));
ok("dashboard page present", page.includes("PantavionFounderApprovalsClient"));
ok("approve button present", client.includes("Approve"));
ok("block button present", client.includes("Block"));
ok("audit script present", pkg.scripts && pkg.scripts["audit:founder-approvals"]);

const failed = checks.filter((check) => !check.ok);

if (failed.length) {
  console.error("PANTAVION FOUNDER APPROVALS GATE: FAILED");
  for (const check of failed) console.error("- " + check.label);
  process.exit(1);
}

console.log("PANTAVION FOUNDER APPROVALS GATE: PASSED");
for (const check of checks) console.log("- " + check.label);
