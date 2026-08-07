import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdsDirectoryPage() {
  const supabase = await createClient();
  const { data: ads, error } = await supabase
    .from("active_pantavion_ads")
    .select("campaign_id,advertiser_name,creative_id,headline,body,media_url,call_to_action,sponsored_label,destination_url,country_code,audience_age_band,starts_at,ends_at")
    .eq("surface", "ads_directory")
    .order("starts_at", { ascending: false, nullsFirst: false });

  return (
    <main style={{ minHeight: "100vh", background: "#f5f8fc", color: "#10233f", padding: 20 }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 26 }}>
          <div>
            <p style={{ margin: 0, color: "#1769aa", fontWeight: 900, letterSpacing: ".12em", fontSize: 12 }}>PANTAVION ADS DIRECTORY</p>
            <h1 style={{ margin: "8px 0", fontSize: "clamp(36px,5vw,60px)" }}>Advertisers live here. Only here.</h1>
            <p style={{ maxWidth: 800, margin: 0, color: "#60758c", lineHeight: 1.6 }}>
              This is Pantavion&apos;s dedicated paid-advertising area. Regular Pantavion pages do not accept third-party advertising inventory or external ad-network placements.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/business/ads" style={buttonStyle}>Advertise with Pantavion</Link>
            <Link href="/social-core" style={buttonStyle}>Social World</Link>
          </div>
        </header>

        <section style={{ background: "#10233f", color: "white", borderRadius: 22, padding: 20, marginBottom: 24 }}>
          <strong>Transparency rule</strong>
          <p style={{ margin: "8px 0 0", lineHeight: 1.55, opacity: .92 }}>
            Every item below must be a Pantavion-direct, verified, paid and approved advertisement. External ad networks and third-party ad SDK inventory are not eligible.
          </p>
        </section>

        {error ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Ads Directory is not active yet</h2>
            <p style={{ color: "#60758c", lineHeight: 1.55, marginBottom: 0 }}>
              The interface is ready, but the Ads database migrations still need to be applied to the connected Supabase project before approved campaigns can appear here.
            </p>
          </section>
        ) : (ads || []).length === 0 ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>No approved advertisements yet</h2>
            <p style={{ color: "#60758c", lineHeight: 1.55, marginBottom: 0 }}>
              Only campaigns that complete Pantavion verification, agreement, payment and approval are published in this directory.
            </p>
          </section>
        ) : (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
            {(ads || []).map((ad: any) => (
              <article key={`${ad.campaign_id}-${ad.creative_id}`} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".08em", color: "#1769aa" }}>{ad.sponsored_label || "Sponsored"}</span>
                  {ad.country_code ? <span style={{ fontSize: 12, color: "#71849a" }}>{ad.country_code}</span> : null}
                </div>
                {ad.media_url ? <img src={ad.media_url} alt="" style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 14, marginBottom: 14 }} /> : null}
                <div style={{ color: "#60758c", fontSize: 13, fontWeight: 800 }}>{ad.advertiser_name}</div>
                <h2 style={{ margin: "7px 0 9px" }}>{ad.headline}</h2>
                <p style={{ color: "#40566e", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{ad.body}</p>
                {ad.destination_url ? (
                  <a href={ad.destination_url} rel="nofollow sponsored noopener noreferrer" target="_blank" style={primaryLinkStyle}>
                    {ad.call_to_action || "Learn more"}
                  </a>
                ) : null}
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

const cardStyle = {
  background: "white",
  border: "1px solid #dde7f1",
  borderRadius: 20,
  padding: 18,
} as const;

const buttonStyle = {
  textDecoration: "none",
  fontWeight: 900,
  color: "#1769aa",
  background: "white",
  border: "1px solid #d7e4f1",
  borderRadius: 12,
  padding: "10px 13px",
} as const;

const primaryLinkStyle = {
  display: "inline-block",
  marginTop: 8,
  textDecoration: "none",
  background: "#1267d6",
  color: "white",
  fontWeight: 900,
  padding: "11px 14px",
  borderRadius: 12,
} as const;
