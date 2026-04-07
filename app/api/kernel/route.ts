import { NextResponse } from "next/server";
import { pantavionKernel } from "@/kernel/kernel";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await pantavionKernel.process({
      title: typeof body?.title === "string" ? body.title : "",
      text: typeof body?.text === "string" ? body.text : "",
      kind: body?.kind,
      attachments: Array.isArray(body?.attachments) ? body.attachments : [],
      metadata: body?.metadata && typeof body.metadata === "object" ? body.metadata : {}
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown kernel error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const memory = pantavionKernel.exportMemory();
    return NextResponse.json({ ok: true, memory });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown memory error"
      },
      { status: 500 }
    );
  }
}
