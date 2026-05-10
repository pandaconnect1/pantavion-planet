"use client";

import { useMemo, useState } from "react";

const languages = [
  { code: "el", nativeName: "Î•Î»Î»Î·Î½Î¹ÎºÎ¬", label: "Greek / Cyprus", region: "ÎšÏÏ€ÏÎ¿Ï‚ Â· Î•Î»Î»Î¬Î´Î±" },
  { code: "en", nativeName: "English", label: "English", region: "Global" },
  { code: "tr", nativeName: "TÃ¼rkÃ§e", label: "Turkish", region: "ÎšÏÏ€ÏÎ¿Ï‚ Â· Î¤Î¿Ï…ÏÎºÎ¯Î±" },
  { code: "ar", nativeName: "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©", label: "Arabic", region: "ÎœÎ­ÏƒÎ· Î‘Î½Î±Ï„Î¿Î»Î® Â· Î‘Ï†ÏÎ¹ÎºÎ®", dir: "rtl" },
  { code: "ar-sy", nativeName: "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø§Ù„Ø³ÙˆØ±ÙŠØ©", label: "Arabic / Syria", region: "Î£ÏÏÎ¹Î¿Î¹", dir: "rtl" },
  { code: "ar-ps", nativeName: "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø§Ù„ÙÙ„Ø³Ø·ÙŠÙ†ÙŠØ©", label: "Arabic / Palestine", region: "Î Î±Î»Î±Î¹ÏƒÏ„Î¯Î½Î¹Î¿Î¹", dir: "rtl" },
  { code: "ru", nativeName: "Ð ÑƒÑÑÐºÐ¸Ð¹", label: "Russian", region: "ÎšÏÏ€ÏÎ¿Ï‚ Â· Î•Ï…ÏÏŽÏ€Î· Â· Î‘ÏƒÎ¯Î±" },
  { code: "uk", nativeName: "Ð£ÐºÑ€Ð°Ñ—Ð½ÑÑŒÐºÐ°", label: "Ukrainian", region: "Î•Ï…ÏÏŽÏ€Î·" },
  { code: "zh", nativeName: "ä¸­æ–‡", label: "Chinese", region: "Î‘ÏƒÎ¯Î±" },
  { code: "pl", nativeName: "Polski", label: "Polish", region: "ÎšÏÏ€ÏÎ¿Ï‚ Â· Î•Ï…ÏÏŽÏ€Î·" },
  { code: "hy", nativeName: "Õ€Õ¡ÕµÕ¥Ö€Õ¥Õ¶", label: "Armenian", region: "ÎšÏÏ€ÏÎ¿Ï‚ Â· Î‘ÏÎ¼ÎµÎ½Î¯Î±" },
  { code: "ro", nativeName: "RomÃ¢nÄƒ", label: "Romanian", region: "ÎšÏÏ€ÏÎ¿Ï‚ Â· Î•Ï…ÏÏŽÏ€Î·" },
  { code: "bg", nativeName: "Ð‘ÑŠÐ»Ð³Ð°Ñ€ÑÐºÐ¸", label: "Bulgarian", region: "ÎšÏÏ€ÏÎ¿Ï‚ Â· Î•Ï…ÏÏŽÏ€Î·" },
  { code: "fil", nativeName: "Filipino / Tagalog", label: "Filipino", region: "Î¦Î¹Î»Î¹Ï€Ï€Î¯Î½ÎµÏ‚" },
  { code: "ne", nativeName: "à¤¨à¥‡à¤ªà¤¾à¤²à¥€", label: "Nepali", region: "ÎÎµÏ€Î¬Î»" },
  { code: "hi", nativeName: "à¤¹à¤¿à¤¨à¥à¤¦à¥€", label: "Hindi", region: "Î™Î½Î´Î¯Î±" },
  { code: "ur", nativeName: "Ø§Ø±Ø¯Ùˆ", label: "Urdu", region: "Î Î±ÎºÎ¹ÏƒÏ„Î¬Î½ Â· Î™Î½Î´Î¯Î±", dir: "rtl" },
  { code: "bn", nativeName: "à¦¬à¦¾à¦‚à¦²à¦¾", label: "Bengali", region: "ÎœÏ€Î±Î³ÎºÎ»Î±Î½Ï„Î­Ï‚ Â· Î™Î½Î´Î¯Î±" },
  { code: "pa", nativeName: "à¨ªà©°à¨œà¨¾à¨¬à©€", label: "Punjabi", region: "Î™Î½Î´Î¯Î± Â· Î Î±ÎºÎ¹ÏƒÏ„Î¬Î½" },
  { code: "ta", nativeName: "à®¤à®®à®¿à®´à¯", label: "Tamil", region: "Î™Î½Î´Î¯Î± Â· Î£ÏÎ¹ Î›Î¬Î½ÎºÎ±" },
  { code: "si", nativeName: "à·ƒà·’à¶‚à·„à¶½", label: "Sinhala", region: "Î£ÏÎ¹ Î›Î¬Î½ÎºÎ±" },
  { code: "fr", nativeName: "FranÃ§ais", label: "French", region: "Î•Ï…ÏÏŽÏ€Î· Â· Î‘Ï†ÏÎ¹ÎºÎ® Â· ÎšÎ¿Î½Î³ÎºÏŒ" },
  { code: "ln", nativeName: "LingÃ¡la", label: "Lingala", region: "ÎšÎ¿Î½Î³ÎºÏŒ" },
  { code: "sw", nativeName: "Kiswahili", label: "Swahili", region: "Î‘Ï†ÏÎ¹ÎºÎ®" },
  { code: "ku", nativeName: "KurdÃ®", label: "Kurdish", region: "ÎœÎ­ÏƒÎ· Î‘Î½Î±Ï„Î¿Î»Î®" }
] as const;

type LanguageCode = (typeof languages)[number]["code"];

type EndpointState = {
  key: string;
  label: string;
  path: string;
  expectedStatus: number;
  statusCode?: number;
  loading: boolean;
  ok: boolean;
  error?: string;
  json?: Record<string, unknown>;
};

type CopyPack = {
  languageLabel: string;
  languagePromise: string;
  title: string;
  subtitle: string;
  explanation: string;
  currentStatus: string;
  productionBlocked: string;
  blockedReason: string;
  runLiveChecks: string;
  copyPresentation: string;
  copied: string;
  printPage: string;
  exportSnapshot: string;
  openReadinessApi: string;
  openServingApi: string;
  openAddressApi: string;
  openBboxApi: string;
  liveChecksTitle: string;
  liveChecksText: string;
  lastRun: string;
  notRun: string;
  checking: string;
  notChecked: string;
  expected: string;
  jsonError: string;
  presentationTitle: string;
  presentationP1: string;
  presentationP2: string;
  readinessTitle: string;
  overallReady: string;
  productionActivationAllowed: string;
  dataReturned: string;
  mayReturnRawMaster: string;
  mayReturnCompleteNetwork: string;
  addressTitle: string;
  addressP1: string;
  addressP2: string;
  selectedCandidateRequired: string;
  mayAutoPick: string;
  bboxDataReturned: string;
  requiredBeforeProduction: string;
  safeGuaranteeTitle: string;
  safe1: string;
  safe2: string;
  safe3: string;
};

const endpoints = {
  productionReadiness: "/api/professional/infrastructure/water/production-readiness",
  servingReadiness: "/api/professional/infrastructure/water/serving/readiness",
  addressCandidates:
    "/api/professional/infrastructure/water/address/candidates?query=Makariou&city=Limassol",
  controlledBbox:
    "/api/professional/infrastructure/water/serving/bbox?minLng=33.018&minLat=34.662&maxLng=33.055&maxLat=34.692&zoom=17&targetSource=address-search&searchQuery=Makariou%20Limassol&selectedCandidateId=demo-limassol-zone-001",
};

