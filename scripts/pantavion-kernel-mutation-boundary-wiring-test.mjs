import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const kernelApiRoot = path.join(process.cwd(), "app", "api", "kernel");
const mutationExport = /export async function (POST|PUT|PATCH|DELETE)\(request: Request\)/g;
const sharedBoundaryCall = "enforcePantavionKernelPrivilegedMutationBoundary(request)";
const directBoundaryCall = "evaluatePrivilegedRequestBoundary(request)";
const founderGuard = "isPantavionKernelFounderRequestAllowed(request)";

function routeFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...routeFiles(target));
    else if (entry.isFile() && entry.name === "route.ts") files.push(target);
  }
  return files.sort();
}

let founderMutationRoutes = 0;
let mutationHandlers = 0;

for (const file of routeFiles(kernelApiRoot)) {
  const source = fs.readFileSync(file, "utf8");
  if (!source.includes(founderGuard)) continue;

  const handlers = [...source.matchAll(mutationExport)];
  if (handlers.length === 0) continue;
  founderMutationRoutes += 1;

  assert.equal(
    source.includes("privileged-request-boundary") ||
      source.includes("kernel-privileged-mutation-boundary"),
    true,
    `${path.relative(process.cwd(), file)} must import a privileged mutation boundary`,
  );

  for (let index = 0; index < handlers.length; index += 1) {
    const start = handlers[index].index;
    const end = handlers[index + 1]?.index ?? source.length;
    const handlerSource = source.slice(start, end);
    const boundaryIndex = [handlerSource.indexOf(sharedBoundaryCall), handlerSource.indexOf(directBoundaryCall)]
      .filter((value) => value >= 0)
      .sort((a, b) => a - b)[0] ?? -1;
    const founderIndex = handlerSource.indexOf(founderGuard);

    assert.notEqual(
      boundaryIndex,
      -1,
      `${path.relative(process.cwd(), file)} ${handlers[index][1]} lacks the fail-closed boundary`,
    );
    assert.notEqual(
      founderIndex,
      -1,
      `${path.relative(process.cwd(), file)} ${handlers[index][1]} lacks Founder authorization`,
    );
    assert.equal(
      boundaryIndex < founderIndex,
      true,
      `${path.relative(process.cwd(), file)} ${handlers[index][1]} must reject request forgery before authorization`,
    );
    mutationHandlers += 1;
  }
}

assert.equal(founderMutationRoutes >= 11, true, "expected at least eleven Founder Kernel mutation routes");
assert.equal(mutationHandlers >= 12, true, "expected at least twelve Founder Kernel mutation handlers");

console.log("Pantavion Kernel privileged mutation boundary wiring PASSED.");
console.log(`Verified ${mutationHandlers} handlers across ${founderMutationRoutes} Founder-only routes.`);
