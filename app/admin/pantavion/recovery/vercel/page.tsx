import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import {
  isPantavionKernelAccessAllowed,
  isPantavionKernelFounderIdentityAllowed,
  PANTAVION_KERNEL_ACCESS_QUERY,
  PANTAVION_KERNEL_FOUNDER_QUERY,
  PANTAVION_KERNEL_SESSION_COOKIE,
} from "@/core/kernel/kernel-access-guard";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;
interface PageProps { searchParams?: Promise<SearchParams>; }

const projects = [
  { name: "pantavion-planet", source: "GitHub: pandaconnect1/pantavion-planet", deployments: "20+ · deep history active", state: "PRESERVE" },
  { name: "pantavion-planet-vmxx", source: "GitHub: pandaconnect1/pantavion-planet", deployments: "20+ · deep history active", state: "PRESERVE" },
  { name: "pantavion-one", source: "GitHub: pandaconnect1/pantavion-one", deployments: "14 captured", state: "PRESERVE" },
  { name: "pantavion-one-clean-98it", source: "GitHub: pandaconnect1/pantavion-one-clean", deployments: "4 captured", state: "PRESERVE" },
  { name: "pantavion-one-clean", source: "GitHub: pandaconnect1/pantavion-one-clean", deployments: "scan pending", state: "FREEZE" },
  { name: "pantaai", source: "GitHub: pandaconnect1/nextjs-ai-chatbot", deployments: "scan pending", state: "FREEZE" },
  { name: "pantavion-one-clean-ui", source: "GitHub: pandaconnect1/pantavion-one-clean-ui", deployments: "scan pending", state: "FREEZE" },
  { name: "v0-new-project-dr8uqvuxfhx", source: "Vercel-only shell", deployments: "0", state: "CONFIG REVIEW" },
  { name: "v0-new-project-cd71xe9esnl", source: "Vercel-only shell", deployments: "0", state: "CONFIG REVIEW" },
  { name: "v0-new-project-0hexy2s8dnt", source: "Vercel-only shell", deployments: "0", state: "CONFIG REVIEW" },
  { name: "pantaai-template", source: "GitHub: pandaconnect1/pantaai-template", deployments: "scan pending", state: "FREEZE" },
  { name: "pantaai-v1-nf17", source: "GitHub: pandaconnect1/pantaai-v1", deployments: "scan pending", state: "FREEZE" },
  { name: "pantaai-v1", source: "GitHub: pandaconnect1/pantaai-v1", deployments: "scan pending", state: "FREEZE" },
  { name: "v0-new-project-81xhfwdrlxy", source: "Vercel-only shell", deployments: "0", state: "CONFIG REVIEW" },
  { name: "nextjs-ai-chatbot", source: "GitHub: pandaconnect1/nextjs-ai-chatbot", deployments: "scan pending", state: "FREEZE" },
] as const;

function firstParam(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function FounderVercelRecoveryPage({ searchParams }: PageProps) {
  const resolved = searchParams ? await searchParams : {};
  const queryToken = firstParam(resolved[PANTAVION_KERNEL_ACCESS_QUERY]) ?? firstParam(resolved[PANTAVION_KERNEL_FOUNDER_QUERY]);
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PANTAVION_KERNEL_SESSION_COOKIE)?.value ?? null;
  const secretAllowed = isPantavionKernelAccessAllowed(queryToken) || isPantavionKernelAccessAllowed(sessionToken);

  if (!secretAllowed || !(await isPantavionKernelFounderIdentityAllowed())) notFound();

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-cyan-300/20 bg-white/[0.03] p-6">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">Founder only · emergency preservation</p>
          <h1 className="mt-2 text-3xl font-black">Vercel Recovery Inventory</h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">Live recovery inventory for the 15 projects currently visible through the connected Vercel account. Nothing shown here is authorized for deletion. PRESERVE/FREEZE remains in force until source, deployment history, non-secret configuration and provenance are secured.</p>
          <div className="mt-4 flex gap-2">
            <a href="/admin/pantavion/recovery" className="rounded-2xl border border-cyan-300/25 px-4 py-2 text-sm font-bold text-cyan-100">Recovery truth</a>
            <a href="/admin/pantavion/intelligence" className="rounded-2xl border border-slate-300/25 px-4 py-2 text-sm font-bold text-slate-100">Intelligence</a>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase text-slate-400">Visible projects</p><p className="mt-2 text-3xl font-black">15</p></article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase text-slate-400">Vercel-only shells</p><p className="mt-2 text-3xl font-black">4</p></article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase text-slate-400">Shells with deployments</p><p className="mt-2 text-3xl font-black">0</p></article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase text-slate-400">Cleanup authorization</p><p className="mt-2 text-lg font-black text-rose-100">NONE</p></article>
        </section>

        <section className="rounded-3xl border border-amber-300/20 bg-amber-300/5 p-5 text-sm leading-6 text-amber-50">
          <p className="font-black">Truth boundary</p>
          <p>This is an evidence surface, not a completion claim. Projects marked CONFIG REVIEW have zero deployments but still require settings/domain/environment review before cleanup. Projects marked scan pending remain frozen.</p>
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-slate-400">
                <tr><th className="px-5 py-4">Project</th><th className="px-5 py-4">Source</th><th className="px-5 py-4">Deployments</th><th className="px-5 py-4">Recovery state</th></tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.name} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-4 font-bold text-white">{project.name}</td>
                    <td className="px-5 py-4 text-slate-300">{project.source}</td>
                    <td className="px-5 py-4 text-slate-300">{project.deployments}</td>
                    <td className="px-5 py-4"><span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-100">{project.state}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
