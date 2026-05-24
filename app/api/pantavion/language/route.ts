import { NextResponse } from "next/server";
import {
  pantavionGlobalLanguageRuntimeContract,
  resolvePantavionRuntimeLanguage,
} from "@/core/language/pantavion-global-language-runtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|; )pantavion_language=([^;]+)/);
  const language = resolvePantavionRuntimeLanguage(match ? decodeURIComponent(match[1]) : "el");

  return NextResponse.json({
    ok: true,
    contract: pantavionGlobalLanguageRuntimeContract,
    language,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const language = resolvePantavionRuntimeLanguage(body.language);
  const response = NextResponse.json({
    ok: true,
    contract: pantavionGlobalLanguageRuntimeContract,
    language,
  });

  response.cookies.set("pantavion_language", language.code, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 366,
  });

  return response;
}
