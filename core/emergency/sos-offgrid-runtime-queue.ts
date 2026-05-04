/**
 * Pantavion SOS Off-grid Runtime Queue
 *
 * Defines runtime queue rules for online, weak network, offline, and
 * provider-supported future states.
 */

export const pantavionSosOffgridRuntimeQueueId =
  "pantavion_sos_offgrid_runtime_queue_v1";

export const pantavionSosQueuePhases = [
  {
    id: "create_local_packet",
    meaning:
      "Create SOS packet locally even if network/provider dispatch is unavailable.",
  },
  {
    id: "store_offline",
    meaning:
      "Store packet on device where browser storage is available and consent allows.",
  },
  {
    id: "surface_local_actions",
    meaning:
      "Offer call, SMS handler, share, copy, download, beacon, sound, vibration, and map when supported.",
  },
  {
    id: "detect_reconnect",
    meaning:
      "When network returns, attempt replay through configured backend/provider.",
  },
  {
    id: "record_result",
    meaning:
      "Store delivered, failed, queued, unavailable, or provider-pending result state.",
  },
] as const;

export const pantavionSosQueueSafetyLimits = [
  "Local queue is not guaranteed delivery.",
  "Browser storage can be cleared by device/user/browser policy.",
  "Offline queue cannot contact anyone until connection or local handler exists.",
  "Queue replay must avoid spam and provider abuse.",
  "Protected-user data must remain minimal and consent-bound.",
] as const;

export const pantavionSosQueueFutureUpgrades = [
  "encrypted_local_queue",
  "indexeddb_storage",
  "background_sync_pwa",
  "push_delivery_receipts",
  "provider_retry_policy",
  "admin_event_store",
  "device_satellite_provider_bridge",
] as const;

export function getPantavionSosOffgridRuntimeQueue() {
  return {
    id: pantavionSosOffgridRuntimeQueueId,
    phases: pantavionSosQueuePhases,
    safetyLimits: pantavionSosQueueSafetyLimits,
    futureUpgrades: pantavionSosQueueFutureUpgrades,
  };
}