const initialEndpointState: EndpointState[] = [
  {
    key: "production",
    label: "Production readiness",
    path: endpoints.productionReadiness,
    expectedStatus: 200,
    loading: false,
    ok: false,
  },
  {
    key: "serving",
    label: "Serving readiness",
    path: endpoints.servingReadiness,
    expectedStatus: 200,
    loading: false,
    ok: false,
  },
  {
    key: "address",
    label: "Address candidates",
    path: endpoints.addressCandidates,
    expectedStatus: 423,
    loading: false,
    ok: false,
  },
  {
    key: "bbox",
    label: "Controlled bbox",
    path: endpoints.controlledBbox,
    expectedStatus: 423,
    loading: false,
    ok: false,
  },
];

const el: CopyPack = {
  languageLabel: "Î“Î»ÏŽÏƒÏƒÎ±",
  languagePromise:
    "Î¤Î¿ Pantavion ÏƒÏ„Î·ÏÎ¯Î¶ÎµÎ¹ Î³Î»ÏŽÏƒÏƒÎ± ÎµÏ€Î¹Î»Î¿Î³Î®Ï‚ Ï‡ÏÎ®ÏƒÏ„Î·. Î ÏÏŽÏ„Î¿Ï‚ ÏƒÏ„ÏŒÏ‡Î¿Ï‚: 250 Î³Î»ÏŽÏƒÏƒÎµÏ‚. ÎœÎµÏ„Î¬, ÏƒÏ„Î±Î´Î¹Î±ÎºÎ® ÎµÏ€Î­ÎºÏ„Î±ÏƒÎ· Ï€ÏÎ¿Ï‚ 7200 Ï†Ï…ÏƒÎ¹ÎºÎ­Ï‚ Î´Î¹Î±Î»Î­ÎºÏ„Î¿Ï…Ï‚, Î±Î½Î¬ Ï‡ÏŽÏÎ±, Î®Ï€ÎµÎ¹ÏÎ¿ ÎºÎ±Î¹ Ï€ÏÎ±Î³Î¼Î±Ï„Î¹ÎºÏŒ Ï€Î»Î·Î¸Ï…ÏƒÎ¼ÏŒ.",
  title: "Pantavion Water Module",
  subtitle: "Î–Ï‰Î½Ï„Î±Î½ÏŒ ÎºÎ­Î½Ï„ÏÎ¿ ÎµÎ»Î­Î³Ï‡Î¿Ï… ÎµÏ„Î¿Î¹Î¼ÏŒÏ„Î·Ï„Î±Ï‚ â€” ÏŒÏ‡Î¹ ÏƒÏ„Î±Ï„Î¹ÎºÎ® Î²Î¹Ï„ÏÎ¯Î½Î±.",
  explanation:
    "Î¤Î¿ Ï€Î»Î®ÏÎµÏ‚ master Î´Î¯ÎºÏ„Ï…Î¿ ÏÎ´ÏÎµÏ…ÏƒÎ·Ï‚ Ï€Î±ÏÎ±Î¼Î­Î½ÎµÎ¹ Ï€ÏÎ¿ÏƒÏ„Î±Ï„ÎµÏ…Î¼Î­Î½Î¿. Î— ÏƒÎµÎ»Î¯Î´Î± ÎºÎ¬Î½ÎµÎ¹ live ÎµÎ»Î­Î³Ï‡Î¿Ï…Ï‚ ÏƒÏ„Î± readiness, address candidate ÎºÎ±Î¹ controlled bbox contracts, Ï‡Ï‰ÏÎ¯Ï‚ Î½Î± ÎµÏ€Î¹ÏƒÏ„ÏÎ­Ï†ÎµÎ¹ geometry, raw master Î® complete water network payloads.",
  currentStatus: "Î¤ÏÎ­Ï‡Î¿Ï…ÏƒÎ± ÎºÎ±Ï„Î¬ÏƒÏ„Î±ÏƒÎ·",
  productionBlocked: "Production Î¼Ï€Î»Î¿ÎºÎ±ÏÎ¹ÏƒÎ¼Î­Î½Î¿",
  blockedReason:
    "ÎœÏ€Î»Î¿ÎºÎ±ÏÎ¹ÏƒÎ¼Î­Î½Î¿ ÏƒÏ‰ÏƒÏ„Î¬ Î¼Î­Ï‡ÏÎ¹ Î½Î± Ï…Ï€Î¬ÏÏ‡Î¿Ï…Î½ spatial index, bbox provider, access filtering, durable audit, authorized-person store ÎºÎ±Î¹ founder/admin approval.",
  runLiveChecks: "Î•ÎºÏ„Î­Î»ÎµÏƒÎ· live ÎµÎ»Î­Î³Ï‡Î¿Ï…",
  copyPresentation: "Î‘Î½Ï„Î¹Î³ÏÎ±Ï†Î® Î¼Î·Î½ÏÎ¼Î±Ï„Î¿Ï‚ Ï€Î±ÏÎ¿Ï…ÏƒÎ¯Î±ÏƒÎ·Ï‚",
  copied: "Î‘Î½Ï„Î¹Î³ÏÎ¬Ï†Î·ÎºÎµ",
  printPage: "Î•ÎºÏ„ÏÏ€Ï‰ÏƒÎ· / Î±Ï€Î¿Î¸Î®ÎºÎµÏ…ÏƒÎ·",
  exportSnapshot: "Î•Î¾Î±Î³Ï‰Î³Î® JSON snapshot",
  openReadinessApi: "Î†Î½Î¿Î¹Î³Î¼Î± readiness API",
  openServingApi: "Î†Î½Î¿Î¹Î³Î¼Î± serving API",
  openAddressApi: "Î†Î½Î¿Î¹Î³Î¼Î± address candidates API",
  openBboxApi: "Î†Î½Î¿Î¹Î³Î¼Î± controlled bbox API",
  liveChecksTitle: "Live contract checks",
  liveChecksText:
    "ÎšÎ¬Î¸Îµ ÎµÎ½ÎµÏÎ³ÏŒ ÎºÎ¿Ï…Î¼Ï€Î¯ ÎºÎ¬Î½ÎµÎ¹ Ï€ÏÎ±Î³Î¼Î±Ï„Î¹ÎºÎ® ÎµÎ½Î­ÏÎ³ÎµÎ¹Î±. Î¤Î¿ 423 ÎµÎ¯Î½Î±Î¹ ÎµÏ€Î¹Ï„Ï…Ï‡Î­Ï‚ safety block, ÏŒÏ‡Î¹ Î±Ï€Î¿Ï„Ï…Ï‡Î¯Î±.",
  lastRun: "Î¤ÎµÎ»ÎµÏ…Ï„Î±Î¯Î¿Ï‚ Î­Î»ÎµÎ³Ï‡Î¿Ï‚",
  notRun: "Î”ÎµÎ½ Î­Î³Î¹Î½Îµ Î±ÎºÏŒÎ¼Î±",
  checking: "ÎˆÎ»ÎµÎ³Ï‡Î¿Ï‚...",
  notChecked: "Î”ÎµÎ½ ÎµÎ»Î­Î³Ï‡Î¸Î·ÎºÎµ",
  expected: "Î‘Î½Î±Î¼ÎµÎ½ÏŒÎ¼ÎµÎ½Î¿",
  jsonError: "Î— Î±Ï€Î¬Î½Ï„Î·ÏƒÎ· Î´ÎµÎ½ Î®Ï„Î±Î½ JSON. Î Î¹Î¸Î±Î½ÏŒ protection/auth Î® HTML error page.",
  presentationTitle: "ÎœÎ®Î½Ï…Î¼Î± Ï€Î±ÏÎ¿Ï…ÏƒÎ¯Î±ÏƒÎ·Ï‚",
  presentationP1:
    "Î¤Î¿ Pantavion Water Module Î´ÎµÎ½ Ï†Î¿ÏÏ„ÏŽÎ½ÎµÎ¹ Î¿Î»ÏŒÎºÎ»Î·ÏÎ¿ Ï„Î¿ Î´Î¯ÎºÏ„Ï…Î¿ ÏÎ´ÏÎµÏ…ÏƒÎ·Ï‚ ÏƒÏ„Î¿Î½ browser. Î¤Î¿ Ï€Î»Î®ÏÎµÏ‚ master Ï€Î±ÏÎ±Î¼Î­Î½ÎµÎ¹ Ï€ÏÎ¿ÏƒÏ„Î±Ï„ÎµÏ…Î¼Î­Î½Î¿. Î¤Î¿ ÏƒÏÏƒÏ„Î·Î¼Î± Î¶Î·Ï„Î¬ Î¼ÏŒÎ½Î¿ ÎµÎ»ÎµÎ³Ï‡ÏŒÎ¼ÎµÎ½Î¿ Ï„Î¼Î®Î¼Î± Î²Î¬ÏƒÎµÎ¹ Ï„ÏÎ­Ï‡Î¿Ï…ÏƒÎ±Ï‚ Î¸Î­ÏƒÎ·Ï‚, Î±Î½Î±Î¶Î®Ï„Î·ÏƒÎ·Ï‚ Î´Î¹ÎµÏÎ¸Ï…Î½ÏƒÎ·Ï‚, Ï‡ÎµÎ¹ÏÎ¿ÎºÎ¯Î½Î·Ï„Î·Ï‚ Î¼ÎµÏ„Î±ÎºÎ¯Î½Î·ÏƒÎ·Ï‚/zoom Î® founder/admin selected area.",
  presentationP2:
    "Î“Î¹Î± Î´Î¹ÎµÏ…Î¸ÏÎ½ÏƒÎµÎ¹Ï‚ Î® Î¿Î´Î¿ÏÏ‚ Ï€Î¿Ï… Ï…Ï€Î¬ÏÏ‡Î¿Ï…Î½ Ï€Î¿Î»Î»Î­Ï‚ Ï†Î¿ÏÎ­Ï‚ ÏƒÏ„Î·Î½ Î¯Î´Î¹Î± Ï€ÏŒÎ»Î·, Ï„Î¿ ÏƒÏÏƒÏ„Î·Î¼Î± Î´ÎµÎ½ ÎºÎ¬Î½ÎµÎ¹ Ï€Î¿Ï„Î­ auto-pick. Î•Ï€Î¹ÏƒÏ„ÏÎ­Ï†ÎµÎ¹ candidates ÎºÎ±Î¹ Î±Ï€Î±Î¹Ï„ÎµÎ¯ selectedCandidateId Ï€ÏÎ¹Î½ Î±Ï€ÏŒ Î¿Ï€Î¿Î¹Î¿Î´Î®Ï€Î¿Ï„Îµ controlled bbox serving.",
  readinessTitle: "Live production readiness",
  overallReady: "Î£Ï…Î½Î¿Î»Î¹ÎºÎ¬ Î­Ï„Î¿Î¹Î¼Î¿",
  productionActivationAllowed: "Î•Ï€Î¹Ï„ÏÎ­Ï€ÎµÏ„Î±Î¹ production activation",
  dataReturned: "Î•Ï€Î¹ÏƒÏ„ÏÎ­Ï†Î¿Î½Ï„Î±Î¹ Î´ÎµÎ´Î¿Î¼Î­Î½Î±",
  mayReturnRawMaster: "ÎœÏ€Î¿ÏÎµÎ¯ Î½Î± ÎµÏ€Î¹ÏƒÏ„ÏÎ­ÏˆÎµÎ¹ raw master",
  mayReturnCompleteNetwork: "ÎœÏ€Î¿ÏÎµÎ¯ Î½Î± ÎµÏ€Î¹ÏƒÏ„ÏÎ­ÏˆÎµÎ¹ complete network",
  addressTitle: "Address disambiguation",
  addressP1:
    "ÎŠÎ´Î¹ÎµÏ‚ Î¿Î´Î¿Î¯ Î® Î¯Î´Î¹ÎµÏ‚ Î´Î¹ÎµÏ…Î¸ÏÎ½ÏƒÎµÎ¹Ï‚ Î¼Ï€Î¿ÏÎµÎ¯ Î½Î± Ï…Ï€Î¬ÏÏ‡Î¿Ï…Î½ Ï€Î¿Î»Î»Î­Ï‚ Ï†Î¿ÏÎ­Ï‚ ÏƒÏ„Î·Î½ Î¯Î´Î¹Î± Ï€ÏŒÎ»Î·, Î´Î®Î¼Î¿, ÏƒÏ…Î½Î¿Î¹ÎºÎ¯Î±, Ï„Î¿Î¼Î­Î± Î® Î¶ÏŽÎ½Î·.",
  addressP2:
    "Î¤Î¿ ÏƒÏÏƒÏ„Î·Î¼Î± Î´ÎµÎ½ ÎµÏ€Î¹Ï„ÏÎ­Ï€ÎµÏ„Î±Î¹ Î½Î± ÎµÏ€Î¹Î»Î­Î¾ÎµÎ¹ Î±Ï…Ï„ÏŒÎ¼Î±Ï„Î± ambiguous address. Candidate selection Î±Ï€Î±Î¹Ï„ÎµÎ¯Ï„Î±Î¹ Ï€ÏÎ¹Î½ Î´Î·Î¼Î¹Î¿Ï…ÏÎ³Î·Î¸ÎµÎ¯ target viewport.",
  selectedCandidateRequired: "selectedCandidateId Î±Ï€Î±Î¹Ï„ÎµÎ¯Ï„Î±Î¹ Ï€ÏÎ¹Î½ Ï„Î¿ bbox",
  mayAutoPick: "mayAutoPickAmbiguousAddress",
  bboxDataReturned: "controlled bbox dataReturned",
  requiredBeforeProduction: "Î‘Ï€Î±Î¹Ï„Î¿ÏÎ½Ï„Î±Î¹ Ï€ÏÎ¹Î½ Ï„Î¿ production",
  safeGuaranteeTitle: "Safe presentation guarantee",
  safe1: "No raw master network is returned.",
  safe2: "No complete network payload is returned.",
  safe3: "No renderer or map layer is activated here.",
};

