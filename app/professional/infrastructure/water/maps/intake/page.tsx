import WaterUniversalMapUploader from "./water-universal-map-uploader";

export const dynamic = "force-dynamic";

export default function WaterMapIntakePage() {
  return (
    <main className="min-h-screen bg-[#050b14] px-3 py-5 text-white sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl">
        <WaterUniversalMapUploader />
      </section>
    </main>
  );
}
