import type { PantavionIntake } from "../../types/pantavion";
import { processKernelIntake } from "./kernel";
import { unifyPantavionEcosystems, type EcosystemUnificationInput } from "../pantaai/ecosystem/ecosystem-unification-kernel";

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function processEcosystemUnificationThroughKernel(
  input: EcosystemUnificationInput = {},
) {
  const ecosystem = unifyPantavionEcosystems(input);

  const intake: PantavionIntake = {
    id: createId("ecosystem"),
    title: "Pantavion ecosystem unification",
    content:
      "Unify global AI, coding, RAG, workflow, Google full-stack, China super-app, seven-continent, creator, translation, cloud, and protected domain ecosystems into Pantavion-owned kernel capabilities.",
    truthZone: "deterministic",
    sensitivity: "internal",
    domainHint: "kernel",
    intentHint: "ecosystem_unification",
    sender: {
      id: "pantavion-autonomous-kernel",
      type: "system",
      scopes: ["read", "write", "execute", "policy", "ops"],
    },
    metadata: {
      ecosystemSignals: ecosystem.selectedSignals.length,
      continentLayers: ecosystem.continents.length,
      kernelFamilies: ecosystem.kernelFamilies.length,
      marker: "pantavion_ecosystem_unification_bridge_c2_v1",
    },
  };

  const kernel = processKernelIntake(intake);

  return {
    ok: ecosystem.ok && kernel.policy.allowed,
    ecosystem,
    kernel,
  };
}

export const pantavion_ecosystem_unification_bridge_marker_v1 =
  "pantavion_ecosystem_unification_bridge_c2_v1";
