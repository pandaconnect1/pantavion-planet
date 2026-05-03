"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  PantavionSosContact,
  PantavionSosDispatchResult,
  PantavionSosLocation,
  PantavionSosPacket,
  PantavionSosProfile,
} from "@/types/pantavion-sos";
import {
  createDefaultSosProfile,
  createPantavionId,
  createSosPacket,
  loadSosProfile,
  loadSosQueue,
  queueSosPacket,
  saveSosProfile,
  saveSosQueue,
} from "@/core/emergency/sos-storage";
import {
  emergencyLanguages,
  normalizeEmergencyLanguage,
  type EmergencyLanguage,
} from "@/core/emergency/lifeshield-emergency-i18n";

type SosLogItem = {
  id: string;
  at: string;
  status: "ok" | "limited" | "error";
  message: string;
};

const SOS_LOG_KEY = "pantavion.sos.liveActionLog.v1";

const sosCopy = {
  en: {
    back: "Back to Emergency System",
    language: "Language",
    queued: "Queued SOS",
    badge: "Live Pantavion SOS",
    title: "Real SOS Command Center",
    intro:
      "This is an operational browser/PWA SOS layer. Every button below runs a real browser, local, API, phone, SMS, share, map, audio, vibration, queue, or download action.",
    activate: "ACTIVATE SOS NOW",
    capture: "Capture location",
    startTracking: "Start live tracking",
    stopTracking: "Stop live tracking",
    call: "Call emergency number",
    sms: "SMS first contact",
    share: "Share SOS packet",
    copy: "Copy SOS packet",
    download: "Download SOS packet",
    replay: "Replay queued SOS",
    visualBeacon: "Start visual beacon",
    sound: "Emit SOS sound",
    vibrate: "Vibrate SOS",
    map: "Open map",
    status: "Live status",
    actionLog: "Live action log",
    network: "Network",
    online: "online",
    offline: "offline",
    noLocation: "No location captured yet.",
    profile: "Live Emergency Profile",
    contacts: "Emergency Contacts",
    saveProfile: "Save profile",
    addContact: "Add contact",
    removeContact: "Remove contact",
    fullName: "Full name",
    primaryLanguage: "Primary language",
    emergencyNumber: "Emergency number",
    bloodType: "Blood type",
    medicalNotes: "Medical notes",
    allergies: "Allergies",
    consent:
      "I consent to Pantavion using this emergency data for SOS actions, local storage, offline queue, sharing, SMS/call actions, and backend dispatch where configured.",
    packet: "Current Live SOS Packet",
    noContacts: "No contacts yet. Add at least one phone number for SMS.",
    noFakeRule:
      "No static buttons: every action either executes now or reports the exact missing permission, device capability, contact, location, webhook, or operating-system handler.",
  },
  el: {
    back: "Πίσω στο Emergency System",
    language: "Γλώσσα",
    queued: "SOS στην ουρά",
    badge: "Ζωντανό Pantavion SOS",
    title: "Πραγματικό Κέντρο SOS",
    intro:
      "Αυτό είναι λειτουργικό browser/PWA SOS layer. Κάθε κουμπί εκτελεί πραγματική ενέργεια: browser, local storage, API, τηλέφωνο, SMS, share, χάρτη, ήχο, δόνηση, offline ουρά ή download.",
    activate: "ΕΝΕΡΓΟΠΟΙΗΣΗ SOS ΤΩΡΑ",
    capture: "Λήψη τοποθεσίας",
    startTracking: "Έναρξη live tracking",
    stopTracking: "Διακοπή live tracking",
    call: "Κλήση αριθμού ανάγκης",
    sms: "SMS στην πρώτη επαφή",
    share: "Κοινοποίηση SOS packet",
    copy: "Αντιγραφή SOS packet",
    download: "Λήψη SOS packet",
    replay: "Αποστολή queued SOS",
    visualBeacon: "Έναρξη οπτικού beacon",
    sound: "Εκπομπή SOS ήχου",
    vibrate: "SOS δόνηση",
    map: "Άνοιγμα χάρτη",
    status: "Ζωντανή κατάσταση",
    actionLog: "Ζωντανό ιστορικό ενεργειών",
    network: "Δίκτυο",
    online: "online",
    offline: "offline",
    noLocation: "Δεν έχει ληφθεί ακόμα τοποθεσία.",
    profile: "Ζωντανό Emergency Προφίλ",
    contacts: "Επαφές ανάγκης",
    saveProfile: "Αποθήκευση προφίλ",
    addContact: "Προσθήκη επαφής",
    removeContact: "Αφαίρεση επαφής",
    fullName: "Ονοματεπώνυμο",
    primaryLanguage: "Κύρια γλώσσα",
    emergencyNumber: "Αριθμός ανάγκης",
    bloodType: "Ομάδα αίματος",
    medicalNotes: "Ιατρικές σημειώσεις",
    allergies: "Αλλεργίες",
    consent:
      "Συναινώ να χρησιμοποιεί το Pantavion αυτά τα emergency δεδομένα για SOS ενέργειες, τοπική αποθήκευση, offline ουρά, κοινοποίηση, SMS/κλήση και backend dispatch όπου έχει ρυθμιστεί.",
    packet: "Τρέχον Ζωντανό SOS Packet",
    noContacts: "Δεν υπάρχουν επαφές. Βάλε τουλάχιστον ένα κινητό για SMS.",
    noFakeRule:
      "Κανένα στατικό κουμπί: κάθε ενέργεια είτε εκτελείται τώρα είτε αναφέρει ακριβώς τι λείπει — άδεια, δυνατότητα συσκευής, επαφή, τοποθεσία, webhook ή handler λειτουργικού.",
  },
};

