import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { PANTAVION_SOS_KERNEL_TASK } from "@/core/sos/pantavion-sos-kernel-lane";

export type PantavionKernelControlPlaneSnapshot = {
  marker: "pantavion_kernel_control_plane_snapshot_v1";
  status: "operational";
  durableExecution: {
    backend: "supabase";
    totalRecords: number;
  };
  sos: {
    lane: "sos";
    priority: "critical";
    intakeTaskName: typeof PANTAVION_SOS_KERNEL_TASK;
    durableIntakeRecords: number;
    latestIntakeAt: string | null;
    externalAuthorityDispatch: "not_claimed";
  };
  checkedAt: string;
};

export async function getPantavionKernelControlPlaneSnapshot(): Promise<PantavionKernelControlPlaneSnapshot> {
  const admin = createAdminClient();

  const [durableTotal, sosTotal, latestSos] = await Promise.all([
    admin.from("durable_executions").select("execution_id", { count: "exact", head: true }),
    admin
      .from("durable_executions")
      .select("execution_id", { count: "exact", head: true })
      .eq("task_name", PANTAVION_SOS_KERNEL_TASK),
    admin
      .from("durable_executions")
      .select("updated_at")
      .eq("task_name", PANTAVION_SOS_KERNEL_TASK)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (durableTotal.error) throw durableTotal.error;
  if (sosTotal.error) throw sosTotal.error;
  if (latestSos.error) throw latestSos.error;

  return {
    marker: "pantavion_kernel_control_plane_snapshot_v1",
    status: "operational",
    durableExecution: {
      backend: "supabase",
      totalRecords: durableTotal.count ?? 0,
    },
    sos: {
      lane: "sos",
      priority: "critical",
      intakeTaskName: PANTAVION_SOS_KERNEL_TASK,
      durableIntakeRecords: sosTotal.count ?? 0,
      latestIntakeAt:
        latestSos.data && typeof latestSos.data.updated_at === "string"
          ? latestSos.data.updated_at
          : null,
      externalAuthorityDispatch: "not_claimed",
    },
    checkedAt: new Date().toISOString(),
  };
}
