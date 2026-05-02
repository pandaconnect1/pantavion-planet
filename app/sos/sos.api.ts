import type {
  PantavionSosDispatchResult,
  PantavionSosPacket,
} from "@/types/pantavion-sos";

export async function dispatchSos(
  packet: PantavionSosPacket
): Promise<PantavionSosDispatchResult> {
  const response = await fetch("/api/sos/dispatch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(packet),
  });

  return (await response.json()) as PantavionSosDispatchResult;
}
