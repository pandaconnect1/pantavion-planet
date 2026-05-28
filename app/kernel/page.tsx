import { notFound } from "next/navigation";

import {
  isPantavionKernelAccessAllowed,
  PANTAVION_KERNEL_ACCESS_QUERY,
} from "@/core/kernel/kernel-access-guard";

import { KernelLivePanelClient } from "./kernel-live-panel-client";

export const dynamic = "force-dynamic";

type KernelPageSearchParams = Record<string, string | string[] | undefined>;

interface KernelPageProps {
  searchParams?: Promise<KernelPageSearchParams>;
}

export default async function KernelPage({ searchParams }: KernelPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rawToken = resolvedSearchParams[PANTAVION_KERNEL_ACCESS_QUERY];
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  if (!isPantavionKernelAccessAllowed(token ?? null)) {
    notFound();
  }

  return <KernelLivePanelClient />;
}
