import { toNextJsHandler } from "better-auth/next-js";

import { pantavionAuth } from "@/lib/pantavion-auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, POST } = toNextJsHandler(pantavionAuth);
