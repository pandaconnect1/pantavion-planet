import { NextResponse } from "next/server";
import { getAgentRegistry, planTask } from "@/core/agents/orchestrator";

export const dynamic = "force-dynamic";

export async function GET() {
  const agents = getAgentRegistry();
  const demonstration = planTask({
    id: "demo-foundation-task",
    title: "Plan, implement and review a normal Pantavion feature",
    requiredCapabilities: ["plan", "implement", "review-code", "security-review"],
    criticality: "sensitive"
  });

  return NextResponse.json({
    ok: true,
    service: "pantavion-agent-orchestrator",
    timestamp: new Date().toISOString(),
    summary: {
      total: agents.length,
      available: agents.filter((agent) => agent.status === "available").length,
      configured: agents.filter((agent) => agent.status === "configured").length,
      blocked: agents.filter((agent) => agent.status === "blocked").length
    },
    agents: agents.map(({ id, role, capabilities, provider, status, canWriteCode, canDeploy, requiresHumanApproval }) => ({
      id,
      role,
      capabilities,
      provider,
      status,
      canWriteCode,
      canDeploy,
      requiresHumanApproval
    })),
    demonstration: {
      taskId: demonstration.taskId,
      assignedAgentIds: demonstration.assignedAgents.map((agent) => agent.id),
      missingCapabilities: demonstration.missingCapabilities,
      approvals: demonstration.approvals,
      executable: demonstration.executable
    }
  });
}
