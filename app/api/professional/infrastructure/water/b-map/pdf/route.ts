import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const pdfUrl = process.env.PANTAVION_WATER_B_MAP_PDF_URL;

  if (!pdfUrl) {
    return NextResponse.json(
      {
        ok: false,
        status: "protected_pdf_env_missing",
        route: "/api/professional/infrastructure/water/b-map/pdf",
        message:
          "B Map PDF is not configured yet. The original DWG remains private, unchanged, and blocked from raw browser loading.",
      },
      { status: 403 },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      status: "protected_pdf_session_required",
      route: "/api/professional/infrastructure/water/b-map/pdf",
      message:
        "B Map PDF URL exists, but trusted founder/admin session delivery is not connected yet. Refusing to proxy the private PDF.",
    },
    { status: 403 },
  );
}
