// Founder-scoped Social/Chat autonomous audit: deterministic read-only checks.
// It does not invoke an AI model, change production, or publish a release.
const fs = require("node:fs");
const path = require("node:path");
const root = process.cwd();
const required = [
  "app/social/page.tsx",
  "app/social/social-home-client.tsx",
  "app/messages/page.tsx",
  "app/messages/[conversationId]/conversation-client.tsx",
  "app/api/messages/send/route.ts",
  "core/agents/pantavion-independent-agent-runtime.ts",
  "core/agents/pantavion-kernel-federation-policy.ts",
  "docs/recovery/SOCIAL-CHAT-DONOR-AUDIT-20261020.md",
];
const forbidden = ["app/social/map", "app/social/map/page.tsx"];
const checks = required.map((file) => ({ file, exists: fs.existsSync(path.join(root,file)) }));
const report = {
  kernel: "social_chat_development",
  generatedAt: new Date().toISOString(),
  executionMode: "deterministic_read_only_audit",
  aiWorkersActive: false,
  providerConfigured: false,
  productionMutation: false,
  checks,
  missing: checks.filter((x)=>!x.exists).map((x)=>x.file),
  exclusions: forbidden,
  nextWork: [
    "Verify two-account direct chat with receipts and block policy",
    "Compare historical Social Core donor branches against canonical implementation",
    "Implement group conversations with reviewed RLS",
    "Validate communities and notifications against production schema",
  ],
};
const dest = path.join(root,"data","runtime-reports","social-chat");
fs.mkdirSync(dest,{recursive:true});
fs.writeFileSync(path.join(dest,"latest-social-chat-audit.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({ok:report.missing.length===0,report:"data/runtime-reports/social-chat/latest-social-chat-audit.json",missing:report.missing}));
if(report.missing.length)process.exitCode=1;
