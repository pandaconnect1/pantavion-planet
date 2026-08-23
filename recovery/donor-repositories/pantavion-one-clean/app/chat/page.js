// app/chat/page.js
import Link from "next/link";

export const metadata = {
  title: "Pantavion One — Chat",
};

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-black text-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <Link href="/" className="text-sm text-emerald-400 hover:underline">
          ← Back to Pantavion One
        </Link>

        <h1 className="text-3xl font-bold">Chat</h1>

        <p className="text-sm text-gray-400 max-w-xl">
          Conversations, communities and real-time messaging across all
          continents and languages.
        </p>
      </div>
    </main>
  );
}
