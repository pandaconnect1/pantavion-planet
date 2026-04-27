"use client";
import Link from "next/link";
import { useState } from "react";

const T = {
  el: { tag:"PANTAVION ONE", h1:"One Planet.", h2:"One Living Screen.", h3:"All Humanity Connected.", sub:"Μία πλατφόρμα. Όλες οι γλώσσες.\nΚάθε άνθρωπος. Σε πραγματικό χρόνο.", cta:"Μπες στο Pantavion — Δωρεάν", note:"Χωρίς πιστωτική κάρτα · Άμεση πρόσβαση", login:"Είσοδος" },
  en: { tag:"PANTAVION ONE", h1:"One Planet.", h2:"One Living Screen.", h3:"All Humanity Connected.", sub:"One platform. All languages.\nEvery human. In real time.", cta:"Enter Pantavion — Free", note:"No credit card · Instant access", login:"Sign In" },
  zh: { tag:"PANTAVION ONE", h1:"一个星球。", h2:"一个生活屏幕。", h3:"全人类相连。", sub:"一个平台。所有语言。\n每个人。实时连接。", cta:"免费进入 Pantavion", note:"无需信用卡 · 即时访问", login:"登录" },
  ar: { tag:"PANTAVION ONE", h1:"كوكب واحد.", h2:"شاشة حية واحدة.", h3:"كل البشرية متصلة.", sub:"منصة واحدة. كل اللغات.\nكل إنسان. في الوقت الفعلي.", cta:"ادخل Pantavion — مجاناً", note:"بدون بطاقة ائتمان · وصول فوري", login:"دخول" },
};

export default function HomePage() {
  const [lang, setLang] = useState<"el"|"en"|"zh"|"ar">("el");
  const t = T[lang];

  return (
    <main style={{ minHeight:"100vh", background:"radial-gradient(ellipse at 50% 0%, #1a3a6e 0%, #07101f 50%, #020508 100%)", color:"white", fontFamily:"system-ui,sans-serif", overflowX:"hidden" }}>

      {/* Navbar */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 40px", position:"fixed", top:0, left:0, right:0, zIndex:100, background:"rgba(2,5,8,0.8)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:"50%", background:"radial-gradient(circle at 35% 35%, #d4a843, #4a9eff 60%, #030711)", boxShadow:"0 0 16px rgba(212,168,67,0.4)" }} />
          <span style={{ fontWeight:900, fontSize:15, letterSpacing:"0.08em", color:"#d4a843" }}>PANTAVION</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {(["el","en","zh","ar"] as const).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{ padding:"5px 12px", borderRadius:999, border: lang===l ? "1px solid #d4a843" : "1px solid rgba(255,255,255,0.15)", background: lang===l ? "rgba(212,168,67,0.15)" : "transparent", color: lang===l ? "#d4a843" : "#8899aa", fontSize:11, fontWeight:700, cursor:"pointer" }}>
              {l==="el"?"ΕΛ":l==="en"?"EN":l==="zh"?"中文":"عربي"}
            </button>
          ))}
          <Link href="/pricing" style={{ marginLeft:8, padding:"7px 20px", borderRadius:999, border:"1px solid rgba(212,168,67,0.5)", color:"#d4a843", fontSize:13, fontWeight:700, textDecoration:"none" }}>{t.login}</Link>
        </div>
      </nav>

      {/* Hero — one screen */}
      <section style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:40, padding:"80px 60px 40px", maxWidth:1300, margin:"0 auto", minHeight:"100vh", alignItems:"center" }}>

        {/* Left: Text */}
        <div>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.4em", color:"#d4a843", marginBottom:20, opacity:0.8 }}>{t.tag}</p>
          <h1 style={{ fontSize:"clamp(36px, 5vw, 72px)", fontWeight:900, lineHeight:1.05, margin:"0 0 24px", letterSpacing:"-0.02em" }}>
            {t.h1}<br />
            <span style={{ color:"#d4a843" }}>{t.h2}</span><br />
            {t.h3}
          </h1>
          <p style={{ fontSize:18, lineHeight:1.7, color:"#8899bb", maxWidth:480, marginBottom:36, whiteSpace:"pre-line" }}>{t.sub}</p>
          <Link href="/pricing" style={{ display:"inline-block", padding:"16px 40px", borderRadius:999, background:"linear-gradient(135deg, #d4a843, #f0c866)", color:"#0a0600", fontWeight:900, fontSize:16, textDecoration:"none", boxShadow:"0 8px 40px rgba(212,168,67,0.4)" }}>{t.cta}</Link>
          <p style={{ marginTop:14, fontSize:13, color:"#445566" }}>{t.note}</p>
        </div>

        {/* Right: Orb */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ position:"relative", width:360, height:360 }}>
            <div style={{ position:"absolute", inset:-80, borderRadius:"50%", border:"1px solid rgba(212,168,67,0.3)", animation:"spin 28s linear infinite" }} />
            <div style={{ position:"absolute", inset:-52, borderRadius:"50%", border:"1px solid rgba(74,158,255,0.2)", animation:"spin 20s linear infinite reverse" }} />
            <div style={{ position:"absolute", inset:-28, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.07)", animation:"spin 45s linear infinite" }} />
            <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"radial-gradient(circle at 38% 30%, #e8c060 0%, #5aabff 30%, #1a3a8f 58%, #020810 85%)", boxShadow:"0 0 160px rgba(74,158,255,0.4), 0 0 80px rgba(212,168,67,0.25), 0 40px 80px rgba(0,0,0,0.5)", animation:"pulse 5s ease-in-out infinite" }}>
              <div style={{ position:"absolute", inset:"10%", borderRadius:"50%", border:"1.5px solid rgba(255,255,255,0.18)" }} />
              <div style={{ position:"absolute", inset:"25%", borderRadius:"50%", border:"1.5px solid rgba(255,255,255,0.12)" }} />
              <div style={{ position:"absolute", inset:"40%", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.08)" }} />
              <div style={{ position:"absolute", inset:"38%", borderRadius:"50%", background:"radial-gradient(circle, white 0%, rgba(255,255,255,0.5) 50%, transparent 100%)", boxShadow:"0 0 50px white" }} />
              <div style={{ position:"absolute", bottom:0, left:"10%", right:"10%", height:"28%", borderRadius:"0 0 50% 50%", background:"rgba(0,0,0,0.3)" }} />
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </main>
  );
}
