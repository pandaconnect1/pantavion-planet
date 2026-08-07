import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdvertiser, createAdRequest, sendAdRequestMessage } from "./actions";

const CONTINENTS = ["Africa", "Antarctica", "Asia", "Europe", "North America", "Oceania", "South America"] as const;

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
    .select("id,display_name,legal_name,country_code,verification_status,advertiser_track")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const advertiserIds = (advertisers || []).map((item: any) => item.id);
  const { data: requests } = advertiserIds.length
    ? await supabase
        .from("pantavion_ad_requests")
        .select("id,title,objective,status,budget_cents,currency,target_countries,target_continents,scope_type,commercial_track,agreement_type,legal_review_status,created_at,advertiser_id")
        .in("advertiser_id", advertiserIds)
        .order("created_at", { ascending: false })
    : { data: [] as any[] };

  const requestIds = (requests || []).map((item: any) => item.id);
  const { data: quotes } = requestIds.length
    ? await supabase
        .from("pantavion_ad_quotes")
        .select("id,request_id,version,amount_cents,currency,description,valid_until,status")
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
    .select("id,code,name,description,billing_model,base_price_cents,currency,minimum_days")
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
            <h1 style={{ margin: "8px 0", fontSize: "clamp(34px,5vw,56px)" }}>Direct advertising. One global relationship.</h1>
            <p style={{ maxWidth: 820, margin: 0, color: "#60758c", lineHeight: 1.6 }}>
              Pantavion accepts advertising only through its dedicated Ads Directory. No external ad networks, injected banners or third-party ad inventory are permitted anywhere else in Pantavion.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/ads" style={secondaryButton}>View Ads Directory</Link>
            <Link href="/social-core" style={secondaryButton}>Social World</Link>
          </div>
        </header>

        {params.error ? <div style={{ background: "#fff1f1", border: "1px solid #f2bbbb", padding: 14, borderRadius: 14, marginBottom: 16 }}>{params.error}</div> : null}

        <section style={{ background: "#10233f", color: "white", borderRadius: 22, padding: 20, marginBottom: 24 }}>
          <h2 style={{ marginTop: 0 }}>Locked advertising rule</h2>
          <div style={{ display: "grid", gap: 8, lineHeight: 1.55, opacity: .95 }}>
            <div>• Paid advertising appears only inside the Pantavion Ads Directory.</div>
            <div>• Feed, Chat, Communities, Search, Social World and other Pantavion pages contain no paid third-party ads.</div>
            <div>• Temu, Google or any other global company can appear only as a direct paying Pantavion advertiser after verification and approval.</div>
            <div>• External ad SDKs, pixels and third-party advertising networks are prohibited.</div>
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 14, marginBottom: 24 }}>
          <article style={cardStyle}>
            <p style={eyebrowStyle}>STANDARD ADVERTISER</p>
            <h2 style={{ margin: "6px 0" }}>Standard commercial flow</h2>
            <p style={mutedStyle}>For ordinary businesses using published rate cards or a Pantavion custom quote.</p>
            <div style={smallListStyle}>Advertising Terms → Acceptable Use → Privacy/Data Rules → Insertion Order → Payment → Approval</div>
          </article>
          <article style={cardStyle}>
            <p style={eyebrowStyle}>ENTERPRISE / STRATEGIC PARTNER</p>
            <h2 style={{ margin: "6px 0" }}>Negotiated global agreement</h2>
            <p style={mutedStyle}>For major groups and multinational campaigns across countries, continents or all seven continents.</p>
            <div style={smallListStyle}>Custom quote → MSA + IO → legal review where terms differ → payment → approval</div>
          </article>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginBottom: 24 }}>
          {["1. Request", "2. Discuss", "3. Quote", "4. Agreement", "5. Pay", "6. Approve", "7. Publish in Ads Directory"].map((step) => (
            <div key={step} style={{ ...cardStyle, padding: 13, fontWeight: 900 }}>{step}</div>
          ))}
        </section>

        {(rateCards || []).length > 0 ? (
          <section style={{ marginBottom: 24 }}>
            <h2>Standard rate card</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12 }}>
              {(rateCards || []).map((rate: any) => (
                <article key={rate.id} style={cardStyle}>
                  <strong>{rate.name}</strong>
                  <p style={mutedStyle}>{rate.description || "Pantavion Ads Directory placement"}</p>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>{money(rate.base_price_cents, rate.currency)}</div>
                  <div style={{ marginTop: 5, color: "#71849a", fontSize: 13 }}>{rate.billing_model}{rate.minimum_days ? ` · minimum ${rate.minimum_days} days` : ""}</div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section style={{ ...cardStyle, marginBottom: 24 }}>
            <strong>Official prices have not been published yet.</strong>
            <p style={{ ...mutedStyle, marginBottom: 0 }}>Standard and Enterprise requests can use a custom quote until Pantavion publishes the first global rate card.</p>
          </section>
        )}

        {(advertisers || []).length === 0 ? (
          <section style={cardStyle}>
            <h2>Create advertiser profile</h2>
            <form action={createAdvertiser} style={{ display: "grid", gap: 12, maxWidth: 680 }}>
              <select name="advertiserTrack" defaultValue="standard" style={inputStyle}>
                <option value="standard">Standard Advertiser</option>
                <option value="enterprise">Enterprise / Strategic Partner</option>
              </select>
              <input name="displayName" required minLength={2} maxLength={160} placeholder="Brand / advertiser name" style={inputStyle} />
              <input name="legalName" maxLength={200} placeholder="Legal company name" style={inputStyle} />
              <input name="countryCode" maxLength={2} placeholder="Headquarters country code, e.g. CY" style={inputStyle} />
              <button type="submit" style={primaryButton}>Create advertiser profile</button>
            </form>
          </section>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(300px,430px) 1fr", gap: 18 }}>
            <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
              <section style={cardStyle}>
                <h2 style={{ marginTop: 0 }}>New advertising request</h2>
                <form action={createAdRequest} style={{ display: "grid", gap: 11 }}>
                  <select name="advertiserId" required style={inputStyle} defaultValue={advertisers?.[0]?.id}>
                    {(advertisers || []).map((advertiser: any) => (
                      <option key={advertiser.id} value={advertiser.id}>{advertiser.display_name} · {advertiser.advertiser_track} · {advertiser.verification_status}</option>
                    ))}
                  </select>
                  <input name="title" required minLength={2} maxLength={180} placeholder="Campaign title" style={inputStyle} />
                  <textarea name="objective" required minLength={2} maxLength={2000} placeholder="What do you want to promote?" rows={4} style={inputStyle} />

                  <div style={{ background: "#eef6ff", border: "1px solid #d5e7fa", borderRadius: 13, padding: 12 }}>
                    <strong>Placement: Pantavion Ads Directory only</strong>
                    <div style={{ ...mutedStyle, marginTop: 5 }}>No campaign can be placed in Feed, Chat, Communities, Search or other Pantavion pages.</div>
                  </div>

                  <select name="scopeType" defaultValue="country" style={inputStyle}>
                    <option value="country">Single country</option>
                    <option value="multi_country">Multiple countries</option>
                    <option value="continent">Single continent</option>
                    <option value="multi_continent">Multiple continents</option>
                    <option value="global">Global / seven-continent scope</option>
                  </select>
                  <input name="countries" placeholder="Countries, e.g. CY, GR, AE" style={inputStyle} />
                  <input name="continents" list="pantavion-continents" placeholder="Continents, comma separated" style={inputStyle} />
                  <datalist id="pantavion-continents">{CONTINENTS.map((continent) => <option key={continent} value={continent} />)}</datalist>

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

              <section style={cardStyle}>
                <h2 style={{ marginTop: 0 }}>Your requests</h2>
                <div style={{ display: "grid", gap: 8 }}>
                  {(requests || []).length === 0 ? <p style={mutedStyle}>No requests yet.</p> : (requests || []).map((request: any) => (
                    <Link key={request.id} href={`/business/ads?request=${request.id}`} style={{ textDecoration: "none", color: "inherit", background: request.id === activeRequestId ? "#eaf4ff" : "#f7f9fc", border: "1px solid #e2eaf2", padding: 12, borderRadius: 14 }}>
                      <strong>{request.title}</strong>
                      <div style={{ fontSize: 13, color: "#64798e", marginTop: 4 }}>{request.commercial_track} · {request.scope_type} · {request.status}</div>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <section style={{ ...cardStyle, minHeight: 620, padding: 0, overflow: "hidden" }}>
              {activeRequest ? (
                <>
                  <div style={{ padding: 18, borderBottom: "1px solid #e4ebf3" }}>
                    <strong style={{ fontSize: 20 }}>{activeRequest.title}</strong>
                    <div style={{ color: "#657a90", marginTop: 5 }}>{activeRequest.commercial_track} · {activeRequest.scope_type} · {activeRequest.status}</div>
                    <p style={{ color: "#40566e", lineHeight: 1.55 }}>{activeRequest.objective}</p>
                    <div style={{ display: "grid", gap: 5, fontSize: 13, color: "#60758c" }}>
                      <span>Agreement: {activeRequest.agreement_type}</span>
                      <span>Legal review: {activeRequest.legal_review_status}</span>
                      <span>Budget: {money(activeRequest.budget_cents, activeRequest.currency)}</span>
                    </div>
                  </div>

                  <div style={{ padding: 18, borderBottom: "1px solid #e4ebf3" }}>
                    <h3 style={{ marginTop: 0 }}>Pantavion quote</h3>
                    {activeQuotes.length === 0 ? <p style={mutedStyle}>No quote yet. Pantavion can discuss global scope, duration and price before issuing the offer.</p> : activeQuotes.map((quote: any) => (
                      <div key={quote.id} style={{ background: "#f5f9fd", border: "1px solid #dce8f4", borderRadius: 14, padding: 14, marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><strong>Quote v{quote.version}</strong><strong>{money(quote.amount_cents, quote.currency)}</strong></div>
                        <p style={mutedStyle}>{quote.description}</p>
                        <div style={{ fontSize: 12, color: "#71849a" }}>{quote.status}{quote.valid_until ? ` · valid until ${quote.valid_until}` : ""}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: 18 }}>
                    <h3 style={{ marginTop: 0 }}>Commercial conversation</h3>
                    <div style={{ display: "grid", gap: 9, marginBottom: 14 }}>
                      {(messages || []).length === 0 ? <p style={mutedStyle}>Use this conversation to agree countries, continents, duration, creative, contract terms and price with Pantavion.</p> : (messages || []).map((message: any) => {
                        const own = message.sender_id === user.id;
                        return <div key={message.id} style={{ justifySelf: own ? "end" : "start", maxWidth: "82%", background: own ? "#1267d6" : "#edf3f9", color: own ? "white" : "#10233f", borderRadius: 16, padding: "10px 13px" }}>{message.body}</div>;
                      })}
                    </div>
                    <form action={sendAdRequestMessage} style={{ display: "flex", gap: 9 }}>
                      <input type="hidden" name="requestId" value={activeRequest.id} />
                      <input name="body" required maxLength={5000} placeholder="Message Pantavion about this request…" style={{ ...inputStyle, flex: 1 }} />
                      <button type="submit" style={primaryButton}>Send</button>
                    </form>
                  </div>
                </>
              ) : <div style={{ padding: 30, color: "#60758c" }}>Create an advertising request to start a direct commercial conversation with Pantavion.</div>}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

const cardStyle = {
  background: "white",
  border: "1px solid #dde7f1",
  borderRadius: 18,
  padding: 18,
} as const;

const eyebrowStyle = {
  margin: 0,
  color: "#1769aa",
  fontWeight: 900,
  letterSpacing: ".1em",
  fontSize: 11,
} as const;

const mutedStyle = { color: "#60758c", lineHeight: 1.55 } as const;
const smallListStyle = { color: "#40566e", lineHeight: 1.55, fontSize: 14 } as const;

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

const secondaryButton = {
  textDecoration: "none",
  fontWeight: 900,
  color: "#1769aa",
  background: "white",
  border: "1px solid #d7e4f1",
  borderRadius: 12,
  padding: "10px 13px",
} as const;
