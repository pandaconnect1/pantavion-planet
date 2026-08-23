// app/create/page.js
import Link from "next/link";

export const metadata = {
  title: "Pantavion One — Create",
};

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-black text-gray-100 p-10">
      <Link
        href="/"
        className="text-sm text-emerald-400 hover:underline inline-block mb-8"
      >
        ← Back to Pantavion One
      </Link>

      <h1 className="text-4xl font-bold text-emerald-400 mb-4">Create</h1>

      <p className="text-lg text-gray-300 max-w-2xl">
        Το Create είναι το στούντιο του Pantavion One: ιδέες, projects,
        περιεχόμενο, media και εργαλεία για να χτίζεις και να μοιράζεσαι
        ό,τι φαντάζεσαι με τον κόσμο.
      </p>
    </main>
  );
}