const en: CopyPack = {
  ...el,
  languageLabel: "Language",
  languagePromise:
    "Pantavion supports user-selected language. First target: 250 languages. Then progressive support for 7200 natural dialects by country, continent, and real population needs.",
  subtitle: "Live readiness control center â€” not a static display.",
  explanation:
    "The complete master water network remains protected. This page performs live checks against readiness, address candidate, and controlled bbox contracts without returning geometry, raw master data, or complete water network payloads.",
  currentStatus: "Current status",
  productionBlocked: "Production blocked",
  blockedReason:
    "Blocked by design until spatial index, bbox provider, access filtering, durable audit, authorized-person store, and founder/admin approval are complete.",
  runLiveChecks: "Run live checks",
  copyPresentation: "Copy presentation message",
  copied: "Copied",
  printPage: "Print / save",
  exportSnapshot: "Export JSON snapshot",
  openReadinessApi: "Open readiness API",
  openServingApi: "Open serving API",
  openAddressApi: "Open address candidates API",
  openBboxApi: "Open controlled bbox API",
  liveChecksText:
    "Every active button performs a real action. Status 423 is a successful safety block, not a failure.",
  lastRun: "Last run",
  notRun: "Not run yet",
  checking: "Checking...",
  notChecked: "Not checked",
  expected: "Expected",
  presentationTitle: "Presentation message",
  presentationP1:
    "The Pantavion Water Module does not load the complete water network in the browser. The full master remains protected. The system requests only a controlled segment based on current location, address search, manual pan/zoom, or founder/admin selected area.",
  presentationP2:
    "For addresses or street names that exist multiple times in the same city, the system never auto-picks. It returns candidates and requires selectedCandidateId before any controlled bbox serving.",
  overallReady: "Overall ready",
  productionActivationAllowed: "Production activation allowed",
  dataReturned: "Data returned",
  mayReturnRawMaster: "May return raw master",
  mayReturnCompleteNetwork: "May return complete network",
  addressP1:
    "Same streets or addresses can exist multiple times in the same city, municipality, quarter, sector, or zone.",
  addressP2:
    "The system is not allowed to auto-pick an ambiguous address. Candidate selection is required before target viewport creation.",
  selectedCandidateRequired: "selectedCandidateId required before bbox",
  requiredBeforeProduction: "Required before production",
};

