export function requireAal2Assurance(level: string | null | undefined) {
  if (level !== "aal2") throw new Error("aal2_required");
  return "aal2" as const;
}
