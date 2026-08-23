// components/Hero.js
export default function Hero() {
  return (
    <section className="pv-container py-10 space-y-6">
      <p className="text-xs font-medium tracking-[0.25em] text-emerald-400 uppercase">
        Pantavion One
      </p>

      <h1 className="text-4xl md:text-5xl font-bold leading-tight">
        One Platform. <span className="text-emerald-400">All Life.</span>
        <br />
        <span className="text-slate-300 text-3xl md:text-4xl">For All Humanity.</span>
      </h1>

      <p className="max-w-xl text-sm md:text-base text-slate-300">
        A unified, global hub for everyone — connecting Pulse, People, Chat, Voice,
        Elite, Compass, Mind, and Create into one timeless platform for all
        generations.
      </p>
    </section>
  );
}