const partialCopies: Record<string, Partial<CopyPack>> = {
  tr: {
    languageLabel: "Dil",
    languagePromise:
      "Pantavion kullanÄ±cÄ±nÄ±n seÃ§tiÄŸi dili destekler. Ä°lk hedef: 250 dil. Sonra Ã¼lke, kÄ±ta ve gerÃ§ek nÃ¼fus ihtiyaÃ§larÄ±na gÃ¶re 7200 doÄŸal lehÃ§e.",
    subtitle: "CanlÄ± hazÄ±rlÄ±k kontrol merkezi â€” statik vitrin deÄŸil.",
    currentStatus: "Mevcut durum",
    productionBlocked: "Production engellendi",
    runLiveChecks: "CanlÄ± kontrolÃ¼ Ã§alÄ±ÅŸtÄ±r",
    copyPresentation: "Sunum mesajÄ±nÄ± kopyala",
  },
  ar: {
    languageLabel: "Ø§Ù„Ù„ØºØ©",
    languagePromise:
      "ÙŠØ¯Ø¹Ù… Pantavion Ù„ØºØ© ÙŠØ®ØªØ§Ø±Ù‡Ø§ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…. Ø§Ù„Ù‡Ø¯Ù Ø§Ù„Ø£ÙˆÙ„: 250 Ù„ØºØ©ØŒ Ø«Ù… Ø¯Ø¹Ù… ØªØ¯Ø±ÙŠØ¬ÙŠ Ù„Ù€ 7200 Ù„Ù‡Ø¬Ø© Ø·Ø¨ÙŠØ¹ÙŠØ© Ø­Ø³Ø¨ Ø§Ù„Ø¨Ù„Ø¯ ÙˆØ§Ù„Ù‚Ø§Ø±Ø© ÙˆØ§Ø­ØªÙŠØ§Ø¬Ø§Øª Ø§Ù„Ø³ÙƒØ§Ù†.",
    subtitle: "Ù…Ø±ÙƒØ² ØªØ­Ù‚Ù‚ Ù…Ø¨Ø§Ø´Ø± Ù„Ù„Ø¬Ø§Ù‡Ø²ÙŠØ© â€” Ù„ÙŠØ³ Ø¹Ø±Ø¶Ø§Ù‹ Ø«Ø§Ø¨ØªØ§Ù‹.",
    currentStatus: "Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©",
    productionBlocked: "Ø§Ù„Ø¥Ù†ØªØ§Ø¬ Ù…Ø­Ø¸ÙˆØ±",
    runLiveChecks: "ØªØ´ØºÙŠÙ„ Ø§Ù„ÙØ­Øµ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±",
    copyPresentation: "Ù†Ø³Ø® Ø±Ø³Ø§Ù„Ø© Ø§Ù„Ø¹Ø±Ø¶",
  },
  "ar-sy": {
    languageLabel: "Ø§Ù„Ù„ØºØ©",
    languagePromise:
      "Ø¯Ø¹Ù… Ø®Ø§Øµ Ù„Ù„Ù†Ø§Ø·Ù‚ÙŠÙ† Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø§Ù„Ø³ÙˆØ±ÙŠØ© Ø¶Ù…Ù† Ø®Ø·Ø© Pantavion Ù„Ù„ØºØ§Øª ÙˆØ§Ù„Ø¬Ø§Ù„ÙŠØ§Øª ÙÙŠ Ù‚Ø¨Ø±Øµ ÙˆØ§Ù„Ø¹Ø§Ù„Ù….",
    subtitle: "Ù…Ø±ÙƒØ² ØªØ­Ù‚Ù‚ Ù…Ø¨Ø§Ø´Ø± Ù„Ù„Ø¬Ø§Ù‡Ø²ÙŠØ© â€” Ù„ÙŠØ³ Ø¹Ø±Ø¶Ø§Ù‹ Ø«Ø§Ø¨ØªØ§Ù‹.",
    runLiveChecks: "ØªØ´ØºÙŠÙ„ Ø§Ù„ÙØ­Øµ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±",
  },
  "ar-ps": {
    languageLabel: "Ø§Ù„Ù„ØºØ©",
    languagePromise:
      "Ø¯Ø¹Ù… Ø®Ø§Øµ Ù„Ù„Ù†Ø§Ø·Ù‚ÙŠÙ† Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø§Ù„ÙÙ„Ø³Ø·ÙŠÙ†ÙŠØ© Ø¶Ù…Ù† Ø®Ø·Ø© Pantavion Ù„Ù„ØºØ§Øª ÙˆØ§Ù„Ø¬Ø§Ù„ÙŠØ§Øª ÙÙŠ Ù‚Ø¨Ø±Øµ ÙˆØ§Ù„Ø¹Ø§Ù„Ù….",
    subtitle: "Ù…Ø±ÙƒØ² ØªØ­Ù‚Ù‚ Ù…Ø¨Ø§Ø´Ø± Ù„Ù„Ø¬Ø§Ù‡Ø²ÙŠØ© â€” Ù„ÙŠØ³ Ø¹Ø±Ø¶Ø§Ù‹ Ø«Ø§Ø¨ØªØ§Ù‹.",
    runLiveChecks: "ØªØ´ØºÙŠÙ„ Ø§Ù„ÙØ­Øµ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±",
  },
  ru: {
    languageLabel: "Ð¯Ð·Ñ‹Ðº",
    languagePromise:
      "Pantavion Ð¿Ð¾Ð´Ð´ÐµÑ€Ð¶Ð¸Ð²Ð°ÐµÑ‚ ÑÐ·Ñ‹Ðº, Ð²Ñ‹Ð±Ñ€Ð°Ð½Ð½Ñ‹Ð¹ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÐµÐ¼. Ð¦ÐµÐ»ÑŒ: 250 ÑÐ·Ñ‹ÐºÐ¾Ð², Ð·Ð°Ñ‚ÐµÐ¼ 7200 ÐµÑÑ‚ÐµÑÑ‚Ð²ÐµÐ½Ð½Ñ‹Ñ… Ð´Ð¸Ð°Ð»ÐµÐºÑ‚Ð¾Ð².",
    subtitle: "Ð–Ð¸Ð²Ð¾Ð¹ Ñ†ÐµÐ½Ñ‚Ñ€ Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐºÐ¸ Ð³Ð¾Ñ‚Ð¾Ð²Ð½Ð¾ÑÑ‚Ð¸ â€” Ð½Ðµ ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ°Ñ Ð²Ð¸Ñ‚Ñ€Ð¸Ð½Ð°.",
    currentStatus: "Ð¢ÐµÐºÑƒÑ‰ÐµÐµ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸Ðµ",
    productionBlocked: "Production Ð·Ð°Ð±Ð»Ð¾ÐºÐ¸Ñ€Ð¾Ð²Ð°Ð½",
    runLiveChecks: "Ð—Ð°Ð¿ÑƒÑÑ‚Ð¸Ñ‚ÑŒ live-Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐºÑƒ",
  },
  uk: {
    languageLabel: "ÐœÐ¾Ð²Ð°",
    languagePromise:
      "Pantavion Ð¿Ñ–Ð´Ñ‚Ñ€Ð¸Ð¼ÑƒÑ” Ð¼Ð¾Ð²Ñƒ, Ð¾Ð±Ñ€Ð°Ð½Ñƒ ÐºÐ¾Ñ€Ð¸ÑÑ‚ÑƒÐ²Ð°Ñ‡ÐµÐ¼. ÐœÐµÑ‚Ð°: 250 Ð¼Ð¾Ð², Ð¿Ð¾Ñ‚Ñ–Ð¼ 7200 Ð¿Ñ€Ð¸Ñ€Ð¾Ð´Ð½Ð¸Ñ… Ð´Ñ–Ð°Ð»ÐµÐºÑ‚Ñ–Ð².",
    subtitle: "Ð–Ð¸Ð²Ð¸Ð¹ Ñ†ÐµÐ½Ñ‚Ñ€ Ð¿ÐµÑ€ÐµÐ²Ñ–Ñ€ÐºÐ¸ Ð³Ð¾Ñ‚Ð¾Ð²Ð½Ð¾ÑÑ‚Ñ– â€” Ð½Ðµ ÑÑ‚Ð°Ñ‚Ð¸Ñ‡Ð½Ð° Ð²Ñ–Ñ‚Ñ€Ð¸Ð½Ð°.",
    runLiveChecks: "Ð—Ð°Ð¿ÑƒÑÑ‚Ð¸Ñ‚Ð¸ live-Ð¿ÐµÑ€ÐµÐ²Ñ–Ñ€ÐºÑƒ",
  },
  zh: {
    languageLabel: "è¯­è¨€",
    languagePromise:
      "Pantavion æ”¯æŒç”¨æˆ·é€‰æ‹©è¯­è¨€ã€‚ç¬¬ä¸€ç›®æ ‡ï¼š250ç§è¯­è¨€ï¼›éšåŽé€æ­¥æ”¯æŒ7200ç§è‡ªç„¶æ–¹è¨€ã€‚",
    subtitle: "å®žæ—¶å°±ç»ªæŽ§åˆ¶ä¸­å¿ƒ â€” ä¸æ˜¯é™æ€å±•ç¤ºã€‚",
    currentStatus: "å½“å‰çŠ¶æ€",
    productionBlocked: "ç”Ÿäº§å·²é˜»æ­¢",
    runLiveChecks: "è¿è¡Œå®žæ—¶æ£€æŸ¥",
  },
  pl: {
    languageLabel: "JÄ™zyk",
    languagePromise:
      "Pantavion obsÅ‚uguje jÄ™zyk wybrany przez uÅ¼ytkownika. Cel: 250 jÄ™zykÃ³w, potem 7200 naturalnych dialektÃ³w.",
    subtitle: "Centrum kontroli gotowoÅ›ci na Å¼ywo â€” nie statyczna witryna.",
    currentStatus: "Aktualny status",
    productionBlocked: "Production zablokowane",
    runLiveChecks: "Uruchom kontrolÄ™ live",
  },
  hy: {
    languageLabel: "Ô¼Õ¥Õ¦Õ¸Ö‚",
    languagePromise:
      "Pantavion-Õ¨ Õ¡Õ»Õ¡Õ¯ÖÕ¸Ö‚Õ´ Õ§ Ö…Õ£Õ¿Õ¡Õ¿Õ«Ö€Õ¸Õ» Õ¨Õ¶Õ¿Ö€Õ¡Õ® Õ¬Õ¥Õ¦Õ¸Ö‚Õ¶Ö‰ Õ†ÕºÕ¡Õ¿Õ¡Õ¯Õ 250 Õ¬Õ¥Õ¦Õ¸Ö‚, Õ¡ÕºÕ¡ 7200 Õ¢Õ¶Õ¡Õ¯Õ¡Õ¶ Õ¢Õ¡Ö€Õ¢Õ¡Õ¼Ö‰",
    subtitle: "Ô¿Õ¥Õ¶Õ¤Õ¡Õ¶Õ« ÕºÕ¡Õ¿Ö€Õ¡Õ½Õ¿Õ¸Ö‚Õ©ÕµÕ¡Õ¶ Õ¾Õ¥Ö€Õ¡Õ°Õ½Õ¯Õ´Õ¡Õ¶ Õ¯Õ¥Õ¶Õ¿Ö€Õ¸Õ¶ â€” Õ¸Õ¹ Õ½Õ¿Õ¡Õ¿Õ«Õ¯ Õ§Õ»Ö‰",
    runLiveChecks: "Ô³Õ¸Ö€Õ®Õ¡Ö€Õ¯Õ¥Õ¬ Õ¯Õ¥Õ¶Õ¤Õ¡Õ¶Õ« Õ½Õ¿Õ¸Ö‚Õ£Õ¸Ö‚Õ´Õ¨",
  },
  ro: {
    languageLabel: "LimbÄƒ",
    languagePromise:
      "Pantavion susÈ›ine limba aleasÄƒ de utilizator. ÈšintÄƒ: 250 de limbi, apoi 7200 de dialecte naturale.",
    subtitle: "Centru live de verificare a pregÄƒtirii â€” nu vitrinÄƒ staticÄƒ.",
    currentStatus: "Stare curentÄƒ",
    productionBlocked: "Production blocat",
    runLiveChecks: "RuleazÄƒ verificarea live",
  },
  bg: {
    languageLabel: "Ð•Ð·Ð¸Ðº",
    languagePromise:
      "Pantavion Ð¿Ð¾Ð´Ð´ÑŠÑ€Ð¶Ð° Ð¸Ð·Ð±Ñ€Ð°Ð½Ð¸Ñ Ð¾Ñ‚ Ð¿Ð¾Ñ‚Ñ€ÐµÐ±Ð¸Ñ‚ÐµÐ»Ñ ÐµÐ·Ð¸Ðº. Ð¦ÐµÐ»: 250 ÐµÐ·Ð¸ÐºÐ°, Ð¿Ð¾ÑÐ»Ðµ 7200 ÐµÑÑ‚ÐµÑÑ‚Ð²ÐµÐ½Ð¸ Ð´Ð¸Ð°Ð»ÐµÐºÑ‚Ð°.",
    subtitle: "Ð–Ð¸Ð² Ñ†ÐµÐ½Ñ‚ÑŠÑ€ Ð·Ð° Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐºÐ° Ð½Ð° Ð³Ð¾Ñ‚Ð¾Ð²Ð½Ð¾ÑÑ‚Ñ‚Ð° â€” Ð½Ðµ ÑÑ‚Ð°Ñ‚Ð¸Ñ‡Ð½Ð° Ð²Ð¸Ñ‚Ñ€Ð¸Ð½Ð°.",
    currentStatus: "Ð¢ÐµÐºÑƒÑ‰Ð¾ ÑÑŠÑÑ‚Ð¾ÑÐ½Ð¸Ðµ",
    productionBlocked: "Production Ð±Ð»Ð¾ÐºÐ¸Ñ€Ð°Ð½Ð¾",
    runLiveChecks: "Ð¡Ñ‚Ð°Ñ€Ñ‚Ð¸Ñ€Ð°Ð¹ live Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐºÐ°",
  },
  fil: {
    languageLabel: "Wika",
    languagePromise:
      "Sinusuportahan ng Pantavion ang wikang pinili ng user. Target: 250 wika, pagkatapos 7200 natural dialects.",
    subtitle: "Live readiness control center â€” hindi static display.",
    runLiveChecks: "Patakbuhin ang live check",
  },
  ne: {
    languageLabel: "à¤­à¤¾à¤·à¤¾",
    languagePromise:
      "Pantavion à¤²à¥‡ à¤ªà¥à¤°à¤¯à¥‹à¤—à¤•à¤°à¥à¤¤à¤¾à¤²à¥‡ à¤°à¥‹à¤œà¥‡à¤•à¥‹ à¤­à¤¾à¤·à¤¾ à¤¸à¤®à¤°à¥à¤¥à¤¨ à¤—à¤°à¥à¤›à¥¤ à¤²à¤•à¥à¤·à¥à¤¯: 250 à¤­à¤¾à¤·à¤¾, à¤¤à¥à¤¯à¤¸à¤ªà¤›à¤¿ 7200 à¤ªà¥à¤°à¤¾à¤•à¥ƒà¤¤à¤¿à¤• à¤¬à¥‹à¤²à¤¿à¤¹à¤°à¥‚à¥¤",
    subtitle: "à¤ªà¥à¤°à¤¤à¥à¤¯à¤•à¥à¤· readiness control center â€” static display à¤¹à¥‹à¤‡à¤¨à¥¤",
    runLiveChecks: "Live check à¤šà¤²à¤¾à¤‰à¤¨à¥à¤¹à¥‹à¤¸à¥",
  },
  hi: {
    languageLabel: "à¤­à¤¾à¤·à¤¾",
    languagePromise:
      "Pantavion à¤‰à¤ªà¤¯à¥‹à¤—à¤•à¤°à¥à¤¤à¤¾ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤šà¥à¤¨à¥€ à¤—à¤ˆ à¤­à¤¾à¤·à¤¾ à¤•à¤¾ à¤¸à¤®à¤°à¥à¤¥à¤¨ à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆà¥¤ à¤²à¤•à¥à¤·à¥à¤¯: 250 à¤­à¤¾à¤·à¤¾à¤à¤, à¤«à¤¿à¤° 7200 à¤ªà¥à¤°à¤¾à¤•à¥ƒà¤¤à¤¿à¤• à¤¬à¥‹à¤²à¤¿à¤¯à¤¾à¤à¥¤",
    subtitle: "Live readiness control center â€” static display à¤¨à¤¹à¥€à¤‚à¥¤",
    runLiveChecks: "Live check à¤šà¤²à¤¾à¤à¤",
  },
  ur: {
    languageLabel: "Ø²Ø¨Ø§Ù†",
    languagePromise:
      "Pantavion ØµØ§Ø±Ù Ú©ÛŒ Ù…Ù†ØªØ®Ø¨ Ø²Ø¨Ø§Ù† Ú©Ùˆ Ø³Ù¾ÙˆØ±Ù¹ Ú©Ø±ØªØ§ ÛÛ’Û” ÛØ¯Ù: 250 Ø²Ø¨Ø§Ù†ÛŒÚºØŒ Ù¾Ú¾Ø± 7200 Ù‚Ø¯Ø±ØªÛŒ Ø¨ÙˆÙ„ÛŒØ§ÚºÛ”",
    subtitle: "Ø¨Ø±Ø§Û Ø±Ø§Ø³Øª readiness control center â€” static display Ù†ÛÛŒÚºÛ”",
    runLiveChecks: "Live check Ú†Ù„Ø§Ø¦ÛŒÚº",
  },
  bn: {
    languageLabel: "à¦­à¦¾à¦·à¦¾",
    languagePromise:
      "Pantavion à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦°à¦•à¦¾à¦°à§€à¦° à¦¨à¦¿à¦°à§à¦¬à¦¾à¦šà¦¿à¦¤ à¦­à¦¾à¦·à¦¾ à¦¸à¦®à¦°à§à¦¥à¦¨ à¦•à¦°à§‡à¥¤ à¦²à¦•à§à¦·à§à¦¯: 250 à¦­à¦¾à¦·à¦¾, à¦¤à¦¾à¦°à¦ªà¦° 7200 à¦ªà§à¦°à¦¾à¦•à§ƒà¦¤à¦¿à¦• à¦‰à¦ªà¦­à¦¾à¦·à¦¾à¥¤",
    subtitle: "à¦²à¦¾à¦‡à¦­ readiness control center â€” static display à¦¨à¦¯à¦¼à¥¤",
    runLiveChecks: "Live check à¦šà¦¾à¦²à¦¾à¦¨",
  },
  pa: {
    languageLabel: "à¨­à¨¾à¨¸à¨¼à¨¾",
    languagePromise:
      "Pantavion à¨¯à©‚à¨œà¨¼à¨° à¨¦à©€ à¨šà©à¨£à©€ à¨­à¨¾à¨¸à¨¼à¨¾ à¨¦à¨¾ à¨¸à¨®à¨°à¨¥à¨¨ à¨•à¨°à¨¦à¨¾ à¨¹à©ˆà¥¤ à¨Ÿà©€à¨šà¨¾: 250 à¨­à¨¾à¨¸à¨¼à¨¾à¨µà¨¾à¨‚, à¨«à¨¿à¨° 7200 à¨•à©à¨¦à¨°à¨¤à©€ à¨¬à©‹à¨²à©€à¨†à¨‚à¥¤",
    subtitle: "Live readiness control center â€” static display à¨¨à¨¹à©€à¨‚à¥¤",
    runLiveChecks: "Live check à¨šà¨²à¨¾à¨“",
  },
  ta: {
    languageLabel: "à®®à¯Šà®´à®¿",
    languagePromise:
      "Pantavion à®ªà®¯à®©à®°à¯ à®¤à¯‡à®°à¯à®¨à¯à®¤à¯†à®Ÿà¯à®¤à¯à®¤ à®®à¯Šà®´à®¿à®¯à¯ˆ à®†à®¤à®°à®¿à®•à¯à®•à®¿à®±à®¤à¯. à®‡à®²à®•à¯à®•à¯: 250 à®®à¯Šà®´à®¿à®•à®³à¯, à®ªà®¿à®©à¯à®©à®°à¯ 7200 à®‡à®¯à®²à¯à®ªà®¾à®© à®µà®´à®•à¯à®•à¯à®•à®³à¯.",
    subtitle: "Live readiness control center â€” static display à®…à®²à¯à®².",
    runLiveChecks: "Live check à®‡à®¯à®•à¯à®•à®µà¯à®®à¯",
  },
  si: {
    languageLabel: "à¶·à·à·‚à·à·€",
    languagePromise:
      "Pantavion à¶´à¶»à·’à·à·“à¶½à¶šà¶ºà· à¶­à·à¶»à·à¶œà¶­à·Š à¶·à·à·‚à·à·€à¶§ à·ƒà·„à·à¶º à¶¯à¶šà·Šà·€à¶ºà·’. à¶‰à¶½à¶šà·Šà¶šà¶º: à¶·à·à·‚à· 250, à¶´à·ƒà·”à·€ à·ƒà·Šà·€à¶·à·à·€à·’à¶š à¶‹à¶´à¶·à·à·‚à· 7200.",
    subtitle: "Live readiness control center â€” static display à¶‘à¶šà¶šà·Š à¶±à·œà·€à·š.",
    runLiveChecks: "Live check à¶°à·à·€à¶±à¶º à¶šà¶»à¶±à·Šà¶±",
  },
  fr: {
    languageLabel: "Langue",
    languagePromise:
      "Pantavion prend en charge la langue choisie par lâ€™utilisateur. Objectif: 250 langues, puis 7200 dialectes naturels.",
    subtitle: "Centre de contrÃ´le de prÃ©paration en direct â€” pas une vitrine statique.",
    currentStatus: "Ã‰tat actuel",
    productionBlocked: "Production bloquÃ©e",
    runLiveChecks: "Lancer le contrÃ´le en direct",
  },
  ln: {
    languageLabel: "Lokota",
    languagePromise:
      "Pantavion esungaka lokota oyo mosaleli aponi. Mokano: minoko 250, sima maloba ya mboka 7200.",
    subtitle: "Centre ya contrÃ´le ya bomilengeli na live â€” ezali vitrine statique te.",
    runLiveChecks: "Bandisa contrÃ´le live",
  },
  sw: {
    languageLabel: "Lugha",
    languagePromise:
      "Pantavion inaunga mkono lugha iliyochaguliwa na mtumiaji. Lengo: lugha 250, kisha lahaja asilia 7200.",
    subtitle: "Kituo cha ukaguzi wa utayari live â€” si onyesho tuli.",
    runLiveChecks: "Endesha ukaguzi live",
  },
  ku: {
    languageLabel: "Ziman",
    languagePromise:
      "Pantavion piÅŸtgirÃ® dide zimanÃª ku bikarhÃªner hilbijÃªre. Armanc: 250 ziman, paÅŸÃª 7200 zaravayÃªn xwezayÃ®.",
    subtitle: "Navenda kontrola amadebÃ»nÃª ya live â€” ne dÃ®menderek statÃ®k.",
    runLiveChecks: "Kontrola live bike",
  },
};

