import { NextResponse } from "next/server";
import type { PantavionTranslationRequest } from "@/core/translation/pantavion-translation-provider-router";
import { translateWithPantavionProvider } from "@/core/translation/pantavion-translation-provider-adapters";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PantavionTranslationRequest;
    const result = await translateWithPantavionProvider(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "provider_error",
        message:
          error instanceof Error ? error.message : "Translation request failed.",
      },
      { status: 500 }
    );
  }
}
