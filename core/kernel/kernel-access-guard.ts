export const PANTAVION_KERNEL_ACCESS_QUERY = "kernelToken";

export interface PantavionKernelAccessDeniedReport {
  ok: false;
  marker: "pantavion_kernel_access_denied_v1";
  status: "restricted";
  message: "Kernel control routes are internal and require founder authorization.";
  publicSafe: true;
}

export function isPantavionKernelAccessAllowed(token?: string | null): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  const requiredToken = process.env.PANTAVION_KERNEL_PANEL_TOKEN;

  if (!requiredToken || requiredToken.length < 12) return false;

  return token === requiredToken;
}

export function createPantavionKernelAccessDeniedReport(): PantavionKernelAccessDeniedReport {
  return {
    ok: false,
    marker: "pantavion_kernel_access_denied_v1",
    status: "restricted",
    message: "Kernel control routes are internal and require founder authorization.",
    publicSafe: true,
  };
}