function languageDirectionFor(language: LanguageCode): "ltr" | "rtl" {
  const match = languages.find((item) => item.code === language);

  if (match && "dir" in match && match.dir) {
    return match.dir;
  }

  return "ltr";
}

function copyFor(language: LanguageCode): CopyPack {
  if (language === "el") return el;
  if (language === "en") return en;

  return {
    ...en,
    ...partialCopies[language],
  };
}

const cardCopies = {
  el: [
    ["Î ÏÎ¿ÏƒÏ„Î±Ï„ÎµÏ…Î¼Î­Î½Î¿", "Î Î»Î®ÏÎµÏ‚ master Î´Î¯ÎºÏ„Ï…Î¿", "Î¤Î¿ Ï€Î»Î®ÏÎµÏ‚ master Î¼Î­Î½ÎµÎ¹ Ï€ÏÎ¿ÏƒÏ„Î±Ï„ÎµÏ…Î¼Î­Î½Î¿ ÎºÎ±Î¹ Î´ÎµÎ½ ÎµÎºÏ„Î¯Î¸ÎµÏ„Î±Î¹ Ï‰Ï‚ public geodata."],
    ["ÎœÏ€Î»Î¿ÎºÎ±ÏÎ¹ÏƒÎ¼Î­Î½Î¿", "Î¦ÏŒÏÏ„Ï‰ÏƒÎ· ÏƒÏ„Î¿Î½ browser", "ÎŸ browser Î´ÎµÎ½ Ï€Î±Î¯ÏÎ½ÎµÎ¹ raw/full Î´Î¯ÎºÏ„Ï…Î¿."],
    ["Contract ready", "Target viewport", "Î— Ï€ÎµÏÎ¹Î¿Ï‡Î® Î¼Ï€Î¿ÏÎµÎ¯ Î½Î± Ï€ÏÎ¿ÎºÏÏˆÎµÎ¹ Î±Ï€ÏŒ Î¸Î­ÏƒÎ·, Î±Î½Î±Î¶Î®Ï„Î·ÏƒÎ·, pan/zoom Î® admin selection."],
    ["Î‘Ï€Î±Î¹Ï„ÎµÎ¯Ï„Î±Î¹ Î´Î¹Î±Ï‡Ï‰ÏÎ¹ÏƒÎ¼ÏŒÏ‚", "ÎŠÎ´Î¹ÎµÏ‚ Î¿Î´Î¿Î¯ ÏƒÎµ Ï€Î¿Î»Î»Î­Ï‚ Ï€ÎµÏÎ¹Î¿Ï‡Î­Ï‚", "ÎŠÎ´Î¹ÎµÏ‚ Î¿Î´Î¿Î¯ Î±Ï€Î±Î¹Ï„Î¿ÏÎ½ candidate selection Ï€ÏÎ¹Î½ Î´Î·Î¼Î¹Î¿Ï…ÏÎ³Î·Î¸ÎµÎ¯ bbox."],
  ],
  en: [
    ["Protected", "Full master network", "The complete master remains protected and is not exposed as public geodata."],
    ["Blocked", "Browser loading", "The browser does not receive the raw/full network."],
    ["Contract ready", "Target viewport", "The requested area can come from location, address search, pan/zoom, or admin selection."],
    ["Disambiguation required", "Repeated street names", "Repeated streets require candidate selection before bbox creation."],
  ],
} as const;

