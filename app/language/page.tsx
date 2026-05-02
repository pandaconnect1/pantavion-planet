"use client";
import { useState } from "react";

const LANGUAGES = [
  { code: "af", name: "Afrikaans" },
  { code: "sq", name: "Shqip" },
  { code: "am", name: "አማርኛ" },
  { code: "ar", name: "العربية" },
  { code: "hy", name: "Հայերեն" },
  { code: "az", name: "Azərbaycan" },
  { code: "eu", name: "Euskara" },
  { code: "be", name: "Беларуская" },
  { code: "bn", name: "বাংলা" },
  { code: "bs", name: "Bosanski" },
  { code: "bg", name: "Български" },
  { code: "ca", name: "Català" },
  { code: "ceb", name: "Cebuano" },
  { code: "ny", name: "Chichewa" },
  { code: "zh", name: "中文 (简体)" },
  { code: "zh-TW", name: "中文 (繁體)" },
  { code: "co", name: "Corsu" },
  { code: "hr", name: "Hrvatski" },
  { code: "cs", name: "Čeština" },
  { code: "da", name: "Dansk" },
  { code: "nl", name: "Nederlands" },
  { code: "en", name: "English" },
  { code: "eo", name: "Esperanto" },
  { code: "et", name: "Eesti" },
  { code: "tl", name: "Filipino" },
  { code: "fi", name: "Suomi" },
  { code: "fr", name: "Français" },
  { code: "fy", name: "Frysk" },
  { code: "gl", name: "Galego" },
  { code: "ka", name: "ქართული" },
  { code: "de", name: "Deutsch" },
  { code: "el", name: "λληνικά" },
  { code: "gu", name: "ગુજરાતી" },
  { code: "ht", name: "Kreyòl ayisyen" },
  { code: "ha", name: "Hausa" },
  { code: "haw", name: "ʻŌlelo Hawaiʻi" },
  { code: "he", name: "עברית" },
  { code: "hi", name: "हिन्दी" },
  { code: "hmn", name: "Hmong" },
  { code: "hu", name: "Magyar" },
  { code: "is", name: "Íslenska" },
  { code: "ig", name: "Igbo" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "ga", name: "Gaeilge" },
  { code: "it", name: "Italiano" },
  { code: "ja", name: "日本語" },
  { code: "jw", name: "Basa Jawa" },
  { code: "kn", name: "ಕನ್ನಡ" },
  { code: "kk", name: "Қазақ" },
  { code: "km", name: "ខ្មែរ" },
  { code: "ko", name: "한국어" },
  { code: "ku", name: "Kurdî" },
  { code: "ky", name: "Кыргызча" },
  { code: "lo", name: "ລາວ" },
  { code: "la", name: "Latina" },
  { code: "lv", name: "Latviešu" },
  { code: "lt", name: "Lietuvių" },
  { code: "lb", name: "Lëtzebuergesch" },
  { code: "mk", name: "Македонски" },
  { code: "mg", name: "Malagasy" },
  { code: "ms", name: "Bahasa Melayu" },
  { code: "ml", name: "മലയാളം" },
  { code: "mt", name: "Malti" },
  { code: "mi", name: "Te Reo Māori" },
  { code: "mr", name: "मराठी" },
  { code: "mn", name: "Монгол" },
  { code: "my", name: "မြန်မာဘာသာ" },
  { code: "ne", name: "नेपाली" },
  { code: "no", name: "Norsk" },
  { code: "ps", name: "پښتو" },
  { code: "fa", name: "فارسی" },
  { code: "pl", name: "Polski" },
  { code: "pt", name: "Português" },
  { code: "pa", name: "ਪੰਜਾਬੀ" },
  { code: "ro", name: "Română" },
  { code: "ru", name: "Русский" },
  { code: "sm", name: "Samoa" },
  { code: "gd", name: "Gàidhlig" },
  { code: "sr", name: "Српски" },
  { code: "st", name: "Sesotho" },
  { code: "sn", name: "Shona" },
  { code: "sd", name: "سنڌي" },
  { code: "si", name: "සිංහල" },
  { code: "sk", name: "Slovenčina" },
  { code: "sl", name: "Slovenščina" },
  { code: "so", name: "Soomaali" },
  { code: "es", name: "Español" },
  { code: "su", name: "Basa Sunda" },
  { code: "sw", name: "Kiswahili" },
  { code: "sv", name: "Svenska" },
  { code: "tg", name: "Тоҷикӣ" },
  { code: "ta", name: "தமிழ்" },
  { code: "te", name: "తెలుగు" },
  { code: "th", name: "ภาษาไทย" },
  { code: "tr", name: "Türkçe" },
  { code: "uk", name: "Українська" },
  { code: "ur", name: "اردو" },
  { code: "uz", name: "Oʻzbek" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "cy", name: "Cymraeg" },
  { code: "xh", name: "isiXhosa" },
  { code: "yi", name: "ייִדיש" },
  { code: "yo", name: "Yorùbá" },
  { code: "zu", name: "isiZulu" },
];

