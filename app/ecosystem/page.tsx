import Link from "next/link";

export const metadata = {
  title: "Explore Pantavion | Pantavion One",
  description: "Explore the main Pantavion worlds and services in a clear human-facing directory.",
};

const worlds = [
  { title: "People & Social", body: "People, profiles, connection requests and private communication.", href: "/people" },
  { title: "Communication", body: "Messages and multilingual communication through the shared Pantavion communication core.", href: "/messages" },
  { title: "Translation", body: "Text translation and interpreter tools with the same language choice across Pantavion.", href: "/translate" },
  { title: "Work & Services", body: "Jobs, professional services, business discovery and practical work tools.", href: "/build-services" },
  { title: "Market & Listings", body: "Classifieds, services, property, events, jobs and marketplace offers.", href: "/listings" },
  { title: "News, Sports & Media", body: "News, sports, radio, podcasts, channels, events and public media.", href: "/media" },
  { title: "Knowledge & Learning", body: "Learning, libraries, culture, research and language knowledge." },
  { title: "Maps, Travel & Local Life", body: "Places, travel, local services, city information and everyday discovery." },
  { title: "Safety & SOS", body: "Safety information, crisis support, alerts and resilient communication paths.", href: "/sos" },
  { title: "Business", body: "Business presence, listings, promotion, services and commercial tools.", href: "/market" },
  { title: "Professional Areas", body: "Protected work environments for approved professional and institutional users.", href: "/professional/infrastructure/water" },
];

const shell = {
  minHeight: "100vh",
  color: "#fff7e8",
  background:
    "radial-gradient(circle at 75% 10%, rgba(232,185,79,.16), transparent 32rem), radial-gradient(circle at 15% 20%, rgba(57,214,255,.14), transparent 34rem), linear-gradient(135deg,#020712,#06111f 52%,#071a2d)",
};

const card = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(7,18,33,.74)",
  boxShadow: "0 24px 80px rgba(0,0,0,.25)",
};

export default function EcosystemPage() {
  return (
    <main style={shell} data-pantavion-static-ui="true">
      <section style={{ width: "min(1180px, calc(100% - 40px))", margin: "0 auto", padding: "48px 0 96px" }}>
        <Link href="/" style={{ color: "#f3c454", textDecoration: "none", fontWeight: 900 }}>← Home</Link>

        <p style={{ marginTop: 34, color: "#f3c454", letterSpacing: ".24em", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>Explore Pantavion</p>
        <h1 style={{ margin: "8px 0 0", maxWidth: 900, fontSize: "clamp(42px,7vw,78px)", lineHeight: .98, letterSpacing: "-.05em" }}>One place. Many parts of everyday life.</h1>
        <p style={{ maxWidth: 860, color: "#c7d4df", fontSize: 20, lineHeight: 1.65 }}>Choose what you need. Working areas open real Pantavion services; areas still being completed are shown as information rather than dead buttons.</p>

        <section style={{ marginTop: 42 }}>
          <h2 style={{ fontSize: 34, marginBottom: 18 }}>Main areas</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16 }}>
            {worlds.map((world) => {
              const content = (
                <>
                  <h3 style={{ margin: 0, color: "#f3c454", fontSize: 22 }}>{world.title}</h3>
                  <p style={{ marginBottom: 0, color: "#c7d4df", lineHeight: 1.6 }}>{world.body}</p>
                  <p style={{ marginBottom: 0, color: "#8fb8dc", fontWeight: 800 }}>{world.href ? "Open →" : "In development"}</p>
                </>
              );
              return world.href ? (
                <Link key={world.title} href={world.href} style={{ ...card, color: "inherit", textDecoration: "none" }}>{content}</Link>
              ) : (
                <article key={world.title} style={card}>{content}</article>
              );
            })}
          </div>
        </section>

        <section style={{ marginTop: 42, ...card }}>
          <h2 style={{ marginTop: 0, fontSize: 30 }}>Your language follows you</h2>
          <p style={{ color: "#c7d4df", lineHeight: 1.7, marginBottom: 0 }}>Choose a language once from the globe button. Pantavion keeps that choice as you move between areas. You can use automatic device language or change it manually at any time.</p>
        </section>
      </section>
    </main>
  );
}