const sosFallbackCopy: Partial<Record<EmergencyLanguage, Partial<typeof sosCopy.en>>> = {
  es: { title: "Centro real de SOS", language: "Idioma", activate: "ACTIVAR SOS AHORA", capture: "Capturar ubicación", call: "Llamar a emergencias", sms: "SMS al primer contacto", map: "Abrir mapa", status: "Estado en vivo", network: "Red" },
  fr: { title: "Centre SOS réel", language: "Langue", activate: "ACTIVER SOS MAINTENANT", capture: "Capturer la position", call: "Appeler les urgences", sms: "SMS au premier contact", map: "Ouvrir la carte", status: "État en direct", network: "Réseau" },
  de: { title: "Echte SOS-Zentrale", language: "Sprache", activate: "SOS JETZT AKTIVIEREN", capture: "Standort erfassen", call: "Notruf anrufen", sms: "SMS an ersten Kontakt", map: "Karte öffnen", status: "Live-Status", network: "Netzwerk" },
  it: { title: "Centro SOS reale", language: "Lingua", activate: "ATTIVA SOS ORA", capture: "Rileva posizione", call: "Chiama emergenza", sms: "SMS al primo contatto", map: "Apri mappa", status: "Stato live", network: "Rete" },
  pt: { title: "Centro SOS real", language: "Idioma", activate: "ATIVAR SOS AGORA", capture: "Capturar localização", call: "Ligar para emergência", sms: "SMS ao primeiro contato", map: "Abrir mapa", status: "Estado ao vivo", network: "Rede" },
  ar: { title: "مركز SOS الحقيقي", language: "اللغة", activate: "تفعيل SOS الآن", capture: "التقاط الموقع", call: "اتصال بالطوارئ", sms: "رسالة لأول جهة اتصال", map: "فتح الخريطة", status: "الحالة المباشرة", network: "الشبكة" },
  tr: { title: "Gerçek SOS Merkezi", language: "Dil", activate: "SOS'U ŞİMDİ AKTİF ET", capture: "Konumu al", call: "Acil numarayı ara", sms: "İlk kişiye SMS", map: "Haritayı aç", status: "Canlı durum", network: "Ağ" },
  ru: { title: "Реальный центр SOS", language: "Язык", activate: "АКТИВИРОВАТЬ SOS", capture: "Получить местоположение", call: "Позвонить в экстренную службу", sms: "SMS первому контакту", map: "Открыть карту", status: "Текущий статус", network: "Сеть" },
  zh: { title: "真实 SOS 指挥中心", language: "语言", activate: "立即启动 SOS", capture: "获取位置", call: "拨打紧急电话", sms: "短信给第一联系人", map: "打开地图", status: "实时状态", network: "网络" },
  ja: { title: "リアルSOSセンター", language: "言語", activate: "今すぐSOSを起動", capture: "位置を取得", call: "緊急番号に電話", sms: "最初の連絡先へSMS", map: "地図を開く", status: "ライブ状態", network: "ネットワーク" },
  hi: { title: "वास्तविक SOS केंद्र", language: "भाषा", activate: "SOS अभी सक्रिय करें", capture: "स्थान प्राप्त करें", call: "आपातकालीन नंबर पर कॉल करें", sms: "पहले संपर्क को SMS", map: "मानचित्र खोलें", status: "लाइव स्थिति", network: "नेटवर्क" },
  ko: { title: "실제 SOS 센터", language: "언어", activate: "지금 SOS 활성화", capture: "위치 가져오기", call: "긴급 번호로 전화", sms: "첫 연락처로 SMS", map: "지도 열기", status: "실시간 상태", network: "네트워크" },
  vi: { title: "Trung tâm SOS thật", language: "Ngôn ngữ", activate: "KÍCH HOẠT SOS NGAY", capture: "Lấy vị trí", call: "Gọi số khẩn cấp", sms: "SMS liên hệ đầu tiên", map: "Mở bản đồ", status: "Trạng thái trực tiếp", network: "Mạng" },
  id: { title: "Pusat SOS nyata", language: "Bahasa", activate: "AKTIFKAN SOS SEKARANG", capture: "Ambil lokasi", call: "Telepon darurat", sms: "SMS kontak pertama", map: "Buka peta", status: "Status langsung", network: "Jaringan" },
};

