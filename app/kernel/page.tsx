import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import {
  isPantavionKernelAccessAllowed,
  isPantavionKernelFounderIdentityAllowed,
  PANTAVION_KERNEL_ACCESS_QUERY,
  PANTAVION_KERNEL_FOUNDER_QUERY,
  PANTAVION_KERNEL_SESSION_COOKIE,
} from "@/core/kernel/kernel-access-guard";

import CanonicalMaterializationClient from "./canonical-materialization-client";
import KernelLivePanelClient from "./kernel-live-panel-client";

export const dynamic = "force-dynamic";

type KernelPageSearchParams = Record<string, string | string[] | undefined>;

interface KernelPageProps {
  searchParams?: Promise<KernelPageSearchParams>;
}

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function KernelPage({ searchParams }: KernelPageProps) {
  const resolvedSearchParams: KernelPageSearchParams = searchParams ? await searchParams : {};

  const queryToken =
    firstParam(resolvedSearchParams[PANTAVION_KERNEL_ACCESS_QUERY]) ??
    firstParam(resolvedSearchParams[PANTAVION_KERNEL_FOUNDER_QUERY]);

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PANTAVION_KERNEL_SESSION_COOKIE)?.value ?? null;
  const secretAllowed =
    isPantavionKernelAccessAllowed(queryToken) ||
    isPantavionKernelAccessAllowed(sessionToken);

  if (!secretAllowed || !(await isPantavionKernelFounderIdentityAllowed())) {
    notFound();
  }

  return (
    <>
      <div className="bg-[#05070d] px-5 pt-6 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-3">
          <a
            href="/admin/pantavion/intelligence"
            className="rounded-2xl border border-violet-300/40 bg-violet-300/10 px-5 py-3 text-sm font-black text-violet-100"
          >
            Strategic Intelligence
          </a>
          <a
            href="/kernel/artifact-upload"
            className="rounded-2xl border border-cyan-300/40 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100"
          >
            Universal Artifact Intake
          </a>
          <a
            href="/kernel/demand-radar"
            className="rounded-2xl border border-emerald-300/40 bg-emerald-300/10 px-5 py-3 text-sm font-black text-emerald-100"
          >
            Global Human Demand Radar
          </a>
        </div>
      </div>
      <CanonicalMaterializationClient />
      <KernelLivePanelClient />
    </>
  );
}