const requiredItems = {
  el: [
    "Î Î»Î®ÏÎ·Ï‚ Ï€ÏÎ¿ÏƒÏ„Î±Ï„ÎµÏ…Î¼Î­Î½Î· master Ï€Î·Î³Î®",
    "Spatial index Î±Ï€ÏŒ Î¿Î»ÏŒÎºÎ»Î·ÏÎ¿ Ï„Î¿ master",
    "Server-side bbox query provider",
    "Access filtering Î±Î½Î¬ viewport / ÏÏŒÎ»Î¿ / ÎºÎ±Ï„Î¬ÏƒÏ„Î±ÏƒÎ·",
    "Durable authorized-person store",
    "Append-only encrypted audit sink",
    "Address candidate / place-zone disambiguation",
    "Founder/admin approval Î³Î¹Î± production activation",
  ],
  en: [
    "Complete protected master source",
    "Spatial index from the complete master",
    "Server-side bbox query provider",
    "Viewport / role / status access filtering",
    "Durable authorized-person store",
    "Append-only encrypted audit sink",
    "Address candidate / place-zone disambiguation",
    "Founder/admin approval for production activation",
  ],
} as const;

function getInitialLanguage(): LanguageCode {
  if (typeof window === "undefined") return "el";

  const stored = window.localStorage.getItem("pantavion-language");

  if (stored && languages.some((language) => language.code === stored)) {
    return stored as LanguageCode;
  }

  const browserLanguage = window.navigator.language.toLowerCase();

  const exact = languages.find((language) => language.code === browserLanguage);
  if (exact) return exact.code;

  const short = browserLanguage.slice(0, 2);
  const match = languages.find((language) => language.code === short);
  if (match) return match.code;

  return "el";
}

