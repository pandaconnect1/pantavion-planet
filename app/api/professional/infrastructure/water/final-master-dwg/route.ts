import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { get } from "@vercel/blob";
import {
  FINAL_MASTER_DWG_BLOB_URL,
  FINAL_MASTER_DWG_FILE_NAME,
  FINAL_MASTER_DWG_SIZE_BYTES,
  FINAL_MASTER_DWG_SHA256,
} from "@/core/water/final-master-dwg-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOCAL_DWG_PATH = path.join(
  process.cwd(),
  "data",
  "water-network-private",
  "source-masters",
  "master-b-c-final",
  "GEORGE_MAP_MASTER_B_C_FINAL.dwg"
);

function headers() {
  return {
    "Content-Type": "application/acad",
    "Content-Disposition": `attachment; filename="${FINAL_MASTER_DWG_FILE_NAME}"`,
    "Cache-Control": "private, no-store",
    "X-Pantavion-File-Type": "original-dwg",
    "X-Pantavion-Source": "GEORGE_MAP_MASTER_B_C_FINAL",
    "X-Pantavion-Size-Bytes": String(FINAL_MASTER_DWG_SIZE_BYTES),
    "X-Pantavion-SHA256": FINAL_MASTER_DWG_SHA256,
  };
}

export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.PANTAVION_BLOB_READ_WRITE_TOKEN;

  if (token && FINAL_MASTER_DWG_BLOB_URL) {
    const blob = await get(FINAL_MASTER_DWG_BLOB_URL, {
      access: "private",
      token,
    });

  if (blob?.stream) {
    return new Response(blob.stream as unknown as BodyInit, {
        status: 200,
        headers: headers(),
      });
    }
  }

  if (fs.existsSync(LOCAL_DWG_PATH)) {
    const stream = Readable.toWeb(fs.createReadStream(LOCAL_DWG_PATH));

    return new Response(stream as BodyInit, {
      status: 200,
      headers: headers(),
    });
  }

  return Response.json(
    {
      ok: false,
      status: "original_dwg_not_available",
      fileName: FINAL_MASTER_DWG_FILE_NAME,
    },
    { status: 404 }
  );
}
