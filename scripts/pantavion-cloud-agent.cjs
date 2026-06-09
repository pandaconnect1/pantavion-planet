const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const specBase64 = process.env.SPEC_BASE64;

if (!specBase64) {
  console.log("PANTAVION CLOUD AGENT: no SPEC_BASE64 provided.");
  process.exit(0);
}

const specText = Buffer.from(specBase64, "base64").toString("utf8");
const spec = JSON.parse(specText);

if (!spec.branch || !spec.commitMessage || !Array.isArray(spec.files)) {
  throw new Error("Invalid Pantavion agent spec. Required: branch, commitMessage, files[].");
}

function run(command) {
  console.log(`> ${command}`);
  execSync(command, { stdio: "inherit" });
}

function safeWriteFile(filePath, content) {
  const normalized = filePath.replace(/\\/g, "/");

  if (
    normalized.includes("..") ||
    normalized.startsWith("/") ||
    normalized.includes(".git/")
  ) {
    throw new Error(`Unsafe file path blocked: ${filePath}`);
  }

  const absolute = path.join(process.cwd(), normalized);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content, "utf8");
  console.log(`WROTE ${normalized}`);
}

run("git config user.name pantavion-cloud-agent");
run("git config user.email pantavion-cloud-agent@pantavion.local");
run("git checkout -B " + spec.branch);

for (const file of spec.files) {
  if (!file.path || typeof file.content !== "string") {
    throw new Error("Each file needs path and content.");
  }

  safeWriteFile(file.path, file.content);
}

run("git status --short");

const files = spec.files.map((file) => `"${file.path}"`).join(" ");
run("git add " + files);
run(`git commit -m "${spec.commitMessage.replace(/"/g, "'")}"`);
run("git push origin " + spec.branch + " --force");

console.log("PANTAVION CLOUD AGENT: BRANCH_PUSHED");
console.log("Branch: " + spec.branch);
console.log("Next: open a Pull Request from this branch to main.");
