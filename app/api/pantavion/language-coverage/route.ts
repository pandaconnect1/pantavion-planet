import { NextResponse } from "next/server";
import { getPantavionLanguageCoverageSnapshot } from "@/core/translation/pantavion-language-coverage-matrix";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request) {
  const snapshot = await getPantavionLanguageCoverageSnapshot();
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim().toLowerCase();

  if (code) {
    const row = snapshot.rows.find((item) => item.code.toLowerCase() === code);
    if (!row) {
      return NextResponse.json(
        {
          ok: false,
          error: "language_not_registered",
          code,
          registeredLanguageCount: snapshot.registeredLanguageCount,
          targetNaturalLanguageCount: snapshot.targetNaturalLanguageCount,
          truthBoundary: snapshot.truthBoundary,
        },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        language: row,
        runtime: snapshot.runtime,
        truthBoundary: snapshot.truthBoundary,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { ok: true, ...snapshot },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
