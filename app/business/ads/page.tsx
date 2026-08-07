import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdvertiser, createAdRequest, sendAdRequestMessage } from "./actions";

const SURFACES = ["feed", "marketplace", "business", "search", "events", "communities"] as const;

function money(cents: number | null | undefined, currency = "EUR") {
  if (cents == null) return "Custom quote";
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(cents / 100);
}

export default async function AdsCenterPage({ searchParams }: { searchParams: Promise<{ request?: string; error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/business/ads");

  const { data: advertisers } = await supabase
    .from("pantavion_advertisers")
    .select("id,display_name,legal_name,country_code,verification_status")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const advertiserIds = (advertisers || []).map((item: any) => item.id);
  const { data: requests } = advertiserIds.length
    ? await supabase
        .from("pantavion_ad_requests")
        .select("id,title,objective,status,budget_cents,currency,requested_surfaces,target_countries,created_at,advertiser_id")
        .in("advertiser_id", advertiserIds)
        .order("created_at", { ascending: false })
    : { data: [] as any[] };

  const requestIds = (requests || []).map((item: any) => item.id);
  const { data: quotes } = requestIds.length
    ? await supabase
        .from("pantavion_ad_quotes")
        .select("id,request_id,version,amount_cents,currency,description,valid_until,status,created_at")
        .in("request_id", requestIds)
        .order("version", { ascending: false })
    : { data: [] as any[] };

  const activeRequestId = params.request || requests?.[0]?.id;
  const { data: messages } = activeRequestId
    ? await supabase
        .from("pantavion_ad_request_messages")
        .select("id,request_id,sender_id,body,created_at")
        .eq("request_id", activeRequestId)
        .order("created_at", { ascending: true })
    : { data: [] as any[] };

  const { data: rateCards } = await supabase
    .from("pantavion_ad_rate_cards")
    .select("id,code,name,description,surface,billing_model,base_price_cents,currency,minimum_days")
    .eq("is_active", true)
    .order("base_price_cents", { ascending: true });

  const activeRequest = (requests || []).find((item: any) => item.id === activeRequestId);
  const activeQuotes = (quotes || []).filter((item: any) => item.request_id === activeRequestId);

  return (
    <main style={{ minHeight: "100vh", background: "#f5f8fc", color: "#10233f", padding: 20 }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 24 }}>
          <div>
            <p style={{ margin: 0, color: "#1769aa", fontWeight: 900, letterSpacing: ".12em", fontSize: 12 }}>PANTAVION ADS CENTER</p>
            <h1 style={{ margin: "8px 0 8px", fontSize: "clamp(36px,5vw,58px)" }}>Advertise directly with Pantavion</h1>
            <p style={{ maxWidth: 760, margin: 0, color: "#60758c", lineHeight: 1.6 }}>
              No external ad networks. Every campaign is sold by Pantavion, discussed with our team, priced transparently, paid, reviewed and approved before it can run.
            </p>
          </div>
          <Link href="/social-core" style={{ textDecoration: "none", fontWeight: 900, color: "#1769aa" }}>← Social World</Link>
        </header>

        {params.error ? <div style={{ background: "#fff1f1", border: "1px solid #f2bbbb", padding: 14, borderRadius: 14, marginBottom: 16 }}>{params.error}</div> : null}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12, marginBottom: 24 }}>
          {["1. Request", "2. Discuss", "3. Quote", "4. Pay", "5. Approve", "6. Publish"].map((step) => (
            <div key={step} style={{ background: "white", border: "1px solid #dde7f1", borderRadius: 16, padding: 14, fontWeight: 900 }}>{step}</div>
          ))}
        </section>

        <section style={{ background: "#10233f", color: "white", borderRadius: 22, padding: 20, marginBottom: 24 }}>
          <h2 style={{ marginTop: 0 }}>Non-negotiable rules</h2>
          <div style={{ display: "grid", gap: 8, lineHeight: 1.55, opacity: .94 }}>
            <div>• No Google Ads, Meta Audience Network, Temu feed, affiliate ad network or other third-party ad inventory.</div>
            <div>• A brand such as Temu may advertise only as a direct Pantavion customer after verification, agreement, payment and approval.</div>
            <div>• Sponsored content is clearly labelled.</div>
            <div>• No targeted advertising to children.</div>
            <div>• Pantavion can reject, suspend or require changes to unsafe, misleading, illegal or non-compliant campaigns.</div>
          </div>
        </section>

        {(rateCards || []).length > 0 ? (
          <section style={{ marginBottom: 24 }}>
            <h2>Current rate card</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12 }}>
              {(rateCards || []).map((rate: any) => (
                <article key={rate.id} style={{ background: "white", border: "1px solid #dde7f1", borderRadius: 18, padding: 16 }}>
                  <strong>{rate.name}</strong>
                  <p style={{ color: "#60758c", minHeight: 42 }}>{rate.description || rate.surface}</p>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>{money(rate.base_price_cents, rate.currency)}</div>
                  <div style={{ marginTop: 5, color: "#71849a", fontSize: 13 }}>{rate.billing_model}{rate.minimum_days ? ` · minimum ${rate.minimum_days} days` : ""}</div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section style={{ background: "white", border: "1px solid #dde7f1", borderRadius: 18, padding: 18, marginBottom: 24 }}>
            <strong>Pricing is managed by Pantavion.</strong>
            <p style={{ marginBottom: 0, color: "#60758c" }}>Until the official rate card is published, campaigns use a custom quote agreed between the advertiser and Pantavion.</p>
          </section>
        )}

        {(advertisers || []).length === 0 ? (
          <section style={{ background: "white", border: "1px solid #dde7f1", borderRadius: 22, padding: 20 }}>
            <h2>Create advertiser profile</h2>
            <form action={createAdvertiser} style={{ display: "grid", gap: 12, maxWidth: 640 }}>
              <input name="displayName" required minLength={2} maxLength={160} placeholder="Brand / advertiser name" style={inputStyle} />
              <input name="legalName" maxLength={200} placeholder="Legal company name (optional)" style={inputStyle} />
              <input name="countryCode" maxLength={2} placeholder="Country code, e.g. CY" style={inputStyle} />
              <button type="submit" style={primaryButton}>Create advertiser profile</button>
            </form>
          </section>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(300px,430px) 1fr", gap: 18 }}>
            <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
              <section style={{ background: "white", border: "1px solid #dde7f1", borderRadius: 22, padding: 18 }}>
                <h2 style={{ marginTop: 0 }}>New campaign request</h2>
                <form action={createAdRequest} style={{ display: "grid", gap: 11 }}>
                  <select name="advertiserId" required style={inputStyle} defaultValue={advertisers?.[0]?.id}>
                    {(advertisers || []).map((advertiser: any) => <option key={advertiser.id} value={advertiser.id}>{advertiser.display_name} · {advertiser.verification_status}</option>)}
                  </select>
                  <input name="title" required minLength={2} maxLength={180} placeholder="Campaign title" style={inputStyle} />
                  <textarea name="objective" required minLength={2} maxLength={2000} placeholder="What do you want to promote and what result do you want?" rows={5} style={inputStyle} />
                  <fieldset style={{ border: "1px solid #d7e2ed", borderRadius: 14, padding: 12 }}>
                    <legend style={{ fontWeight: 900 }}>Where should it appear?</legend>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {SURFACES.map((surface) => <label key={surface} style={{ textTransform: "capitalize" }}><input type="checkbox" name="surface" value={surface} /> {surface}</label>)}
                    </div>
                  </fieldset>
                  <input name="countries" placeholder="Target countries: CY, GR, AE" style={inputStyle} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input name="start" type="date" style={inputStyle} />
                    <input name="end" type="date" style={inputStyle} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 10 }}>
                    <input name="budget" inputMode="decimal" placeholder="Preferred budget" style={inputStyle} />
                    <select name="currency" defaultValue="EUR" style={inputStyle}><option>EUR</option><option>USD</option><option>GBP</option></select>
                  </div>
                  <button type="submit" style={primaryButton}>Send request to Pantavion</button>
                </form>
              </section>

              <section style={{ background: "white", border: "1px solid #dde7f1", borderRadius: 22, padding: 18 }}>
                <h2 style={{ marginTop: 0 }}>Your requests</h2>
                <div style={{ display: "grid", gap: 8 }}>
                  {(requests || []).length === 0 ? <p style={{ color: "#60758c" }}>No requests yet.</p> : (requests || []).map((request: any) => (
                    <Link key={request.id} href={`/business/ads?request=${request.id}`} style={{ textDecoration: "none", color: "inherit", background: request.id === activeRequestId ? "#eaf4ff" : "#f7f9fc", border: "1px solid #e2eaf2", padding: 12, borderRadius: 14 }}>
                      <strong>{request.title}</strong>
                      <div style={{ fontSize: 13, color: "#64798e", marginTop: 4 }}>{request.status} · {money(request.budget_cents, request.currency)}</div>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <section style={{ background: "white", border: "1px solid #dde7f1", borderRadius: 22, minHeight: 620, overflow: "hidden" }}>
              {activeRequest ? (
                <>
                  <div style={{ padding: 18, borderBottom: "1px solid #e4ebf3" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div><strong style={{ fontSize: 20 }}>{activeRequest.title}</strong><div style={{ color: "#657a90", marginTop: 4 }}>{activeRequest.status}</div></div>
                      <div style={{ fontWeight: 900 }}>{money(activeRequest.budget_cents, activeRequest.currency)}</div>
                    </div>
                    <p style={{ color: "#40566e", lineHeight: 1.55 }}>{activeRequest.objective}</p>
                  </div>

                  <div style={{ padding: 18, borderBottom: "1px solid #e4ebf3" }}>
                    <h3 style={{ marginTop: 0 }}>Pantavion quote</h3>
                    {activeQuotes.length === 0 ? <p style={{ color: "#60758c" }}>No quote yet. Pantavion can discuss the campaign with you before issuing the commercial offer.</p> : activeQuotes.map((quote: any) => (
                      <div key={quote.id} style={{ background: "#f5f9fd", border: "1px solid #dce8f4", borderRadius: 14, padding: 14, marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><strong>Quote v{quote.version}</strong><strong>{money(quote.amount_cents, quote.currency)}</strong></div>
                        <p style={{ margin: "8px 0", color: "#526980" }}>{quote.description}</p>
                        <div style={{ fontSize: 12, color: "#71849a" }}>{quote.status}{quote.valid_until ? ` · valid until ${quote.valid_until}` : ""}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: 18 }}>
                    <h3 style={{ marginTop: 0 }}>Campaign conversation</h3>
                    <div style={{ display: "grid", gap: 9, marginBottom: 14 }}>
                      {(messages || []).length === 0 ? <p style={{ color: "#60758c" }}>Use this conversation to agree placement, creative, countries, duration and price with Pantavion.</p> : (messages || []).map((message: any) => {
                        const own = message.sender_id === user.id;
                        return <div key={message.id} style={{ justifySelf: own ? "end" : "start", maxWidth: "82%", background: own ? "#1267d6" : "#edf3f9", color: own ? "white" : "#10233f", borderRadius: 16, padding: "10px 13px" }}>{message.body}</div>;
                      })}
                    </div>
                    <form action={sendAdRequestMessage} style={{ display: "flex", gap: 9 }}>
                      <input type="hidden" name="requestId" value={activeRequest.id} />
                      <input name="body" required maxLength={5000} placeholder="Message Pantavion about this campaign…" style={{ ...inputStyle, flex: 1 }} />
                      <button type="submit" style={primaryButton}>Send</button>
                    </form>
                  </div>
                </>
              ) : <div style={{ padding: 30, color: "#60758c" }}>Create a campaign request to start a direct commercial conversation with Pantavion.</div>}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 13px",
  borderRadius: 12,
  border: "1px solid #cfdbe7",
  background: "white",
  color: "#10233f",
} as const;

const primaryButton = {
  border: 0,
  borderRadius: 12,
  padding: "12px 16px",
  background: "#1267d6",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
} as const;
