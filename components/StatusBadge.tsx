import { statusLabel, type PantavionStatus } from "@/core/platform/pantavion-registry";

export function StatusBadge({ status }: { status: PantavionStatus }) {
  const className =
    status === "live-foundation"
      ? "pv-status"
      : status === "regulated-required"
        ? "pv-status red"
        : "pv-status gold";

  return <span className={className}>{statusLabel(status)}</span>;
}
