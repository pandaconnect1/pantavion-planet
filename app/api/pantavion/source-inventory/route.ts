import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const inventoryPath = path.join(
    process.cwd(),
    "data",
    "pantavion-source-inventory",
    "inventory.json",
  );

  try {
    const raw = await readFile(inventoryPath, "utf8");
    const inventory = JSON.parse(raw) as unknown;

    return NextResponse.json({
      ok: true,
      route: "/api/pantavion/source-inventory",
      runtime: true,
      source: "data/pantavion-source-inventory/inventory.json",
      inventory,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        route: "/api/pantavion/source-inventory",
        error:
          error instanceof Error
            ? error.message
            : "Pantavion source inventory could not be loaded.",
      },
      { status: 500 },
    );
  }
}