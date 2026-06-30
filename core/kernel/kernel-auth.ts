import { timingSafeEqual } from "crypto";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
}

export type KernelAuthResult =
  | {
      ok: true;
      actor: string;
      warning?: string;
    }
  | {
      ok: false;
      statusCode: number;
      error: string;
    };

export function verifyKernelRequest(request: Request): KernelAuthResult {
  const secret = process.env.PANTAVION_KERNEL_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProduction) {
      return {
        ok: false,
        statusCode: 401,
        error: "PANTAVION_KERNEL_SECRET is required in production.",
      };
    }

    return {
      ok: true,
      actor: "local-dev",
      warning: "PANTAVION_KERNEL_SECRET is not configured. Local development only.",
    };
  }

  const incoming = request.headers.get("x-pantavion-kernel-secret")?.trim();

  if (!incoming || !safeEqual(incoming, secret)) {
    return {
      ok: false,
      statusCode: 401,
      error: "Invalid kernel secret.",
    };
  }

  return {
    ok: true,
    actor: request.headers.get("x-pantavion-actor")?.trim() || "kernel-authorized",
  };
}
