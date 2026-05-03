"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Copy = {
  login: string;
  menu: string;
  close: string;
  eyebrow: string;
  titleA: string;
  titleB: string;
  titleC: string;
  subtitle: string;
  enter: string;
  sosNow: string;
  guardian: string;
  sosBadge: string;
  sosTitle: string;
  sosText: string;
  liveSos: string;
  lifeShield: string;
  guardianMode: string;
  evidence: string;
  offgrid: string;
  partners: string;
  scenarios: string;
  mobileProofTitle: string;
  mobileProofText: string;
  coverageTitle: string;
  coverageText: string;
  trustedTitle: string;
  trustedText: string;
  truthTitle: string;
  truthText: string;
  languageNotice: string;
};

const languageOptions = [
  { code: "el", label: "Ελληνικά" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "ar", label: "العربية" },
  { code: "tr", label: "Türkçe" },
  { code: "ru", label: "Русский" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "ur", label: "اردو" },
  { code: "fa", label: "فارسی" },
  { code: "he", label: "עברית" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "fil", label: "Filipino" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "th", label: "ไทย" },
  { code: "sw", label: "Kiswahili" },
  { code: "ha", label: "Hausa" },
  { code: "yo", label: "Yorùbá" },
  { code: "am", label: "አማርኛ" },
  { code: "zu", label: "isiZulu" },
  { code: "af", label: "Afrikaans" },
  { code: "nl", label: "Nederlands" },
  { code: "pl", label: "Polski" },
  { code: "uk", label: "Українська" },
  { code: "ro", label: "Română" },
  { code: "cs", label: "Čeština" },
  { code: "sv", label: "Svenska" },
  { code: "no", label: "Norsk" },
  { code: "da", label: "Dansk" },
  { code: "fi", label: "Suomi" },
  { code: "is", label: "Íslenska" },
  { code: "ga", label: "Gaeilge" },
  { code: "cy", label: "Cymraeg" },
  { code: "ca", label: "Català" },
  { code: "eu", label: "Euskara" },
  { code: "gl", label: "Galego" },
  { code: "sq", label: "Shqip" },
  { code: "sr", label: "Српски" },
  { code: "hr", label: "Hrvatski" },
  { code: "bg", label: "Български" },
  { code: "mk", label: "Македонски" },
  { code: "lt", label: "Lietuvių" },
  { code: "lv", label: "Latviešu" },
  { code: "et", label: "Eesti" },
  { code: "mt", label: "Malti" },
  { code: "ka", label: "ქართული" },
  { code: "hy", label: "Հայերեն" },
  { code: "az", label: "Azərbaycan" },
  { code: "kk", label: "Қазақша" },
  { code: "uz", label: "Oʻzbekcha" },
  { code: "ne", label: "नेपाली" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "ml", label: "മലയാളം" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "mr", label: "मराठी" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
];

const copy: Record<string, Copy> = {
  el: {
    login: "Είσοδος",
    menu: "Μενού",
    close: "Κλείσιμο",
    eyebrow: "PANTAVION ONE",
    titleA: "One Planet.",
    titleB: "One Living Screen.",
    titleC: "All Humanity Connected.",
    subtitle:
      "Ένα παγκόσμιο human-first οικοσύστημα για επικοινωνία, γνώση, μνήμη, εργασία, δημιουργία, ασφάλεια και AI-assisted execution — με ζωντανό SOS, Guardian Mode και emergency readiness για όλη την ανθρωπότητα.",
    enter: "Enter Pantavion",
    sosNow: "Άνοιγμα SOS τώρα",
    guardian: "Guardian Mode",
    sosBadge: "ΖΩΝΤΑΝΟ SOS",
    sosTitle: "Pantavion LifeShield SOS",
    sosText:
      "Άμεση πρόσβαση από κινητό, tablet και desktop. Το SOS ανοίγει πραγματικές browser/PWA ενέργειες: τοποθεσία, offline ουρά, share, SMS, χάρτη, evidence capsule και Guardian check-in.",
    liveSos: "Live SOS",
    lifeShield: "LifeShield",
    guardianMode: "Guardian Mode",
    evidence: "Evidence Capsule",
    offgrid: "Extreme Off-grid",
    partners: "Institution Gateway",
    scenarios: "Scenario Guide",
    mobileProofTitle: "Mobile-first emergency layer",
    mobileProofText:
      "Η αρχική πλέον δείχνει καθαρά το SOS στο κινητό, δίνει άμεση πρόσβαση στην ασφάλεια και δεν είναι μισή σελίδα.",
    coverageTitle: "Τι καλύπτουμε",
    coverageText:
      "Ταξίδι, οδήγηση, ανήλικο παιδί, κυνηγό/βουνό, σεισμό, πόλεμο, ατύχημα, απομακρυσμένη περιοχή, απώλεια σήματος και ανάγκη γρήγορης ενημέρωσης trusted contacts.",
    trustedTitle: "Πρώτα trusted contacts",
    trustedText:
      "Μέχρι να υπάρξουν επίσημες συμφωνίες με κράτη, αστυνομία, οργανισμούς και παρόχους, το πρώτο επίσημο στρώμα είναι οι επαφές που ορίζει ο χρήστης.",
    truthTitle: "Όριο αλήθειας",
    truthText:
      "Το Pantavion δεν ισχυρίζεται αυτόματη κρατική διάσωση, δορυφορική αποστολή ή αστυνομική/ασθενοφόρο dispatch χωρίς πιστοποιημένο πάροχο, hardware και θεσμική συμφωνία.",
    languageNotice:
      "Η γλώσσα της αρχικής αλλάζει για τις βασικές γλώσσες. Οι υπόλοιπες εμφανίζονται ως παγκόσμια κάλυψη επιλογής και μπορούν να συνδεθούν σταδιακά με πλήρη μεταφρασμένα emergency texts.",
  },
  en: {
    login: "Login",
    menu: "Menu",
    close: "Close",
    eyebrow: "PANTAVION ONE",
    titleA: "One Planet.",
    titleB: "One Living Screen.",
    titleC: "All Humanity Connected.",
    subtitle:
      "A global human-first ecosystem for communication, knowledge, memory, work, creation, safety and AI-assisted execution — with live SOS, Guardian Mode and emergency readiness for all humanity.",
    enter: "Enter Pantavion",
    sosNow: "Open SOS now",
    guardian: "Guardian Mode",
    sosBadge: "LIVE SOS",
    sosTitle: "Pantavion LifeShield SOS",
    sosText:
      "Immediate access from mobile, tablet and desktop. SOS opens real browser/PWA actions: location, offline queue, share, SMS, map, evidence capsule and Guardian check-in.",
    liveSos: "Live SOS",
    lifeShield: "LifeShield",
    guardianMode: "Guardian Mode",
    evidence: "Evidence Capsule",
    offgrid: "Extreme Off-grid",
    partners: "Institution Gateway",
    scenarios: "Scenario Guide",
    mobileProofTitle: "Mobile-first emergency layer",
    mobileProofText:
      "The homepage now clearly exposes SOS on mobile, gives direct safety access and no longer behaves like half a page.",
    coverageTitle: "What we cover",
    coverageText:
      "Travel, driving, child safety, hunters/mountains, earthquakes, war, accidents, remote areas, no-signal conditions and fast trusted-contact alerts.",
    trustedTitle: "Trusted contacts first",
    trustedText:
      "Until official agreements exist with countries, police, organizations and providers, the first official emergency layer is the user’s trusted contact circle.",
    truthTitle: "Truth boundary",
    truthText:
      "Pantavion does not claim automatic state rescue, satellite dispatch, police dispatch or ambulance dispatch without certified providers, hardware and institutional agreements.",
    languageNotice:
      "The homepage language changes for core languages. Additional languages appear as global selection coverage and can be connected gradually with fully translated emergency texts.",
  },
  es: {
    login: "Entrar",
    menu: "Menú",
    close: "Cerrar",
    eyebrow: "PANTAVION ONE",
    titleA: "Un planeta.",
    titleB: "Una pantalla viva.",
    titleC: "Toda la humanidad conectada.",
    subtitle:
      "Un ecosistema global centrado en las personas para comunicación, conocimiento, memoria, trabajo, creación, seguridad y ejecución asistida por IA — con SOS vivo, Guardian Mode y preparación de emergencia.",
    enter: "Entrar en Pantavion",
    sosNow: "Abrir SOS ahora",
    guardian: "Modo Guardián",
    sosBadge: "SOS EN VIVO",
    sosTitle: "Pantavion LifeShield SOS",
    sosText:
      "Acceso inmediato desde móvil, tablet y escritorio. SOS abre acciones reales: ubicación, cola offline, compartir, SMS, mapa, evidence capsule y check-in.",
    liveSos: "Live SOS",
    lifeShield: "LifeShield",
    guardianMode: "Modo Guardián",
    evidence: "Cápsula de evidencia",
    offgrid: "Extremo sin red",
    partners: "Portal institucional",
    scenarios: "Guía de escenarios",
    mobileProofTitle: "Capa de emergencia móvil primero",
    mobileProofText:
      "La página inicial muestra claramente SOS en móvil y da acceso directo a seguridad.",
    coverageTitle: "Qué cubrimos",
    coverageText:
      "Viajes, conducción, seguridad infantil, montaña, terremotos, guerra, accidentes, zonas remotas y falta de señal.",
    trustedTitle: "Primero contactos de confianza",
    trustedText:
      "Hasta acuerdos oficiales, la primera capa son los contactos de confianza definidos por el usuario.",
    truthTitle: "Límite de verdad",
    truthText:
      "Pantavion no promete rescate estatal, satelital, policial o ambulancia sin acuerdos e integraciones certificadas.",
    languageNotice:
      "La interfaz cambia en idiomas principales. Más idiomas pueden conectarse gradualmente con textos completos.",
  },
  fr: {
    login: "Connexion",
    menu: "Menu",
    close: "Fermer",
    eyebrow: "PANTAVION ONE",
    titleA: "Une planète.",
    titleB: "Un écran vivant.",
    titleC: "Toute l’humanité connectée.",
    subtitle:
      "Un écosystème mondial centré sur l’humain pour communication, connaissance, mémoire, travail, création, sécurité et exécution assistée par IA — avec SOS vivant et Guardian Mode.",
    enter: "Entrer dans Pantavion",
    sosNow: "Ouvrir SOS maintenant",
    guardian: "Guardian Mode",
    sosBadge: "SOS EN DIRECT",
    sosTitle: "Pantavion LifeShield SOS",
    sosText:
      "Accès immédiat depuis mobile, tablette et ordinateur. SOS lance localisation, file offline, partage, SMS, carte, evidence capsule et check-in.",
    liveSos: "Live SOS",
    lifeShield: "LifeShield",
    guardianMode: "Guardian Mode",
    evidence: "Capsule de preuve",
    offgrid: "Hors réseau extrême",
    partners: "Portail institutionnel",
    scenarios: "Guide des scénarios",
    mobileProofTitle: "Couche d’urgence mobile-first",
    mobileProofText:
      "La page d’accueil montre clairement SOS sur mobile et donne un accès direct à la sécurité.",
    coverageTitle: "Ce que nous couvrons",
    coverageText:
      "Voyage, conduite, enfant, montagne, séisme, guerre, accident, zone isolée et absence de signal.",
    trustedTitle: "Contacts de confiance d’abord",
    trustedText:
      "Avant les accords officiels, la première couche est le cercle de contacts de confiance.",
    truthTitle: "Limite de vérité",
    truthText:
      "Pantavion ne promet pas de sauvetage officiel ou satellitaire sans partenaires certifiés.",
    languageNotice:
      "Les langues principales changent l’interface. Les autres peuvent être complétées progressivement.",
  },
  de: {
    login: "Anmelden",
    menu: "Menü",
    close: "Schließen",
    eyebrow: "PANTAVION ONE",
    titleA: "Ein Planet.",
    titleB: "Ein lebender Bildschirm.",
    titleC: "Die Menschheit verbunden.",
    subtitle:
      "Ein globales, menschenzentriertes Ökosystem für Kommunikation, Wissen, Arbeit, Sicherheit und KI-gestützte Ausführung — mit Live-SOS und Guardian Mode.",
    enter: "Pantavion öffnen",
    sosNow: "SOS jetzt öffnen",
    guardian: "Guardian Mode",
    sosBadge: "LIVE SOS",
    sosTitle: "Pantavion LifeShield SOS",
    sosText:
      "Sofortzugriff über Mobilgerät, Tablet und Desktop: Standort, Offline-Warteschlange, Teilen, SMS, Karte, Evidence Capsule und Check-in.",
    liveSos: "Live SOS",
    lifeShield: "LifeShield",
    guardianMode: "Guardian Mode",
    evidence: "Evidence Capsule",
    offgrid: "Extrem offline",
    partners: "Institutionelles Gateway",
    scenarios: "Szenario-Leitfaden",
    mobileProofTitle: "Mobile-first Notfallschicht",
    mobileProofText:
      "Die Startseite zeigt SOS auf Mobilgeräten klar und bietet direkten Sicherheitszugang.",
    coverageTitle: "Was abgedeckt wird",
    coverageText:
      "Reisen, Fahren, Kindersicherheit, Berge, Erdbeben, Krieg, Unfall, abgelegene Gebiete und kein Signal.",
    trustedTitle: "Zuerst Vertrauenskontakte",
    trustedText:
      "Bis offizielle Vereinbarungen bestehen, sind Vertrauenskontakte die erste Schicht.",
    truthTitle: "Wahrheitsgrenze",
    truthText:
      "Pantavion verspricht keine staatliche oder satellitengestützte Rettung ohne zertifizierte Partner.",
    languageNotice:
      "Kernsprachen ändern die Oberfläche. Weitere Sprachen können schrittweise vollständig angebunden werden.",
  },
  ar: {
    login: "دخول",
    menu: "القائمة",
    close: "إغلاق",
    eyebrow: "PANTAVION ONE",
    titleA: "كوكب واحد.",
    titleB: "شاشة حيّة واحدة.",
    titleC: "الإنسانية كلها متصلة.",
    subtitle:
      "نظام عالمي يضع الإنسان أولاً للتواصل والمعرفة والعمل والسلامة والتنفيذ بمساعدة الذكاء الاصطناعي — مع SOS مباشر ووضع Guardian.",
    enter: "ادخل Pantavion",
    sosNow: "افتح SOS الآن",
    guardian: "وضع Guardian",
    sosBadge: "SOS مباشر",
    sosTitle: "Pantavion LifeShield SOS",
    sosText:
      "وصول فوري من الهاتف أو الجهاز اللوحي أو سطح المكتب: موقع، قائمة انتظار دون اتصال، مشاركة، SMS، خريطة، أدلة وتسجيل أمان.",
    liveSos: "SOS مباشر",
    lifeShield: "LifeShield",
    guardianMode: "وضع Guardian",
    evidence: "حافظة الأدلة",
    offgrid: "خارج الشبكة",
    partners: "بوابة المؤسسات",
    scenarios: "دليل الحالات",
    mobileProofTitle: "طبقة طوارئ للهاتف أولاً",
    mobileProofText:
      "تعرض الصفحة الرئيسية SOS بوضوح على الهاتف وتوفر وصولاً مباشراً للسلامة.",
    coverageTitle: "ما نغطيه",
    coverageText:
      "السفر، القيادة، الطفل، الجبال، الزلازل، الحرب، الحوادث، المناطق النائية وانعدام الإشارة.",
    trustedTitle: "جهات الاتصال الموثوقة أولاً",
    trustedText:
      "قبل الاتفاقيات الرسمية، تكون الطبقة الأولى هي جهات الاتصال التي يحددها المستخدم.",
    truthTitle: "حدود الحقيقة",
    truthText:
      "لا يدعي Pantavion إنقاذاً حكومياً أو فضائياً أو شرطياً دون شركاء معتمدين.",
    languageNotice:
      "تتغير الواجهة للغات الأساسية، ويمكن استكمال باقي اللغات تدريجياً.",
  },
};

const navItems = [
  { label: "Planet", href: "/planet" },
  { label: "Language", href: "/language" },
  { label: "People", href: "/people" },
  { label: "Media", href: "/media" },
  { label: "PantaAI", href: "/pantaai" },
  { label: "Work", href: "/work" },
  { label: "Safety", href: "/safety" },
  { label: "SOS", href: "/sos" },
];

const emergencyCards = [
  {
    key: "liveSos",
    href: "/sos",
    detail: "Real browser/PWA emergency command center",
    tone: "red",
  },
  {
    key: "lifeShield",
    href: "/pantavion/emergency",
    detail: "Emergency profile, device support and offline doctrine",
    tone: "dark",
  },
  {
    key: "guardianMode",
    href: "/pantavion/emergency/guardian",
    detail: "Before travel, driving, child safety, hunting or isolation",
    tone: "gold",
  },
  {
    key: "evidence",
    href: "/pantavion/emergency/evidence",
    detail: "Photo, video and audio capture with permission boundaries",
    tone: "dark",
  },
  {
    key: "offgrid",
    href: "/pantavion/emergency/extreme-offgrid",
    detail: "Remote area, disaster, no-signal and satellite-aware doctrine",
    tone: "dark",
  },
  {
    key: "partners",
    href: "/pantavion/emergency/partners",
    detail: "Countries, agencies, rescue teams and providers can request review",
    tone: "dark",
  },
  {
    key: "scenarios",
    href: "/pantavion/emergency/scenarios",
    detail: "When and how to use SOS before and during real danger",
    tone: "dark",
  },
];

export default function HomePage() {
  const [lang, setLang] = useState("el");
  const [menuOpen, setMenuOpen] = useState(false);
  const t = copy[lang] ?? copy.en;

  useEffect(() => {
    const saved = window.localStorage.getItem("pantavion-home-language");
    if (saved) setLang(saved);
  }, []);

  function changeLanguage(value: string) {
    setLang(value);
    window.localStorage.setItem("pantavion-home-language", value);
  }

  return (
    <main className="pantavionHome">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Pantavion home">
          <span className="brandOrb" />
          <strong>pantavion.com</strong>
        </Link>

        <nav className="desktopNav" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="topActions">
          <select
            value={lang}
            onChange={(event) => changeLanguage(event.target.value)}
            className="languageSelect"
            aria-label="Language selector"
          >
            {languageOptions.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>

          <Link href="/login" className="loginButton">
            {t.login}
          </Link>

          <button
            type="button"
            className="menuButton"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
          >
            {menuOpen ? t.close : `☰ ${t.menu}`}
          </button>
        </div>
      </header>

      {menuOpen && (
        <section className="mobileMenu" aria-label="Mobile menu">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}

          <Link href="/sos" className="mobileMenuSos" onClick={() => setMenuOpen(false)}>
            SOS
          </Link>
        </section>
      )}

      <section className="heroShell">
        <div className="heroCopy">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>
            <span>{t.titleA}</span>
            <span className="goldText">{t.titleB}</span>
            <span>{t.titleC}</span>
          </h1>
          <p className="subtitle">{t.subtitle}</p>

          <div className="heroActions">
            <Link href="/pantavion" className="goldAction">
              {t.enter} →
            </Link>
            <Link href="/sos" className="redAction">
              {t.sosNow}
            </Link>
            <Link href="/pantavion/emergency/guardian" className="darkAction">
              {t.guardian}
            </Link>
          </div>
        </div>

        <aside className="sosHero">
          <p className="sosBadge">{t.sosBadge}</p>
          <h2>{t.sosTitle}</h2>
          <p>{t.sosText}</p>
          <div className="sosHeroActions">
            <Link href="/sos" className="redAction">
              {t.sosNow}
            </Link>
            <Link href="/pantavion/emergency/guardian" className="goldAction">
              {t.guardian}
            </Link>
          </div>
        </aside>

        <div className="orbPanel" aria-hidden="true">
          <div className="planetOrb">
            <span className="ring ringOne" />
            <span className="ring ringTwo" />
            <span className="ring ringThree" />
            <span className="coreOrb" />
          </div>
        </div>
      </section>

      <section className="emergencyGrid" aria-label="Pantavion emergency surfaces">
        {emergencyCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`featureCard ${card.tone}`}
          >
            <h3>{String(t[card.key as keyof Copy])}</h3>
            <p>{card.detail}</p>
          </Link>
        ))}

        <article className="featureCard proof">
          <h3>{t.mobileProofTitle}</h3>
          <p>{t.mobileProofText}</p>
        </article>
      </section>

      <section className="coveragePanel">
        <article>
          <h2>{t.coverageTitle}</h2>
          <p>{t.coverageText}</p>
        </article>

        <article>
          <h2>{t.trustedTitle}</h2>
          <p>{t.trustedText}</p>
        </article>

        <article className="truthBox">
          <h2>{t.truthTitle}</h2>
          <p>{t.truthText}</p>
        </article>

        <article className="languageBox">
          <h2>Global language selector</h2>
          <p>{t.languageNotice}</p>
        </article>
      </section>

      <Link href="/sos" className="floatingSos" aria-label="Open Pantavion SOS">
        SOS
      </Link>

      <style>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #030915;
        }

        .pantavionHome {
          min-height: 100vh;
          background:
            radial-gradient(circle at 78% 28%, rgba(25, 77, 150, 0.55), transparent 36%),
            radial-gradient(circle at 15% 88%, rgba(160, 29, 39, 0.22), transparent 34%),
            linear-gradient(135deg, #030915 0%, #071324 45%, #040812 100%);
          color: #ffffff;
          font-family: Arial, Helvetica, sans-serif;
          padding-bottom: 120px;
        }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 50;
          min-height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 16px 32px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(3, 9, 21, 0.88);
          backdrop-filter: blur(18px);
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: #ffffff;
          text-decoration: none;
          white-space: nowrap;
          font-size: 18px;
        }

        .brandOrb {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background:
            radial-gradient(circle at 45% 40%, #ffe27a 0%, #4da1ff 35%, #08203d 68%, #06101f 100%);
          box-shadow: 0 0 22px rgba(78, 151, 255, 0.55);
          flex: 0 0 auto;
        }

        .desktopNav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .desktopNav a,
        .mobileMenu a,
        .loginButton,
        .menuButton {
          color: #ffffff;
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 999px;
          padding: 9px 15px;
          font-weight: 800;
          background: rgba(255, 255, 255, 0.03);
        }

        .desktopNav a:hover,
        .mobileMenu a:hover,
        .loginButton:hover,
        .menuButton:hover {
          border-color: rgba(243, 196, 84, 0.9);
          color: #f3c454;
        }

        .topActions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .languageSelect {
          min-width: 150px;
          max-width: 220px;
          color: #f8d96b;
          background: #05070c;
          border: 1px solid rgba(243, 196, 84, 0.55);
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 900;
          outline: none;
        }

        .languageSelect option {
          color: #f8d96b;
          background: #05070c;
        }

        .menuButton {
          display: none;
          cursor: pointer;
        }

        .mobileMenu {
          display: none;
        }

        .heroShell {
          width: min(1280px, calc(100% - 48px));
          margin: 0 auto;
          padding: 84px 0 36px;
          display: grid;
          grid-template-columns: 1fr 0.98fr;
          gap: 32px;
          align-items: center;
        }

        .heroCopy {
          min-width: 0;
        }

        .eyebrow,
        .sosBadge {
          margin: 0 0 22px;
          color: #f3c454;
          letter-spacing: 0.46em;
          font-size: 12px;
          font-weight: 900;
        }

        h1 {
          margin: 0;
          display: grid;
          gap: 2px;
          font-size: clamp(46px, 6.4vw, 92px);
          line-height: 0.98;
          letter-spacing: -0.07em;
          max-width: 760px;
        }

        .goldText {
          color: #e7b941;
        }

        .subtitle {
          margin: 26px 0 0;
          max-width: 680px;
          color: #b8c7df;
          font-size: clamp(18px, 2.3vw, 24px);
          line-height: 1.65;
        }

        .heroActions,
        .sosHeroActions {
          margin-top: 28px;
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .goldAction,
        .redAction,
        .darkAction {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 56px;
          border-radius: 999px;
          padding: 0 26px;
          text-decoration: none;
          font-weight: 950;
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .goldAction {
          color: #05070c;
          background: linear-gradient(135deg, #e4ae35, #ffe778);
          box-shadow: 0 20px 50px rgba(224, 177, 62, 0.22);
        }

        .redAction {
          color: #ffffff;
          background: linear-gradient(135deg, #e82028, #ff444d);
          box-shadow: 0 22px 55px rgba(255, 47, 58, 0.28);
        }

        .darkAction {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.04);
        }

        .sosHero {
          grid-column: 1 / -1;
          order: -1;
          border: 1px solid rgba(255, 67, 82, 0.45);
          border-radius: 34px;
          padding: clamp(26px, 4vw, 42px);
          background:
            radial-gradient(circle at 15% 0%, rgba(226, 32, 40, 0.28), transparent 36%),
            linear-gradient(135deg, rgba(56, 10, 22, 0.78), rgba(8, 13, 27, 0.94));
          box-shadow: 0 26px 80px rgba(0, 0, 0, 0.32);
        }

        .sosHero h2 {
          margin: 0;
          font-size: clamp(34px, 5vw, 70px);
          line-height: 1;
          letter-spacing: -0.06em;
        }

        .sosHero p:not(.sosBadge) {
          margin: 24px 0 0;
          color: #d7dfef;
          font-size: clamp(18px, 2.2vw, 24px);
          line-height: 1.55;
          max-width: 1040px;
        }

        .orbPanel {
          min-height: 560px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .planetOrb {
          position: relative;
          width: min(92vw, 520px);
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 50%, rgba(249, 205, 83, 0.28) 0%, rgba(20, 68, 133, 0.5) 12%, rgba(9, 25, 49, 0.95) 58%, rgba(3, 8, 17, 1) 72%);
          box-shadow:
            0 0 110px rgba(36, 108, 225, 0.28),
            inset 0 0 80px rgba(70, 128, 220, 0.12);
          overflow: hidden;
        }

        .ring {
          position: absolute;
          border-radius: 50%;
          border: 3px solid rgba(70, 130, 230, 0.5);
          inset: 18%;
        }

        .ringOne {
          inset: 16%;
        }

        .ringTwo {
          inset: 28%;
        }

        .ringThree {
          inset: 40%;
        }

        .coreOrb {
          position: absolute;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, #ffffff 0%, #ffe38a 24%, #dba42f 52%, #14315d 78%);
          box-shadow: 0 0 55px rgba(255, 210, 85, 0.85);
        }

        .emergencyGrid {
          width: min(1280px, calc(100% - 48px));
          margin: 28px auto 0;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
        }

        .featureCard {
          min-height: 170px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 24px;
          color: #ffffff;
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          padding: 28px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.025));
        }

        .featureCard h3 {
          margin: 0;
          color: #ffdf70;
          font-size: clamp(22px, 2.3vw, 32px);
          line-height: 1.1;
        }

        .featureCard p {
          margin: 0;
          color: #bcc8dc;
          font-size: 17px;
          line-height: 1.55;
        }

        .featureCard.red {
          border-color: rgba(255, 67, 82, 0.5);
          background: linear-gradient(135deg, rgba(124, 16, 27, 0.84), rgba(16, 22, 36, 0.92));
        }

        .featureCard.gold,
        .featureCard.proof {
          border-color: rgba(243, 196, 84, 0.35);
          background: linear-gradient(135deg, rgba(75, 60, 15, 0.38), rgba(16, 22, 36, 0.92));
        }

        .coveragePanel {
          width: min(1280px, calc(100% - 48px));
          margin: 24px auto 0;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .coveragePanel article {
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          padding: 30px;
          background: rgba(255, 255, 255, 0.035);
        }

        .coveragePanel h2 {
          margin: 0 0 14px;
          color: #ffdf70;
          font-size: clamp(24px, 2.2vw, 34px);
        }

        .coveragePanel p {
          margin: 0;
          color: #cbd5e7;
          font-size: 18px;
          line-height: 1.65;
        }

        .truthBox {
          border-color: rgba(255, 67, 82, 0.38) !important;
          background: rgba(80, 16, 34, 0.28) !important;
        }

        .languageBox {
          border-color: rgba(66, 145, 255, 0.28) !important;
        }

        .floatingSos {
          position: fixed;
          left: 20px;
          right: 20px;
          bottom: 18px;
          z-index: 70;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 72px;
          border-radius: 22px;
          color: white;
          text-decoration: none;
          font-size: 28px;
          font-weight: 950;
          letter-spacing: 0.03em;
          background: linear-gradient(135deg, #e82028, #ff444d);
          box-shadow: 0 18px 60px rgba(255, 47, 58, 0.42);
          border: 1px solid rgba(255, 255, 255, 0.25);
        }

        @media (min-width: 900px) {
          .floatingSos {
            width: 230px;
            left: auto;
            right: 32px;
            bottom: 28px;
          }
        }

        @media (max-width: 980px) {
          .topbar {
            align-items: flex-start;
            padding: 14px 16px;
            flex-wrap: wrap;
          }

          .brand {
            width: 100%;
          }

          .desktopNav {
            display: none;
          }

          .topActions {
            width: 100%;
            justify-content: space-between;
          }

          .languageSelect {
            flex: 1;
            min-width: 0;
          }

          .loginButton {
            display: none;
          }

          .menuButton {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .mobileMenu {
            position: sticky;
            top: 104px;
            z-index: 45;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            padding: 14px 16px;
            background: rgba(3, 9, 21, 0.96);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .mobileMenu a {
            text-align: center;
            border-radius: 16px;
          }

          .mobileMenuSos {
            grid-column: 1 / -1;
            background: linear-gradient(135deg, #e82028, #ff444d) !important;
            color: #fff !important;
            border-color: rgba(255, 255, 255, 0.25) !important;
          }

          .heroShell {
            width: calc(100% - 32px);
            padding: 26px 0 24px;
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .sosHero {
            order: -2;
            padding: 24px;
            border-radius: 24px;
          }

          .sosHeroActions,
          .heroActions {
            display: grid;
            grid-template-columns: 1fr;
          }

          .goldAction,
          .redAction,
          .darkAction {
            width: 100%;
          }

          h1 {
            font-size: clamp(44px, 13vw, 70px);
          }

          .subtitle {
            font-size: 18px;
          }

          .orbPanel {
            min-height: 360px;
            order: -1;
          }

          .planetOrb {
            width: min(86vw, 430px);
          }

          .emergencyGrid {
            width: calc(100% - 32px);
            grid-template-columns: 1fr;
            gap: 16px;
            margin-top: 10px;
          }

          .featureCard {
            min-height: 150px;
            border-radius: 24px;
            padding: 26px;
          }

          .coveragePanel {
            width: calc(100% - 32px);
            grid-template-columns: 1fr;
            margin-top: 16px;
          }

          .coveragePanel article {
            border-radius: 24px;
            padding: 26px;
          }
        }

        @media (max-width: 480px) {
          .pantavionHome {
            padding-bottom: 112px;
          }

          .topbar {
            min-height: auto;
          }

          .brand {
            font-size: 17px;
          }

          .brandOrb {
            width: 32px;
            height: 32px;
          }

          .languageSelect,
          .menuButton {
            min-height: 44px;
            font-size: 14px;
          }

          .eyebrow,
          .sosBadge {
            letter-spacing: 0.36em;
            font-size: 11px;
          }

          .sosHero h2 {
            font-size: 36px;
          }

          .sosHero p:not(.sosBadge) {
            font-size: 18px;
          }

          .orbPanel {
            min-height: 320px;
          }

          .coreOrb {
            width: 74px;
            height: 74px;
          }

          .floatingSos {
            left: 16px;
            right: 16px;
            bottom: 14px;
            min-height: 70px;
            border-radius: 20px;
          }
        }
      `}</style>
    </main>
  );
}