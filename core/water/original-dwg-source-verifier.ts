import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  PANTAVION_ORIGINAL_DWG_SOURCE_BINDING,
  assessPantavionOriginalDwgSourceBinding,
  type PantavionOriginalDwgBindingAssessment
} from "./original-dwg-source-binding";

export type PantavionOriginalDwgLocalVerificationInput = {
  localPath?: string;
  requestedSurface?: string;
  verifySha256?: boolean;
  founderApproved?: boolean;
  actor?: string;
};

async function sha256File(localPath: string): Promise<string> {
  const hash = createHash("sha256");

  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(localPath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve());
  });

  return hash.digest("hex");
}

export async function verifyPantavionOriginalDwgLocalFile(
  input: PantavionOriginalDwgLocalVerificationInput
): Promise<PantavionOriginalDwgBindingAssessment> {
  const localPath = String(input.localPath || "").trim();
  const expectedFilename = PANTAVION_ORIGINAL_DWG_SOURCE_BINDING.filename;

  if (!localPath) {
    return assessPantavionOriginalDwgSourceBinding({
      requestedSurface: input.requestedSurface,
      actor: input.actor
    });
  }

  const observedFilename = path.basename(localPath);

  if (observedFilename !== expectedFilename) {
    return assessPantavionOriginalDwgSourceBinding({
      observedFilename,
      requestedSurface: input.requestedSurface,
      actor: input.actor
    });
  }

  if (!input.founderApproved) {
    return assessPantavionOriginalDwgSourceBinding({
      observedFilename,
      requestedSurface: input.requestedSurface,
      actor: input.actor
    });
  }

  const stat = await fs.stat(localPath);
  const observedSha256 = input.verifySha256 ? await sha256File(localPath) : undefined;

  return assessPantavionOriginalDwgSourceBinding({
    observedFilename,
    observedSizeBytes: stat.size,
    observedSha256,
    requestedSurface: input.requestedSurface,
    founderApproved: input.founderApproved,
    actor: input.actor
  });
}