function getCopy(language: EmergencyLanguage) {
  return {
    ...sosCopy.en,
    ...(language === "el" ? sosCopy.el : {}),
    ...(sosFallbackCopy[language] ?? {}),
  };
}

function toSosLocation(position: GeolocationPosition): PantavionSosLocation {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: Number.isFinite(position.coords.accuracy)
      ? position.coords.accuracy
      : null,
    altitude: position.coords.altitude,
    heading: position.coords.heading,
    speed: position.coords.speed,
    timestamp: new Date(position.timestamp).toISOString(),
  };
}

async function postSosPacket(packet: PantavionSosPacket) {
  const response = await fetch("/api/sos/dispatch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(packet),
  });

  return (await response.json()) as PantavionSosDispatchResult;
}

function readLog(): SosLogItem[] {
  try {
    const raw = window.localStorage.getItem(SOS_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SosLogItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLog(items: SosLogItem[]) {
  window.localStorage.setItem(SOS_LOG_KEY, JSON.stringify(items.slice(0, 30)));
}

export default function SOSPage() {
  const [language, setLanguage] = useState<EmergencyLanguage>("en");
  const [profile, setProfile] = useState<PantavionSosProfile>(
    createDefaultSosProfile()
  );
  const [location, setLocation] = useState<PantavionSosLocation | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const [status, setStatus] = useState("SOS system ready.");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [visualBeacon, setVisualBeacon] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [logs, setLogs] = useState<SosLogItem[]>([]);
  const watchIdRef = useRef<number | null>(null);

  const copy = getCopy(language);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("pantavion-emergency-language");
    const detected = normalizeEmergencyLanguage(
      storedLanguage || window.navigator.language
    );

    setLanguage(detected);
    setProfile(loadSosProfile());
    setQueueCount(loadSosQueue().length);
    setIsOnline(window.navigator.onLine);
    setLogs(readLog());
  }, []);

  useEffect(() => {
    const onlineHandler = () => {
      setIsOnline(true);
      addLog("ok", "Device came online.");
      replayQueuedSos();
    };

    const offlineHandler = () => {
      setIsOnline(false);
      addLog("limited", "Device went offline. SOS will queue locally.");
    };

    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);

    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);

  const currentPacket = useMemo(
    () => createSosPacket(profile, location, !isOnline),
    [profile, location, isOnline]
  );

  function addLog(logStatus: SosLogItem["status"], message: string) {
    const item: SosLogItem = {
      id: createPantavionId("log"),
      at: new Date().toISOString(),
      status: logStatus,
      message,
    };

    setLogs((current) => {
      const next = [item, ...current].slice(0, 30);
      writeLog(next);
      return next;
    });
  }

  function changeLanguage(next: EmergencyLanguage) {
    setLanguage(next);
    window.localStorage.setItem("pantavion-emergency-language", next);
    addLog("ok", "Language changed to " + next + ".");
  }

  function updateProfile<K extends keyof PantavionSosProfile>(
    key: K,
    value: PantavionSosProfile[K]
  ) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function saveProfileNow() {
    saveSosProfile(profile);
    setStatus("Emergency profile saved on this device.");
    setError("");
    addLog("ok", "Emergency profile saved locally.");
  }

  function addContact() {
    const contact: PantavionSosContact = {
      id: createPantavionId("contact"),
      name: "",
      phone: "",
      email: "",
      relation: "",
    };

    setProfile((current) => ({
      ...current,
      contacts: [...current.contacts, contact],
    }));

    addLog("ok", "Emergency contact row added.");
  }

  function updateContact(
    id: string,
    field: keyof PantavionSosContact,
    value: string
  ) {
    setProfile((current) => ({
      ...current,
      contacts: current.contacts.map((contact) =>
        contact.id === id ? { ...contact, [field]: value } : contact
      ),
    }));
  }

  function removeContact(id: string) {
    setProfile((current) => ({
      ...current,
      contacts: current.contacts.filter((contact) => contact.id !== id),
    }));

    addLog("ok", "Emergency contact removed.");
  }

  function captureLocation() {
    setError("");

    if (!("geolocation" in navigator)) {
      const message = "This device/browser does not support geolocation.";
      setError(message);
      addLog("error", message);
      return;
    }

    setStatus("Requesting location permission...");
    addLog("limited", "Requesting location permission.");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(toSosLocation(position));
        setStatus("Location captured.");
        addLog("ok", "Location captured successfully.");
      },
      (locationError) => {
        const message = locationError.message || "Location permission failed.";
        setError(message);
        setStatus("Location unavailable.");
        addLog("error", message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  function startLiveLocation() {
    setError("");

    if (!("geolocation" in navigator)) {
      const message = "This device/browser does not support live geolocation.";
      setError(message);
      addLog("error", message);
      return;
    }

    if (watchIdRef.current !== null) {
      setStatus("Live location is already active.");
      addLog("limited", "Live location was already active.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocation(toSosLocation(position));
        setStatus("Live location active.");
      },
      (locationError) => {
        const message = locationError.message || "Live location failed.";
        setError(message);
        addLog("error", message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    setStatus("Starting live location...");
    addLog("ok", "Live location tracking started.");
  }

  function stopLiveLocation() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setStatus("Live location stopped.");
      addLog("ok", "Live location tracking stopped.");
      return;
    }

    addLog("limited", "Live location was not running.");
  }

  function vibrateSos() {
    const nav = navigator as Navigator & {
      vibrate?: (pattern: number | number[]) => boolean;
    };

    if (typeof nav.vibrate === "function") {
      nav.vibrate([500, 200, 500, 200, 1000]);
      setStatus("SOS vibration sent to device.");
      addLog("ok", "Vibration API executed.");
      return;
    }

    const message = "Vibration/haptic alert is not supported on this device/browser.";
    setError(message);
    addLog("limited", message);
  }

  function playSosSound() {
    type AudioWindow = Window &
      typeof globalThis & {
        webkitAudioContext?: typeof AudioContext;
      };

    const audioWindow = window as AudioWindow;
    const AudioCtor = audioWindow.AudioContext || audioWindow.webkitAudioContext;

    if (!AudioCtor) {
      const message = "AudioContext is not supported on this device/browser.";
      setError(message);
      addLog("error", message);
      return;
    }

    const audio = new AudioCtor();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audio.currentTime);
    oscillator.frequency.setValueAtTime(1320, audio.currentTime + 0.35);
    oscillator.frequency.setValueAtTime(880, audio.currentTime + 0.7);

    gain.gain.setValueAtTime(0.001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, audio.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 1.2);

    oscillator.connect(gain);
    gain.connect(audio.destination);

    oscillator.start();
    oscillator.stop(audio.currentTime + 1.25);
    oscillator.onended = () => {
      audio.close().catch(() => undefined);
    };

    setStatus("SOS sound emitted.");
    addLog("ok", "SOS sound emitted through AudioContext.");
  }

  async function activateSosNow() {
    setError("");
    setSending(true);
    saveSosProfile(profile);

    if (!profile.consent) {
      const message = "Consent must be enabled before SOS can use emergency profile data.";
      setSending(false);
      setError(message);
      addLog("error", message);
      return;
    }

    vibrateSos();
    setVisualBeacon(true);

    const packet = createSosPacket(profile, location, !isOnline);

    if (!isOnline) {
      queueSosPacket(packet);
      setQueueCount(loadSosQueue().length);
      setSending(false);
      setStatus("Device is offline. SOS packet saved in local queue.");
      addLog("limited", "Offline SOS packet saved locally.");
      return;
    }

    try {
      const result = await postSosPacket(packet);

      if (!result.ok) {
        queueSosPacket(packet);
        setQueueCount(loadSosQueue().length);
        setError(result.message);
        setStatus("SOS kept locally because dispatch was not fully delivered.");
        addLog("error", result.message);
        return;
      }

      setStatus(result.message);
      addLog("ok", "SOS API dispatch completed: " + result.delivery + ".");
    } catch {
      queueSosPacket(packet);
      setQueueCount(loadSosQueue().length);
      const message = "Network/API dispatch failed. SOS packet saved in local queue.";
      setError(message);
      addLog("error", message);
    } finally {
      setSending(false);
    }
  }

  async function replayQueuedSos() {
    setError("");

    const queue = loadSosQueue();

    if (!queue.length) {
      setQueueCount(0);
      setStatus("No queued SOS packets.");
      addLog("limited", "Replay checked: queue empty.");
      return;
    }

    if (!navigator.onLine) {
      setStatus("Still offline. Queued SOS packets remain stored locally.");
      addLog("limited", "Replay blocked: device offline.");
      return;
    }

    setStatus("Replaying queued SOS packets...");
    addLog("limited", "Replay started for " + queue.length + " packet(s).");

    const remaining: PantavionSosPacket[] = [];

    for (const packet of queue) {
      try {
        const result = await postSosPacket({
          ...packet,
          offlineQueued: false,
          deliveryAttempts: packet.deliveryAttempts + 1,
        });

        if (!result.ok) {
          remaining.push(packet);
        }
      } catch {
        remaining.push(packet);
      }
    }

    saveSosQueue(remaining);
    setQueueCount(remaining.length);

    if (remaining.length === 0) {
      setStatus("All queued SOS packets replayed.");
      addLog("ok", "All queued SOS packets replayed.");
    } else {
      setStatus(`${remaining.length} SOS packet(s) still queued.`);
      addLog("limited", `${remaining.length} SOS packet(s) still queued.`);
    }
  }

  function callEmergencyNumber() {
    if (!profile.emergencyNumber.trim()) {
      const message = "Emergency number is empty.";
      setError(message);
      addLog("error", message);
      return;
    }

    addLog("ok", "Opening tel handler for " + profile.emergencyNumber.trim() + ".");
    window.location.href = `tel:${profile.emergencyNumber.trim()}`;
  }

  function smsFirstContact() {
    const firstContact = profile.contacts.find((contact) =>
      contact.phone.trim()
    );

    if (!firstContact) {
      const message = "Add at least one emergency contact with phone number.";
      setError(message);
      addLog("error", message);
      return;
    }

    addLog("ok", "Opening SMS handler for " + firstContact.phone.trim() + ".");
    window.location.href = `sms:${firstContact.phone.trim()}?&body=${encodeURIComponent(
      currentPacket.message
    )}`;
  }

  async function copyPacket() {
    try {
      await navigator.clipboard.writeText(currentPacket.message);
      setStatus("SOS packet copied.");
      setError("");
      addLog("ok", "SOS packet copied to clipboard.");
    } catch {
      const message = "Clipboard is not available on this device/browser.";
      setError(message);
      addLog("error", message);
    }
  }

  async function sharePacket() {
    const nav = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };

    try {
      if (typeof nav.share === "function") {
        await nav.share({
          title: "Pantavion SOS",
          text: currentPacket.message,
        });
        setStatus("SOS packet shared.");
        addLog("ok", "Native share API executed.");
        return;
      }

      await copyPacket();
      addLog("limited", "Native share unavailable; copied packet instead.");
    } catch {
      const message = "Share failed or was cancelled.";
      setError(message);
      addLog("limited", message);
    }
  }

  function downloadPacket() {
    const blob = new Blob([JSON.stringify(currentPacket, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `pantavion-sos-${currentPacket.id}.json`;
    link.click();

    URL.revokeObjectURL(url);
    setStatus("SOS packet downloaded.");
    addLog("ok", "SOS packet downloaded as JSON.");
  }

  function openMap() {
    if (!location) {
      const message = "Capture location first.";
      setError(message);
      addLog("error", message);
      return;
    }

    addLog("ok", "Opening map for current SOS location.");
    window.open(
      `https://www.google.com/maps?q=${location.lat},${location.lng}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] px-6 py-10 text-white">
      {visualBeacon ? (
        <button
          onClick={() => {
            setVisualBeacon(false);
            addLog("ok", "Visual SOS beacon closed.");
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-red-600 text-center text-5xl font-black text-white animate-pulse"
        >
          SOS ACTIVE — TAP TO CLOSE VISUAL BEACON
        </button>
      ) : null}

      <section className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="rounded-[2rem] border border-red-400/40 bg-gradient-to-br from-[#27070b] via-[#0d1020] to-black p-8 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/pantavion/emergency"
              className="rounded-full border border-yellow-300/30 px-4 py-2 text-sm font-semibold text-yellow-100 hover:bg-yellow-300/10"
            >
              ← {copy.back}
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <span>{copy.language}</span>
                <select
                  value={language}
                  onChange={(event) =>
                    changeLanguage(event.target.value as EmergencyLanguage)
                  }
                  className="rounded-full border border-yellow-300/30 bg-black px-4 py-2 text-yellow-100"
                >
                  {emergencyLanguages.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200">
                {copy.queued}: {queueCount}
              </div>
            </div>
          </div>

          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.35em] text-red-300">
            {copy.badge}
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-bold leading-tight md:text-6xl">
            {copy.title}
          </h1>

          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-200">
            {copy.intro}
          </p>

          <p className="mt-5 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4 text-sm leading-6 text-yellow-50">
            {copy.noFakeRule}
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <button onClick={activateSosNow} disabled={sending} className="rounded-2xl border border-red-200/50 bg-red-600 px-5 py-5 text-left text-xl font-black text-white hover:bg-red-500 disabled:opacity-60">
              {sending ? "SENDING SOS..." : copy.activate}
            </button>
            <button onClick={captureLocation} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10">{copy.capture}</button>
            <button onClick={startLiveLocation} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10">{copy.startTracking}</button>
            <button onClick={stopLiveLocation} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10">{copy.stopTracking}</button>
            <button onClick={callEmergencyNumber} className="rounded-2xl border border-yellow-300/30 bg-yellow-300/10 px-5 py-4 text-left font-bold text-yellow-100 hover:bg-yellow-300/20">{copy.call}</button>
            <button onClick={smsFirstContact} className="rounded-2xl border border-yellow-300/30 bg-yellow-300/10 px-5 py-4 text-left font-bold text-yellow-100 hover:bg-yellow-300/20">{copy.sms}</button>
            <button onClick={sharePacket} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10">{copy.share}</button>
            <button onClick={copyPacket} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10">{copy.copy}</button>
            <button onClick={downloadPacket} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10">{copy.download}</button>
            <button onClick={replayQueuedSos} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10">{copy.replay}</button>
            <button onClick={() => { setVisualBeacon(true); addLog("ok", "Visual SOS beacon opened."); }} className="rounded-2xl border border-red-300/30 bg-red-500/20 px-5 py-4 text-left font-bold text-red-100 hover:bg-red-500/30">{copy.visualBeacon}</button>
            <button onClick={playSosSound} className="rounded-2xl border border-red-300/30 bg-red-500/20 px-5 py-4 text-left font-bold text-red-100 hover:bg-red-500/30">{copy.sound}</button>
            <button onClick={vibrateSos} className="rounded-2xl border border-red-300/30 bg-red-500/20 px-5 py-4 text-left font-bold text-red-100 hover:bg-red-500/30">{copy.vibrate}</button>
            <button onClick={openMap} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10">{copy.map}</button>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-200">
                {copy.status}
              </p>
              <p className="mt-3 text-lg text-white">{status}</p>
              {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
              <p className="mt-3 text-sm text-slate-300">
                {copy.network}: {isOnline ? copy.online : copy.offline}
              </p>
              {location ? (
                <p className="mt-2 text-sm text-slate-300">
                  Location: {location.lat}, {location.lng} | accuracy{" "}
                  {location.accuracy ?? "unknown"}m
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-400">{copy.noLocation}</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-200">
                {copy.actionLog}
              </p>
              <div className="mt-3 max-h-48 space-y-2 overflow-auto">
                {logs.length === 0 ? (
                  <p className="text-sm text-slate-400">No actions yet.</p>
                ) : null}
                {logs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                    <span className={log.status === "ok" ? "text-emerald-300" : log.status === "error" ? "text-red-300" : "text-yellow-200"}>
                      {log.status.toUpperCase()}
                    </span>{" "}
                    <span className="text-slate-300">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-8 xl:grid-cols-[1.15fr,0.85fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-yellow-200">{copy.profile}</h2>
              <button onClick={saveProfileNow} className="rounded-full border border-yellow-300/30 px-4 py-2 text-sm font-bold text-yellow-100 hover:bg-yellow-300/10">
                {copy.saveProfile}
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input value={profile.fullName} onChange={(event) => updateProfile("fullName", event.target.value)} placeholder={copy.fullName} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none" />
              <input value={profile.primaryLanguage} onChange={(event) => updateProfile("primaryLanguage", event.target.value)} placeholder={copy.primaryLanguage} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none" />
              <input value={profile.emergencyNumber} onChange={(event) => updateProfile("emergencyNumber", event.target.value)} placeholder={copy.emergencyNumber} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none" />
              <input value={profile.bloodType} onChange={(event) => updateProfile("bloodType", event.target.value)} placeholder={copy.bloodType} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none" />
              <textarea value={profile.medicalNotes} onChange={(event) => updateProfile("medicalNotes", event.target.value)} placeholder={copy.medicalNotes} rows={4} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none md:col-span-2" />
              <textarea value={profile.allergies} onChange={(event) => updateProfile("allergies", event.target.value)} placeholder={copy.allergies} rows={3} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none md:col-span-2" />
            </div>

            <label className="mt-5 flex items-start gap-3 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4">
              <input type="checkbox" checked={profile.consent} onChange={(event) => updateProfile("consent", event.target.checked)} className="mt-1" />
              <span className="text-sm leading-6 text-yellow-50">{copy.consent}</span>
            </label>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-yellow-200">{copy.contacts}</h2>
              <button onClick={addContact} className="rounded-full border border-yellow-300/30 px-4 py-2 text-sm font-bold text-yellow-100 hover:bg-yellow-300/10">
                {copy.addContact}
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {profile.contacts.length === 0 ? (
                <p className="text-sm text-slate-400">{copy.noContacts}</p>
              ) : null}

              {profile.contacts.map((contact) => (
                <div key={contact.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="grid gap-3">
                    <input value={contact.name} onChange={(event) => updateContact(contact.id, "name", event.target.value)} placeholder="Name" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none" />
                    <input value={contact.phone} onChange={(event) => updateContact(contact.id, "phone", event.target.value)} placeholder="Phone" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none" />
                    <input value={contact.email} onChange={(event) => updateContact(contact.id, "email", event.target.value)} placeholder="Email" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none" />
                    <input value={contact.relation} onChange={(event) => updateContact(contact.id, "relation", event.target.value)} placeholder="Relation" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none" />
                  </div>

                  <button onClick={() => removeContact(contact.id)} className="mt-3 rounded-full border border-red-300/30 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-500/10">
                    {copy.removeContact}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-bold text-yellow-200">{copy.packet}</h2>
          <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-200">
            {currentPacket.message}
          </pre>
        </section>
      </section>
    </main>
  );
}
