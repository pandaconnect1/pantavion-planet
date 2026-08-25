import type { SupabaseClient } from "@supabase/supabase-js";
import { executePersonalAIMultimodal } from "@/core/intelligence/personal-ai-multimodal-runtime";
import { buildPantavionMasterySystemInstruction } from "@/core/learning/mastery-learning-policy";
import { resolvePantavionScanLearningPolicy } from "@/core/learning/scan-to-learn-policy";

export type PantavionScanAttachment = {
  name?: unknown;
  mediaType?: unknown;
  dataBase64?: unknown;
  size?: unknown;
};

export type PantavionScanToLearnInput = {
  learnerRequest?: string;
  source?: "camera_photo" | "uploaded_image" | "uploaded_pdf" | "screenshot" | "typed_text" | "handwritten_notes" | "worksheet" | "textbook_page" | "teacher_board" | "unknown";
  countryCode?: string;
  gradeCode?: string;
  subjectCode?: string;
  curriculumCoverage?: "verified_match" | "verified_partial" | "coverage_missing";
  originalLanguage?: string | null;
  threadId?: string | null;
  attachments?: PantavionScanAttachment[];
};

function clean(value: unknown, max = 160): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function curriculumInstruction(input: PantavionScanToLearnInput): string {
  const country = clean(input.countryCode, 8).toUpperCase() || "unknown";
  const grade = clean(input.gradeCode, 40) || "unknown";
  const subject = clean(input.subjectCode, 80) || "unknown";
  const coverage = input.curriculumCoverage || "coverage_missing";
  return [
    `CURRICULUM CONTEXT: country=${country}; grade=${grade}; subject=${subject}; coverage=${coverage}.`,
    coverage === "verified_match"
      ? "You may align the teaching sequence to the supplied verified curriculum context, while still distinguishing the scanned material from official curriculum content."
      : "Do not claim exact official curriculum alignment. Treat country/grade/subject as learner-provided context only until a verified curriculum source is available.",
  ].join("\n");
}

export async function executePantavionScanToLearn(
  supabase: SupabaseClient,
  userId: string,
  input: PantavionScanToLearnInput,
) {
  const policy = resolvePantavionScanLearningPolicy({ source: input.source || "unknown" });
  const learnerRequest = clean(input.learnerRequest, 8_000) || "Βοήθησέ με να καταλάβω αυτό το υλικό.";

  const teachingRequest = [
    buildPantavionMasterySystemInstruction(),
    curriculumInstruction(input),
    "SCAN-TO-LEARN RULES:",
    "Treat the image/PDF/scan as learner-provided study material. Use only what is visible/readable and say when text is unclear.",
    "Do not reproduce long passages or bulk-extract a textbook. You may analyze the learner-provided excerpt and create original explanations and original practice.",
    "If this is a problem or exercise, do not immediately dump the final answer when guided learning is appropriate. Teach the concept, offer a hint, invite an attempt, then give targeted feedback.",
    "When a worked example is needed, explain the method and then ask a different transfer question so the learner demonstrates understanding rather than memorizing the answer.",
    `LEARNER REQUEST: ${learnerRequest}`,
  ].join("\n\n");

  const result = await executePersonalAIMultimodal(supabase, userId, {
    input: teachingRequest,
    threadId: input.threadId || null,
    inputMode: Array.isArray(input.attachments) && input.attachments.length ? "mixed" : "text",
    originalLanguage: input.originalLanguage || null,
    attachments: Array.isArray(input.attachments) ? input.attachments : [],
    metadata: {
      surface: "pantalearn-scan-to-learn-v1",
      learningMode: "mastery",
      curriculumCountryCode: clean(input.countryCode, 8).toUpperCase() || null,
      curriculumGradeCode: clean(input.gradeCode, 40) || null,
      curriculumSubjectCode: clean(input.subjectCode, 80) || null,
      curriculumCoverage: input.curriculumCoverage || "coverage_missing",
      scanSource: input.source || "unknown",
      scanPolicy: {
        rawMediaRetentionDefault: policy.rawMediaRetentionDefault,
        mustAvoidBulkBookExtraction: policy.mustAvoidBulkBookExtraction,
        mustDistinguishVisibleTextFromInference: policy.mustDistinguishVisibleTextFromInference,
      },
    },
  });

  return {
    ...result,
    learningContract: "pantavion-scan-to-learn-v1",
    masteryMode: true,
    scanPolicy: policy,
  };
}
