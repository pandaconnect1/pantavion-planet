import { NextResponse } from "next/server";
import { resolvePantavionCurriculum } from "@/core/learning/country-curriculum-policy";
import { pantavionCountryCurriculumRegistry } from "@/core/learning/country-curriculum-registry";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function value(value: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function country(value: string | null): string {
  const normalized = (value || "CY").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) throw new Error("invalid country");
  return normalized;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = {
      countryCode: country(url.searchParams.get("country")),
      regionCode: value(url.searchParams.get("region")),
      schoolSystem: value(url.searchParams.get("system")),
      academicYear: value(url.searchParams.get("year")),
      gradeCode: value(url.searchParams.get("grade")),
      subjectCode: value(url.searchParams.get("subject")),
      languageCode: value(url.searchParams.get("language")),
    };

    const decision = resolvePantavionCurriculum(query, pantavionCountryCurriculumRegistry);

    return NextResponse.json({
      ok: true,
      contract: "pantavion-country-curriculum-v1",
      query,
      decision,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "invalid request" },
      { status: 400 },
    );
  }
}
