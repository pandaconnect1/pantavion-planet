// app/page.js
import MainNav from "../components/MainNav";
import Hero from "../components/Hero";
import SectionOverview from "../components/SectionOverview";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">
        <MainNav />
        <Hero />
        <SectionOverview />
      </div>
    </main>
  );
}
