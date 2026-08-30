export function createScheduledRunKey(
  workerName: string,
  now = new Date(),
  bucketMinutes = 60,
) {
  const cleanWorkerName = workerName.trim();
  if (!cleanWorkerName) throw new Error("scheduled_worker_name_required");
  if (
    !Number.isInteger(bucketMinutes) ||
    bucketMinutes < 1 ||
    bucketMinutes > 60 ||
    60 % bucketMinutes !== 0
  ) {
    throw new Error("scheduled_worker_bucket_minutes_invalid");
  }
  if (Number.isNaN(now.getTime())) throw new Error("scheduled_worker_time_invalid");

  const iso = now.toISOString();
  if (bucketMinutes === 60) {
    return `${cleanWorkerName}:${iso.slice(0, 13)}`;
  }

  const bucketMinute = Math.floor(now.getUTCMinutes() / bucketMinutes) * bucketMinutes;
  return `${cleanWorkerName}:${iso.slice(0, 13)}:${String(bucketMinute).padStart(2, "0")}`;
}
