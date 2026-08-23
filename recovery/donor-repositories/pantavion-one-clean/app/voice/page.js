// app/voice/page.js
import Link from "next/link";

export const metadata = {
  title: "Pantavion One — Voice",
};

export default function VoicePage() {
  return (
    <main className="min-h-screen bg-black text-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <Link href="/" className="text-sm text-emerald-400 hover:underline">
          ← Back to Pantavion One
        </Link>

        <h1 className="text-3xl font-bold">Voice</h1>

        <p className="text-sm text-gray-400 max-w-xl">
          Hands-free translator and voice calls — speak in your language, be
          heard in theirs.
        </p>
      </div>
    </main>
  );
}
