import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import {
  isPantavionKernelAccessAllowed,
  isPantavionKernelFounderIdentityAllowed,
  PANTAVION_KERNEL_ACCESS_QUERY,
  PANTAVION_KERNEL_FOUNDER_QUERY,
  PANTAVION_KERNEL_SESSION_COOKIE,
} from "@/core/kernel/kernel-access-guard";

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

  return <KernelLivePanelClient />;
}
