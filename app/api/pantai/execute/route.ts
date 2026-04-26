import { NextResponse } from "next/server";
import { executePantaiLocal } from "../../../../core/pantavion/pantai-local-executor";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    executePantaiLocal({
      input: "Pantavion kernel status",
      mode: "plan",
    })
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const input =
    body && typeof body === "object" && "input" in body
      ? String((body as { input?: unknown }).input ?? "")
      : "";

  return NextResponse.json(
    executePantaiLocal({
      input,
      mode: "execute",
    })
  );
}
