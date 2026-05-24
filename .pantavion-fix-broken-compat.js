const fs = require("fs");

function fixFile(file) {
  let text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");

  // Remove broken compatibility imports like:
  // import { Something = any;
  text = text.replace(/^import\s+\{\s*[A-Za-z0-9_$]+\s*=\s*any\s*;\s*$/gm, "");

  // Remove broken export type lines if they were injected malformed
  text = text.replace(/^export\s+type\s+[A-Za-z0-9_$]+\s*}\s+from\s+['"][^'"]+['"];\s*$/gm, "");

  fs.writeFileSync(file, text, "utf8");
  console.log("fixed syntax:", file);
}

[
  "core/kernel/kernel.ts",
  "core/protocol/protocol-gateway.ts",
  "core/runtime/resilience-runtime.ts"
].forEach((file) => {
  if (fs.existsSync(file)) fixFile(file);
});
