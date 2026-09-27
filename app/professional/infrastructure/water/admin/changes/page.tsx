import Link from "next/link";

import WaterChangeReviewClient from "./water-change-review-client";

export const metadata = {
  title: "Pantavion Water — Field Change Review",
  description:
    "Founder/admin review for water spatial patches, field photos and evidence pins.",
};

export default function WaterAdminChangesPage() {
  return (
    <main className="min-h-screen bg-[#06101f] px-4 py-6 text-white">
      <section className="mx-auto w-full max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/professional/infrastructure/water/admin/approvals"
            className="text-sm font-black text-[#f2c766]"
          >
            ← Water Admin Approvals
          </Link>

          <Link
            href="/professional/infrastructure/water/maps"
            className="rounded-xl border border-white/20 px-3 py-2 text-xs font-black"
          >
            3 Source Maps
          </Link>
        </div>

        <WaterChangeReviewClient />
      </section>
    </main>
  );
}