function boolText(value: unknown) {
  if (value === true) return "true";
  if (value === false) return "false";
  if (value === null || typeof value === "undefined") return "n/a";
  return String(value);
}

function valueFromJson(json: Record<string, unknown> | undefined, key: string) {
  if (!json) return "n/a";
  return boolText(json[key]);
}

function statusTone(endpoint: EndpointState) {
  if (endpoint.loading) return "border-blue-400/30 bg-blue-950/30 text-blue-100";
  if (endpoint.ok) return "border-emerald-400/30 bg-emerald-950/30 text-emerald-100";
  if (endpoint.statusCode) return "border-red-400/30 bg-red-950/30 text-red-100";
  return "border-white/10 bg-white/[0.04] text-slate-100";
}

async function loadEndpoint(endpoint: EndpointState, copy: CopyPack): Promise<EndpointState> {
  try {
    const response = await fetch(endpoint.path, { cache: "no-store" });
    const text = await response.text();

    let json: Record<string, unknown> | undefined;

    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return {
        ...endpoint,
        statusCode: response.status,
        loading: false,
        ok: false,
        error: copy.jsonError,
      };
    }

    return {
      ...endpoint,
      statusCode: response.status,
      loading: false,
      ok: response.status === endpoint.expectedStatus,
      json,
    };
  } catch (error) {
    return {
      ...endpoint,
      loading: false,
      ok: false,
      error: error instanceof Error ? error.message : "Unknown request error",
    };
  }
}

