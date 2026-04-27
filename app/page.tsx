"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const T = {
  el: { sub:"Ένα παγκόσμιο human-first οικοσύστημα για επικοινωνία, γνώση, μνήμη, εργασία, δημιουργία, ασφάλεια και AI-assisted execution — για όλη την ανθρωπότητα.", cta1:"Enter Pantavion", cta2:"Try Language Bridge", cta3:"Open PantaAI", login:"Είσοδος" },
  en: { sub:"A human-first global ecosystem for communication, knowledge, memory, work, creation, safety and AI-assisted execution — for all humanity.", cta1:"Enter Pantavion", cta2:"Try Language Bridge", cta3:"Open PantaAI", login:"Sign In" },
  zh: { sub:"一个以人为本的全球生态系统，用于通信、知识、记忆、工作、创造、安全和AI辅助执行。", cta1:"进入 Pantavion", cta2:"语言桥梁", cta3:"PantaAI", login:"登录" },
  ar: { sub:"نظام بيئي عالمي يضع الإنسان في المركز للتواصل والمعرفة والذاكرة والعمل والإبداع والسلامة.", cta1:"ادخل Pantavion", cta2:"جسر اللغة", cta3:"PantaAI", login:"دخول" },
};

export default function HomePage() {
  const [lang, setLang] = useState<"el"|"en"|"zh"|"ar">("el");
  const t = T[lang];

  return (
    <main style={{ height:"100vh", overflow:"hidden", background:"#040c18", color:"white", fontFamily:"system-ui,sans-serif", display:"flex", flexDirection:"column" }}>

      {/* Navbar */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 36px", borderBottom:"1px solid rgba(255,255,255,0.07)", background:"rgba(4,8,18,0.95)", flexShrink:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:"radial-gradient(circle at 35% 35%, #d4a843, #4a9eff 60%, #030711)", boxShadow:"0 0 14px rgba(212,168,67,0.5)" }} />
          <span style={{ fontWeight:900, fontSize:16, color:"white", letterSpacing:"0.02em" }}>pantavion.com</span>
        </div>
        <div style={{ display:"flex", gap:5 }}>
          {["Planet","Language","People","Media","PantaAI","Work","Safety","Dashboard"].map(item => (
            <Link key={item} href={`/${item.toLowerCase()}`} style={{ padding:"5px 13px", borderRadius:999, border:"1px solid rgba(255,255,255,0.15)", fontSize:12, fontWeight:600, color:"white", textDecoration:"none" }}>{item}</Link>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          {(["el","en","zh","ar"] as const).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{ padding:"4px 10px", borderRadius:999, border: lang===l ? "1px solid #d4a843" : "1px solid rgba(255,255,255,0.1)", background: lang===l ? "rgba(212,168,67,0.15)" : "transparent", color: lang===l ? "#d4a843" : "#667788", fontSize:11, fontWeight:700, cursor:"pointer" }}>
              {l==="el"?"ΕΛ":l==="en"?"EN":l==="zh"?"中":"ع"}
            </button>
          ))}
          <Link href="/pricing" style={{ marginLeft:8, padding:"6px 18px", borderRadius:999, border:"1px solid rgba(212,168,67,0.5)", color:"#d4a843", fontSize:12, fontWeight:700, textDecoration:"none" }}>{t.login}</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ display:"grid", gridTemplateColumns:"1fr 1fr", flex:1, maxWidth:1400, width:"100%", margin:"0 auto", padding:"0 40px", alignItems:"center", gap:20, position:"relative" }}>

        {/* Left */}
        <div style={{ zIndex:2 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.4em", color:"#d4a843", marginBottom:16, textTransform:"uppercase", opacity:0.85 }}>PANTAVION ONE</p>
          <h1 style={{ fontSize:"clamp(36px, 4vw, 64px)", fontWeight:900, lineHeight:1.06, margin:"0 0 18px", letterSpacing:"-0.02em" }}>
            One Planet.<br />
            <span style={{ color:"#d4a843" }}>One Living Screen.</span><br />
            All Humanity Connected.
          </h1>
          <p style={{ fontSize:15, lineHeight:1.75, color:"#8899bb", maxWidth:460, marginBottom:28 }}>{t.sub}</p>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <Link href="/pricing" style={{ padding:"12px 26px", borderRadius:999, background:"linear-gradient(135deg,#d4a843,#f0c866)", color:"#0a0600", fontWeight:900, fontSize:14, textDecoration:"none", boxShadow:"0 6px 28px rgba(212,168,67,0.4)" }}>{t.cta1} →</Link>
            <Link href="/language" style={{ padding:"12px 22px", borderRadius:999, border:"1.5px solid rgba(255,255,255,0.22)", color:"white", fontWeight:700, fontSize:13, textDecoration:"none" }}>{t.cta2}</Link>
            <Link href="/ai" style={{ padding:"12px 22px", borderRadius:999, border:"1.5px solid rgba(255,255,255,0.22)", color:"white", fontWeight:700, fontSize:13, textDecoration:"none" }}>{t.cta3}</Link>
          </div>
        </div>

        {/* Right: Planet Image */}
        <div style={{ position:"relative", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
          <div style={{ position:"relative", width:"100%", maxWidth:520, aspectRatio:"1/1" }}>
            <Image src="/hero-planet.png" alt="Pantavion Planet" fill style={{ objectFit:"contain" }} priority />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, width:"100%", maxWidth:440 }}>
            {[["Planet","World screen"],["Language","Text bridge live"],["PantaAI","Intent execution"],["Safety","Legal routes"]].map(([label,sub]) => (
              <div key={label} style={{ padding:"10px 14px", background:"rgba(255,255,255,0.04)", borderRadius:12, border:"1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#d4a843" }}>{label}</div>
                <div style={{ fontSize:11, color:"#667788", marginTop:2 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
