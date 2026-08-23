// app/mind/page.js
import Link from "next/link";

export const metadata = {
  title: "Pantavion One — Mind",
};

export default function MindPage() {
  return (
    <main className="min-h-screen bg-black text-gray-100 p-10">
      <Link
        href="/"
        className="text-sm text-emerald-400 hover:underline inline-block mb-8"
      >
        ← Back to Pantavion One
      </Link>

      <h1 className="text-4xl font-bold text-emerald-400 mb-4">Mind</h1>

      <p className="text-lg text-gray-300 max-w-2xl">
        Το Mind είναι ο χώρος της γνώσης, της σκέψης και της ψυχικής ισορροπίας:
        βιβλιοθήκες, σημειώσεις, έρευνα, αυτοβελτίωση και AI–βοήθεια για να
        οργανώνεις το μυαλό σου.
      </p>
    </main>
  );
}