export default function WaterReadinessLiveConsole() {
  const [language, setLanguage] = useState<LanguageCode>(() => getInitialLanguage());
  const [endpointStates, setEndpointStates] = useState<EndpointState[]>(initialEndpointState);
  const [lastRun, setLastRun] = useState("");
  const [copyState, setCopyState] = useState("");

  const copy = copyFor(language);
  const languageMeta = languages.find((item) => item.code === language) ?? languages[0];
  const direction = languageDirectionFor(language);
  const cards = language === "el" ? cardCopies.el : cardCopies.en;
  const required = language === "el" ? requiredItems.el : requiredItems.en;

  const production = endpointStates.find((item) => item.key === "production");
  const address = endpointStates.find((item) => item.key === "address");
  const bbox = endpointStates.find((item) => item.key === "bbox");

  const summary = useMemo(
    () => ({
      overallReady: valueFromJson(production?.json, "overallReady"),
      productionActivationAllowed: valueFromJson(production?.json, "productionActivationAllowed"),
      dataReturned: valueFromJson(production?.json, "dataReturned"),
      mayReturnRawMaster: valueFromJson(production?.json, "mayReturnRawMaster"),
      mayReturnCompleteNetwork: valueFromJson(production?.json, "mayReturnCompleteNetwork"),
      addressAutoPick: valueFromJson(address?.json, "mayAutoPickAmbiguousAddress"),
      selectedCandidateRequired: valueFromJson(address?.json, "selectedCandidateIdRequiredBeforeBbox"),
      bboxDataReturned: valueFromJson(bbox?.json, "dataReturned"),
    }),
    [address?.json, bbox?.json, production?.json],
  );

  function changeLanguage(nextLanguage: LanguageCode) {
    setLanguage(nextLanguage);
    window.localStorage.setItem("pantavion-language", nextLanguage);
    document.documentElement.lang = nextLanguage;
    document.documentElement.dir = languageDirectionFor(nextLanguage);
  }

  async function runAllChecks() {
    setEndpointStates((current) =>
      current.map((item) => ({ ...item, loading: true, error: undefined })),
    );

    const results = await Promise.all(
      initialEndpointState.map((endpoint) => loadEndpoint(endpoint, copy)),
    );

    setEndpointStates(results);
    setLastRun(new Date().toLocaleString(language === "el" ? "el-CY" : language));
  }

  async function copyPresentationMessage() {
    const message = `${copy.presentationP1}\n\n${copy.presentationP2}`;

    try {
      await window.navigator.clipboard.writeText(message);
      setCopyState(copy.copied);
    } catch {
      setCopyState("Copy blocked");
    }

    window.setTimeout(() => setCopyState(""), 1800);
  }

  function openContract(path: string) {
    window.open(path, "_blank", "noopener,noreferrer");
  }

  function exportSnapshot() {
    const snapshot = {
      language,
      languageRegion: languageMeta.region,
      lastRun,
      endpoints: endpointStates.map((endpoint) => ({
        label: endpoint.label,
        path: endpoint.path,
        expectedStatus: endpoint.expectedStatus,
        statusCode: endpoint.statusCode ?? null,
        ok: endpoint.ok,
        dataReturned: endpoint.json?.dataReturned ?? null,
        status: endpoint.json?.status ?? null,
      })),
      summary,
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "pantavion-water-readiness-snapshot.json";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#07101f] text-white" dir={direction}>
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 md:px-10 md:py-12">
        <header className="rounded-[2rem] border border-[#d8b35a]/30 bg-[#0c1830] p-7 shadow-2xl">
          <div className="mb-7 rounded-3xl border border-[#d8b35a]/20 bg-black/20 p-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr] lg:items-center">
              <div>
                <label
                  htmlFor="pantavion-language-selector"
                  className="text-xs font-bold uppercase tracking-[0.28em] text-[#d8b35a]"
                >
                  {copy.languageLabel}
                </label>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {copy.languagePromise}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                  Cyprus priority languages Â· six continents Â· 250 languages Â· 7200 natural dialects
                </p>
              </div>

              <select
                id="pantavion-language-selector"
                value={language}
                onChange={(event) => changeLanguage(event.target.value as LanguageCode)}
                className="min-h-12 rounded-2xl border border-[#d8b35a]/40 bg-[#07101f] px-4 py-3 text-sm font-bold text-[#ffe8a3] outline-none"
              >
                {languages.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.nativeName} / {item.label} â€” {item.region}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#d8b35a]">
            Pantavion Professional Infrastructure
          </p>

          <div className="grid gap-7 lg:grid-cols-[1.35fr_0.85fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                {copy.title}
              </h1>
              <p className="mt-4 max-w-3xl text-xl font-semibold text-[#f2d27a]">
                {copy.subtitle}
              </p>
              <p className="mt-5 max-w-4xl text-base leading-8 text-slate-200">
                {copy.explanation}
              </p>
            </div>

            <div className="rounded-3xl border border-red-400/30 bg-red-950/30 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-200">
                {copy.currentStatus}
              </p>
              <p className="mt-3 text-3xl font-bold text-red-100">
                {copy.productionBlocked}
              </p>
              <p className="mt-3 text-sm leading-6 text-red-100/80">
                {copy.blockedReason}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={runAllChecks} className="rounded-2xl border border-[#d8b35a]/50 bg-[#d8b35a]/15 px-5 py-3 text-sm font-bold text-[#ffe8a3] transition hover:bg-[#d8b35a]/25">
              {copy.runLiveChecks}
            </button>
            <button type="button" onClick={copyPresentationMessage} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
              {copyState || copy.copyPresentation}
            </button>
            <button type="button" onClick={() => window.print()} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
              {copy.printPage}
            </button>
            <button type="button" onClick={exportSnapshot} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
              {copy.exportSnapshot}
            </button>
            <button type="button" onClick={() => openContract(endpoints.productionReadiness)} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
              {copy.openReadinessApi}
            </button>
            <button type="button" onClick={() => openContract(endpoints.servingReadiness)} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
              {copy.openServingApi}
            </button>
            <button type="button" onClick={() => openContract(endpoints.addressCandidates)} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
              {copy.openAddressApi}
            </button>
            <button type="button" onClick={() => openContract(endpoints.controlledBbox)} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
              {copy.openBboxApi}
            </button>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(([status, title, text]) => (
            <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d8b35a]">{status}</p>
              <h2 className="mt-3 text-xl font-bold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{text}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] border border-[#d8b35a]/25 bg-[#111a2c] p-6">
          <h2 className="text-2xl font-bold text-[#f2d27a]">{copy.liveChecksTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">{copy.liveChecksText}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
            {copy.lastRun}: {lastRun || copy.notRun}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {endpointStates.map((endpoint) => (
              <article key={endpoint.key} className={`rounded-2xl border p-4 ${statusTone(endpoint)}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">{endpoint.label}</p>
                <p className="mt-3 text-2xl font-bold">
                  {endpoint.loading ? copy.checking : endpoint.statusCode ? endpoint.statusCode : copy.notChecked}
                </p>
                <p className="mt-2 text-xs opacity-75">{copy.expected}: {endpoint.expectedStatus}</p>
                <p className="mt-3 break-words text-xs leading-5 opacity-80">{endpoint.error || endpoint.path}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
            <h2 className="text-2xl font-bold text-[#f2d27a]">{copy.presentationTitle}</h2>
            <p className="mt-5 text-base leading-8 text-slate-200">{copy.presentationP1}</p>
            <p className="mt-4 text-base leading-8 text-slate-200">{copy.presentationP2}</p>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
            <h2 className="text-2xl font-bold text-[#f2d27a]">{copy.readinessTitle}</h2>
            <dl className="mt-5 grid gap-4">
              <div className="flex items-center justify-between rounded-2xl bg-black/20 p-4"><dt className="text-slate-300">{copy.overallReady}</dt><dd className="font-bold text-red-200">{summary.overallReady}</dd></div>
              <div className="flex items-center justify-between rounded-2xl bg-black/20 p-4"><dt className="text-slate-300">{copy.productionActivationAllowed}</dt><dd className="font-bold text-red-200">{summary.productionActivationAllowed}</dd></div>
              <div className="flex items-center justify-between rounded-2xl bg-black/20 p-4"><dt className="text-slate-300">{copy.dataReturned}</dt><dd className="font-bold text-emerald-200">{summary.dataReturned}</dd></div>
              <div className="flex items-center justify-between rounded-2xl bg-black/20 p-4"><dt className="text-slate-300">{copy.mayReturnRawMaster}</dt><dd className="font-bold text-emerald-200">{summary.mayReturnRawMaster}</dd></div>
              <div className="flex items-center justify-between rounded-2xl bg-black/20 p-4"><dt className="text-slate-300">{copy.mayReturnCompleteNetwork}</dt><dd className="font-bold text-emerald-200">{summary.mayReturnCompleteNetwork}</dd></div>
            </dl>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
            <h2 className="text-2xl font-bold text-[#f2d27a]">{copy.addressTitle}</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-200">
              <p>{copy.addressP1}</p>
              <p>{copy.addressP2}</p>
            </div>
            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-[#d8b35a]/20 bg-[#d8b35a]/10 p-4 text-sm leading-7 text-[#f6e4aa]">{copy.selectedCandidateRequired}: <strong>{summary.selectedCandidateRequired}</strong></div>
              <div className="rounded-2xl border border-[#d8b35a]/20 bg-[#d8b35a]/10 p-4 text-sm leading-7 text-[#f6e4aa]">{copy.mayAutoPick}: <strong>{summary.addressAutoPick}</strong></div>
              <div className="rounded-2xl border border-[#d8b35a]/20 bg-[#d8b35a]/10 p-4 text-sm leading-7 text-[#f6e4aa]">{copy.bboxDataReturned}: <strong>{summary.bboxDataReturned}</strong></div>
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
            <h2 className="text-2xl font-bold text-[#f2d27a]">{copy.requiredBeforeProduction}</h2>
            <ul className="mt-5 grid gap-3 md:grid-cols-2">
              {required.map((item) => (
                <li key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-200">{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="rounded-[2rem] border border-emerald-400/20 bg-emerald-950/20 p-7">
          <h2 className="text-2xl font-bold text-emerald-100">{copy.safeGuaranteeTitle}</h2>
          <div className="mt-5 grid gap-4 text-sm leading-7 text-emerald-50/90 md:grid-cols-3">
            <p>{copy.safe1}</p>
            <p>{copy.safe2}</p>
            <p>{copy.safe3}</p>
          </div>
        </section>
      </section>
    </main>
  );
}
