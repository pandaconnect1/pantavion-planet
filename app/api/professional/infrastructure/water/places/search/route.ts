import { NextResponse } from "next/server";
import { TomTomPlacesSearchAdapter } from "@/core/water/tomtom-places-search-adapter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json(
      { status: "missing_query", results: [], message: "Γράψε τουλάχιστον 2 χαρακτήρες." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const apiKey = process.env.TOMTOM_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        status: "provider_not_configured",
        results: [],
        fallback: "/api/professional/infrastructure/water/address/search",
        message: "Το TomTom Places δεν έχει ακόμη ενεργοποιηθεί. Χρησιμοποίησε την υπάρχουσα αναζήτηση διεύθυνσης.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const adapter = new TomTomPlacesSearchAdapter({ apiKey });
    const results = await adapter.discover(query);
    return NextResponse.json(
      {
        status: "ready",
        provider: "TOMTOM",
        persistence: "SESSION_ONLY",
        results,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        status: "provider_error",
        results: [],
        fallback: "/api/professional/infrastructure/water/address/search",
        message: "Η κύρια αναζήτηση δεν ανταποκρίθηκε. Διατηρείται διαθέσιμη η ελεγχόμενη fallback αναζήτηση.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