export default function LanguagePage() {
  const [from, setFrom] = useState("el");
  const [to, setTo] = useState("en");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function translate() {
    if (!input.trim()) return;
    setLoading(true);
    setOutput("");
    try {
      const res = await fetch("/api/language/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, from, to }),
      });
      const data = await res.json();
      setOutput(data.result || "Translation unavailable.");
    } catch {
      setOutput("Connection error. Please try again.");
    }
    setLoading(false);
  }

  const sel = {
    width: "100%", padding: "12px 16px", borderRadius: "12px",
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(247,217,139,0.2)",
    color: "#f7d98b", fontSize: "15px"
  } as React.CSSProperties;

  return (
    <main style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top, #102449 0%, #050914 52%, #02040a 100%)",
      color: "#f7d98b", padding: "56px 24px", fontFamily: "Arial, sans-serif"
    }}>
      <section style={{ maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ letterSpacing: "0.2em", textTransform: "uppercase", color: "#9fb6df", fontSize: "12px", marginBottom: "16px" }}>
          Pantavion Language
        </p>
        <h1 style={{ fontSize: "42px", lineHeight: "1.1", margin: "0 0 12px" }}>
          Language Bridge
        </h1>
        <p style={{ color: "#dbe7ff", fontSize: "16px", lineHeight: "1.7", maxWidth: "680px", marginBottom: "8px" }}>
          Bidirectional real-time translation across {LANGUAGES.length} languages.
          Street interpreter, medical, business, elder assist — for all humanity.
        </p>
        <p style={{ color: "#9fb6df", fontSize: "13px", marginBottom: "40px" }}>
          * Assistive translation. Not a certified legal or medical replacement.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div>
            <label style={{ color: "#9fb6df", fontSize: "12px", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>FROM</label>
            <select value={from} onChange={e => setFrom(e.target.value)} style={sel}>
              {LANGUAGES.map(l => <option key={l.code} value={l.code} style={{ background: "#050914" }}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: "#9fb6df", fontSize: "12px", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>TO</label>
            <select value={to} onChange={e => setTo(e.target.value)} style={sel}>
              {LANGUAGES.map(l => <option key={l.code} value={l.code} style={{ background: "#050914" }}>{l.name}</option>)}
            </select>
          </div>
        </div>

        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type text to translate..."
          rows={5}
          style={{
            width: "100%", padding: "16px", borderRadius: "16px",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(247,217,139,0.15)",
            color: "#ffffff", fontSize: "16px", resize: "vertical", marginBottom: "16px",
            boxSizing: "border-box"
          }}
        />

        <button onClick={translate} disabled={loading} style={{
          padding: "14px 36px", borderRadius: "999px",
          background: loading ? "rgba(247,217,139,0.3)" : "#f7d98b",
          color: "#050914", fontWeight: "bold", fontSize: "15px",
          border: "none", cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "24px"
        }}>
          {loading ? "Translating..." : "Translate"}
        </button>

        {output && (
          <div style={{
            padding: "24px", borderRadius: "16px",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(247,217,139,0.2)",
            color: "#dbe7ff", fontSize: "17px", lineHeight: "1.7"
          }}>
            {output}
          </div>
        )}

        <div style={{ marginTop: "48px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          {["Street Interpreter","Medical Terms","Business & Legal","Elder Assist","Technical & Scientific","Elite & Diplomatic","Live Voice (Coming Soon)","Off-grid Mode (Coming Soon)"].map(f => (
            <div key={f} style={{
              padding: "16px", borderRadius: "14px",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(247,217,139,0.1)",
              color: "#9fb6df", fontSize: "13px"
            }}>{f}</div>
          ))}
        </div>

        <div style={{ marginTop: "48px" }}>
          <a href="/" style={{ color: "#9fb6df", fontSize: "14px", textDecoration: "none" }}>← Back to Pantavion</a>
        </div>
      </section>
    </main>
  );
}
