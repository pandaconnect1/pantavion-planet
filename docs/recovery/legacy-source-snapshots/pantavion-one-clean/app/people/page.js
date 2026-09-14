// app/people/page.js
import Link from "next/link";

export const metadata = {
  title: "Pantavion One — People",
};

export default function PeoplePage() {
  return (
    <main className="min-h-screen bg-black text-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <Link href="/" className="text-sm text-emerald-400 hover:underline">
          ← Back to Pantavion One
        </Link>

        <h1 className="text-3xl font-bold">People</h1>

        <p className="text-sm text-gray-400 max-w-xl">
          Global people graph — profiles, connections, roles and journeys of
          every human who joins Pantavion One.
        </p>
      </div>
    </main>
  );
}
