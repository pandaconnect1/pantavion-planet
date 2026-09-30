import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Founder commands are intentionally entered through the private ChatGPT
 * control channel, not through a Pantavion user-facing page. The durable
 * agenda/control APIs remain server-side; this route is deliberately hidden.
 */
export default function FounderAgendaPage() {
  notFound();
}
