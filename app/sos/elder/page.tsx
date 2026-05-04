import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ElderHistoryMode = "sos" | "ai-note" | "language";

type ElderHistoryItem = {
  id: string;
  mode: ElderHistoryMode;
  text: string;
  createdAt: string;
};

type ElderTranslationMode = "auto" | "manual";

type ElderLanguageCode =
  | "el"
  | "en"
  | "tr"
  | "ar"
  | "fr"
  | "de"
  | "es"
  | "it"
  | "ro"
  | "ru";

type ElderLanguage = {
  code: ElderLanguageCode;
  label: string;
  nativeLabel: string;
  direction: "ltr" | "rtl";
};

type ElderTranslation = {
  pageBadge: string;
  pageTitle: string;
  pageIntro: string;
  languageLabel: string;
  languageHelp: string;
  emergencyBoundary: string;

  redKicker: string;
  sosButton: string;
  redTitle: string;
  redBody: string;
  openLiveSos: string;
  emergencyCircle: string;

  orangeKicker: string;
  orangeTitle: string;
  orangeBody: string;
  orangeButton: string;

  greenKicker: string;
  greenTitle: string;
  greenBody: string;
  greenNoteLabel: string;
  greenPlaceholder: string;
  saveToPhone: string;
  aiVoiceNext: string;
  aiBoundary: string;

  historyTitle: string;
  historyBody: string;
  deleteHistory: string;
  noHistory: string;
  sosHistoryLabel: string;
  languageHistoryLabel: string;
  noteHistoryLabel: string;

  rulesTitle: string;
  rules: string[];

  sosHistoryText: string;
  languageSavedPrefix: string;
  languageSavedSuffix: string;
  languageHistoryPrefix: string;
  localSosActivated: string;
  noteSaved: string;
  historyCleared: string;
};

const historyKey = "pantavion_elder_safety_history_v1";
const globalLanguageKey = "pantavion_global_language_v1";
const translationModeKey = "pantavion_elder_translation_mode_v1";
const helperLanguageKey = "pantavion_helper_language_v1";

const languageOptions: ElderLanguage[] = [
  { code: "el", label: "Greek", nativeLabel: "Î•Î»Î»Î·Î½Î¹ÎºÎ¬", direction: "ltr" },
  { code: "en", label: "English", nativeLabel: "English", direction: "ltr" },
  { code: "tr", label: "Turkish", nativeLabel: "TÃ¼rkÃ§e", direction: "ltr" },
  { code: "ar", label: "Arabic", nativeLabel: "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©", direction: "rtl" },
  { code: "fr", label: "French", nativeLabel: "FranÃ§ais", direction: "ltr" },
  { code: "de", label: "German", nativeLabel: "Deutsch", direction: "ltr" },
  { code: "es", label: "Spanish", nativeLabel: "EspaÃ±ol", direction: "ltr" },
  { code: "it", label: "Italian", nativeLabel: "Italiano", direction: "ltr" },
  { code: "ro", label: "Romanian", nativeLabel: "RomÃ¢nÄƒ", direction: "ltr" },
  { code: "ru", label: "Russian", nativeLabel: "Ð ÑƒÑÑÐºÐ¸Ð¹", direction: "ltr" },
];

const elderTranslations: Record<ElderLanguageCode, ElderTranslation> = {
  el: {
    pageBadge: "Pantavion Elder Safe Mode",
    pageTitle: "Î‘Ï€Î»Î® Î¿Î¸ÏŒÎ½Î· Ï€ÏÎ¿ÏƒÏ„Î±ÏƒÎ¯Î±Ï‚.",
    pageIntro:
      "Î“Î¹Î± Î·Î»Î¹ÎºÎ¹Ï‰Î¼Î­Î½Î¿Ï…Ï‚, Î±Î½Î¸ÏÏŽÏ€Î¿Ï…Ï‚ Ï€Î¿Ï… Î¶Î¿Ï…Î½ Î¼ÏŒÎ½Î¿Î¹ ÎºÎ±Î¹ Ï‡ÏÎ®ÏƒÏ„ÎµÏ‚ Ï€Î¿Ï… Ï‡ÏÎµÎ¹Î¬Î¶Î¿Î½Ï„Î±Î¹ Î¼ÎµÎ³Î¬Î»Î± ÎºÎ¿Ï…Î¼Ï€Î¹Î¬, ÎºÎ±Î¸Î±ÏÎ® Ï†Ï‰Î½Î®, Î±Ï€Î»Î® Î²Î¿Î®Î¸ÎµÎ¹Î±, ÎµÏ€Î¹Î»Î¿Î³Î® Î³Î»ÏŽÏƒÏƒÎ±Ï‚ ÎºÎ±Î¹ Î»Î¹Î³ÏŒÏ„ÎµÏÎ· ÏƒÏÎ³Ï‡Ï…ÏƒÎ·.",
    languageLabel: "Î“Î»ÏŽÏƒÏƒÎ± / Language",
    languageHelp:
      "Î— ÎµÏ€Î¹Î»Î¿Î³Î® Î±Ï€Î¿Î¸Î·ÎºÎµÏÎµÏ„Î±Î¹ Î¼Îµ global Pantavion key, ÏŽÏƒÏ„Îµ Î½Î± Î¼Î·Î½ Î¾Î±Î½Î±Ï‡Î¬Î½ÎµÏ„Î±Î¹ Î±Î½Î¬Î¼ÎµÏƒÎ± ÏƒÎµ SOS / Î¼ÎµÏ„Î¬Ï†ÏÎ±ÏƒÎ· / AI Ï†Î¯Î»Î¿.",
    emergencyBoundary:
      "Î¤Î¿ ÎºÏŒÎºÎºÎ¹Î½Î¿ SOS ÎµÎ¯Î½Î±Î¹ Î³Î¹Î± Î¬Î¼ÎµÏƒÎ¿ ÎºÎ¯Î½Î´Ï…Î½Î¿. Î”ÎµÎ½ Ï…Ï€ÏŒÏƒÏ‡ÎµÏ„Î±Î¹ Î±Ï…Ï„ÏŒÎ¼Î±Ï„Î· ÎºÏÎ±Ï„Î¹ÎºÎ® Î±Ï€Î¿ÏƒÏ„Î¿Î»Î®, Î±ÏƒÎ¸ÎµÎ½Î¿Ï†ÏŒÏÎ¿ Î® Î´Î¿ÏÏ…Ï†Î¿ÏÎ¹ÎºÎ® Î´Î¹Î¬ÏƒÏ‰ÏƒÎ· Ï‡Ï‰ÏÎ¯Ï‚ Ï€Î¹ÏƒÏ„Î¿Ï€Î¿Î¹Î·Î¼Î­Î½Î¿ Ï€Î¬ÏÎ¿Ï‡Î¿.",

    redKicker: "ÎšÏŒÎºÎºÎ¹Î½Î¿ = Î†Î¼ÎµÏƒÎ¿Ï‚ ÎºÎ¯Î½Î´Ï…Î½Î¿Ï‚",
    sosButton: "SOS",
    redTitle: "ÎˆÎ½Î± Ï€Î¬Ï„Î·Î¼Î±: Î´Ï…Î½Î±Ï„Î® ÎµÎ¹Î´Î¿Ï€Î¿Î¯Î·ÏƒÎ· ÏƒÏ„Î· ÏƒÏ…ÏƒÎºÎµÏ…Î® ÎºÎ±Î¹ ÎºÎ±Ï„Î±Î³ÏÎ±Ï†Î® ÏŽÏÎ±Ï‚.",
    redBody:
      "ÎŸÎ¹ ÎµÏ€Î±Ï†Î­Ï‚ Î­ÎºÏ„Î±ÎºÏ„Î·Ï‚ Î±Î½Î¬Î³ÎºÎ·Ï‚ Ï€ÏÎ­Ï€ÎµÎ¹ Î½Î± Î­Ï‡Î¿Ï…Î½ Î´Î·Î»Ï‰Î¸ÎµÎ¯ Î±Ï€ÏŒ Ï€ÏÎ¹Î½. Î“Î¹Î± Ï„Î·Î½ Ï€Î»Î®ÏÎ· Live SOS ÏÎ¿Î® Î¬Î½Î¿Î¹Î¾Îµ Ï„Î·Î½ ÎºÏÏÎ¹Î± ÏƒÎµÎ»Î¯Î´Î± SOS.",
    openLiveSos: "Î†Î½Î¿Î¹Î³Î¼Î± Live SOS",
    emergencyCircle: "ÎšÏÎºÎ»Î¿Ï‚ Î±Î½Î¬Î³ÎºÎ·Ï‚",

    orangeKicker: "Î Î¿ÏÏ„Î¿ÎºÎ±Î»Î¯ = Î’Î¿Î®Î¸ÎµÎ¹Î± / ÎœÎµÏ„Î¬Ï†ÏÎ±ÏƒÎ·",
    orangeTitle: "ÎœÎ¯Î»Î± ÎºÎ±Î¹ ÎºÎ±Ï„Î¬Î»Î±Î²Îµ.",
    orangeBody:
      "Î“Î¹Î± ÏƒÏ€Î¯Ï„Î¹, Î½Î¿ÏƒÎ¿ÎºÎ¿Î¼ÎµÎ¯Î¿, Î´ÏÏŒÎ¼Î¿, Ï„Î±Î¾Î¯, Ï…Ï€Î·ÏÎµÏƒÎ¯Î± Î® Î¬Î½Î¸ÏÏ‰Ï€Î¿ Ï€Î¿Ï… Î¼Î¹Î»Î¬ Î¬Î»Î»Î· Î³Î»ÏŽÏƒÏƒÎ±. Î”ÎµÎ½ Î´Î¯Î½ÎµÎ¹ Ï€ÏÏŒÏƒÎ²Î±ÏƒÎ· ÏƒÏ„Î¿ Ï€ÏÎ¬ÏƒÎ¹Î½Î¿ Ï€ÏÎ¿ÏƒÏ‰Ï€Î¹ÎºÏŒ Î¹ÏƒÏ„Î¿ÏÎ¹ÎºÏŒ.",
    orangeButton: "Î’Î¿Î®Î¸ÎµÎ¹Î± / ÎœÎµÏ„Î¬Ï†ÏÎ±ÏƒÎ·",

    greenKicker: "Î ÏÎ¬ÏƒÎ¹Î½Î¿ = AI Î¦Î¯Î»Î¿Ï‚ / Î—Î¼ÎµÏÎ¿Î»ÏŒÎ³Î¹Î¿",
    greenTitle: "ÎœÎ¯Î»Î·ÏƒÎµ Î® Î³ÏÎ¬ÏˆÎµ ÏŒ,Ï„Î¹ ÏƒÎµ Î±Ï€Î±ÏƒÏ‡Î¿Î»ÎµÎ¯.",
    greenBody:
      "Î¤Î¿ Ï€Î»Î®ÏÎµÏ‚ AI Î¼Îµ Ï†Ï…ÏƒÎ¹ÎºÎ® Ï†Ï‰Î½Î® Î¸Î± Î­ÏÎ¸ÎµÎ¹ Î¼Îµ Ï„Î¿ PantaAI provider layer. Î‘Ï€ÏŒ Ï„ÏŽÏÎ± ÎºÏÎ±Ï„Î¬Î¼Îµ Ï„Î¿ ÏƒÏ‰ÏƒÏ„ÏŒ Ï„Î¿Ï€Î¹ÎºÏŒ Î·Î¼ÎµÏÎ¿Î»ÏŒÎ³Î¹Î¿ Î¼Îµ Î·Î¼ÎµÏÎ¿Î¼Î·Î½Î¯Î± ÎºÎ±Î¹ ÏŽÏÎ±.",
    greenNoteLabel: "Î“ÏÎ¬ÏˆÎµ ÏƒÎ·Î¼ÎµÎ¯Ï‰ÏƒÎ· Î³Î¹Î± ÎµÏƒÎ­Î½Î± Î® Ï„Î·Î½ Î¿Î¹ÎºÎ¿Î³Î­Î½ÎµÎ¹Î± Ï€Î¿Ï… Î­Ï‡ÎµÎ¹Ï‚ ÎµÏ€Î¹Î»Î­Î¾ÎµÎ¹:",
    greenPlaceholder:
      "Î .Ï‡. ÏƒÎ®Î¼ÎµÏÎ± Î¶Î±Î»Î¯ÏƒÏ„Î·ÎºÎ±, Î­Î½Î¹Ï‰ÏƒÎ± Î¼ÏŒÎ½Î¿Ï‚/Î· Î® Î¸Î­Î»Ï‰ Î½Î± Î¼Î¹Î»Î®ÏƒÏ‰ ÏƒÏ„Î± Ï€Î±Î¹Î´Î¹Î¬ Î¼Î¿Ï…...",
    saveToPhone: "Î‘Ï€Î¿Î¸Î®ÎºÎµÏ…ÏƒÎ· ÏƒÏ„Î¿ ÎºÎ¹Î½Î·Ï„ÏŒ",
    aiVoiceNext: "AI Î¦Î¯Î»Î¿Ï‚: ÎµÏ€ÏŒÎ¼ÎµÎ½Î¿ ÏƒÏ„Î¬Î´Î¹Î¿",
    aiBoundary:
      "ÎŸ AI Î¦Î¯Î»Î¿Ï‚ Î´ÎµÎ½ ÎµÎ¯Î½Î±Î¹ Î³Î¹Î±Ï„ÏÏŒÏ‚, Î´ÎµÎ½ ÎºÎ¬Î½ÎµÎ¹ Î´Î¹Î¬Î³Î½Ï‰ÏƒÎ· ÎºÎ±Î¹ Î´ÎµÎ½ Î±Î½Ï„Î¹ÎºÎ±Î¸Î¹ÏƒÏ„Î¬ ÎµÏ€ÎµÎ¯Î³Î¿Ï…ÏƒÎ± Î²Î¿Î®Î¸ÎµÎ¹Î±. Î˜Î± Î±ÎºÎ¿ÏÎµÎ¹, Î¸Î± Î¿ÏÎ³Î±Î½ÏŽÎ½ÎµÎ¹ Î±Î½Î·ÏƒÏ…Ï‡Î¯ÎµÏ‚ ÎºÎ±Î¹ Î¸Î± Ï€ÏÎ¿Ï„ÎµÎ¯Î½ÎµÎ¹ Î½Î± Î¶Î·Ï„Î·Î¸ÎµÎ¯ Î±Î½Î¸ÏÏŽÏ€Î¹Î½Î· Î® Î¹Î±Ï„ÏÎ¹ÎºÎ® Î²Î¿Î®Î¸ÎµÎ¹Î± ÏŒÏ„Î±Î½ Ï‡ÏÎµÎ¹Î¬Î¶ÎµÏ„Î±Î¹.",

    historyTitle: "Î¤Î¿Ï€Î¹ÎºÏŒ Î¹ÏƒÏ„Î¿ÏÎ¹ÎºÏŒ",
    historyBody: "Î‘Ï€Î¿Î¸Î·ÎºÎµÏÎµÏ„Î±Î¹ ÏƒÏ„Î· ÏƒÏ…ÏƒÎºÎµÏ…Î® Î¼Îµ Î·Î¼ÎµÏÎ¿Î¼Î·Î½Î¯Î±, ÏŽÏÎ± ÎºÎ±Î¹ ÏƒÏ…Î½Î­Ï‡ÎµÎ¹Î± ÏÎ¿Î®Ï‚.",
    deleteHistory: "Î”Î¹Î±Î³ÏÎ±Ï†Î® Î¹ÏƒÏ„Î¿ÏÎ¹ÎºÎ¿Ï",
    noHistory: "Î”ÎµÎ½ Ï…Ï€Î¬ÏÏ‡ÎµÎ¹ Î±ÎºÏŒÎ¼Î± Ï„Î¿Ï€Î¹ÎºÏŒ Î¹ÏƒÏ„Î¿ÏÎ¹ÎºÏŒ ÏƒÎµ Î±Ï…Ï„Î® Ï„Î· ÏƒÏ…ÏƒÎºÎµÏ…Î®.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "Î“Î»ÏŽÏƒÏƒÎ±",
    noteHistoryLabel: "Î£Î·Î¼ÎµÎ¯Ï‰ÏƒÎ·",

    rulesTitle: "ÎšÎ±Î½ÏŒÎ½ÎµÏ‚ Ï€ÏÎ¿ÏƒÏ„Î±ÏƒÎ¯Î±Ï‚ ÎºÎ±Î¹ ÏƒÏ…Î½Î­Ï‡ÎµÎ¹Î±Ï‚",
    rules: [
      "ÎŸ Ï†ÏÎ¿Î½Ï„Î¹ÏƒÏ„Î®Ï‚ Î´ÎµÎ½ Ï€Î±Î¯ÏÎ½ÎµÎ¹ Î±Ï…Ï„ÏŒÎ¼Î±Ï„Î· Ï€ÏÏŒÏƒÎ²Î±ÏƒÎ· ÏƒÏ„Î¿ Ï€ÏÎ¬ÏƒÎ¹Î½Î¿ Î¹ÏƒÏ„Î¿ÏÎ¹ÎºÏŒ.",
      "Î— Î¿Î¹ÎºÎ¿Î³Î­Î½ÎµÎ¹Î± Î²Î»Î­Ï€ÎµÎ¹ Î¼ÏŒÎ½Î¿ ÏŒ,Ï„Î¹ ÎµÏ€Î¹Ï„ÏÎ­ÏˆÎµÎ¹ Î¿ Ï‡ÏÎ®ÏƒÏ„Î·Ï‚ Î® Î½ÏŒÎ¼Î¹Î¼Î¿Ï‚ guardian ÎºÎ±Î½ÏŒÎ½Î±Ï‚.",
      "Î¤Î¿ Ï€Î¿ÏÏ„Î¿ÎºÎ±Î»Î¯ Î²Î¿Î·Î¸Î¬ ÏƒÏ„Î· Î¶Ï‰Î½Ï„Î±Î½Î® ÏƒÏ…Î½ÎµÎ½Î½ÏŒÎ·ÏƒÎ·, ÏŒÏ‡Î¹ ÏƒÏ„Î·Î½ Î±Î½Î¬Î³Î½Ï‰ÏƒÎ· Ï€ÏÎ¿ÏƒÏ‰Ï€Î¹ÎºÏŽÎ½ Î±ÏÏ‡ÎµÎ¯Ï‰Î½.",
      "Î— Î³Î»ÏŽÏƒÏƒÎ±, Ï„Î¿Ï€Î¹ÎºÏŒ Î¹ÏƒÏ„Î¿ÏÎ¹ÎºÏŒ ÎºÎ±Î¹ Î¿Î¹ ÏƒÎ·Î¼ÎµÎ¹ÏŽÏƒÎµÎ¹Ï‚ ÎºÏÎ±Ï„Î¿ÏÎ½ ÏƒÏ…Î½Î­Ï‡ÎµÎ¹Î± Î¼Î­ÏƒÎ± ÏƒÏ„Î· ÏƒÏ…ÏƒÎºÎµÏ…Î®.",
      "Î¤Î¿ Pantavion Î¸Î± Ï‡Ï„Î¯Î¶ÎµÏ„Î±Î¹ Î¼Îµ Î¼Î½Î®Î¼Î· ÏÎ¿Î®Ï‚, ÏŒÏ‡Î¹ Î¼Îµ Î¾ÎµÏ‡Î±ÏƒÎ¼Î­Î½Î± Î±Ï€Î¿ÎºÎ¿Î¼Î¼Î­Î½Î± Î½Î®Î¼Î±Ï„Î±.",
    ],

    sosHistoryText:
      "Î Î±Ï„Î®Î¸Î·ÎºÎµ Ï„Î¿ ÎºÏŒÎºÎºÎ¹Î½Î¿ SOS ÏƒÏ„Î·Î½ ÎµÎ¹Î´Î¹ÎºÎ® Î»ÎµÎ¹Ï„Î¿Ï…ÏÎ³Î¯Î± Î·Î»Î¹ÎºÎ¹Ï‰Î¼Î­Î½Î¿Ï…. Î†Î½Î¿Î¹Î¾Îµ Ï„Î¿ Live SOS Î³Î¹Î± Î±Ï€Î¿ÏƒÏ„Î¿Î»Î®/ÎºÎ¿Î¹Î½Î¿Ï€Î¿Î¯Î·ÏƒÎ· Î¼Î­ÏƒÏ‰ Î´Î¹Î±Î¸Î­ÏƒÎ¹Î¼Ï‰Î½ ÎºÎ±Î½Î±Î»Î¹ÏŽÎ½.",
    languageSavedPrefix: "Î— Î³Î»ÏŽÏƒÏƒÎ± Î±Ï€Î¿Î¸Î·ÎºÎµÏÏ„Î·ÎºÎµ Ï‰Ï‚",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "Î— Î³Î»ÏŽÏƒÏƒÎ± Ï„Î·Ï‚ ÎµÎ¹Î´Î¹ÎºÎ®Ï‚ Î¿Î¸ÏŒÎ½Î·Ï‚ Î¬Î»Î»Î±Î¾Îµ ÏƒÎµ",
    localSosActivated:
      "Î¤Î¿Ï€Î¹ÎºÏŒ SOS ÎµÎ½ÎµÏÎ³Î¿Ï€Î¿Î¹Î®Î¸Î·ÎºÎµ: Î®Ï‡Î¿Ï‚/Î´ÏŒÎ½Î·ÏƒÎ· ÏŒÏ€Î¿Ï… ÎµÏ€Î¹Ï„ÏÎ­Ï€ÎµÏ„Î±Î¹ ÎºÎ±Î¹ ÎºÎ±Ï„Î±Î³ÏÎ±Ï†Î® ÏŽÏÎ±Ï‚ ÏƒÏ„Î· ÏƒÏ…ÏƒÎºÎµÏ…Î®.",
    noteSaved: "Î— ÏƒÎ·Î¼ÎµÎ¯Ï‰ÏƒÎ· Î±Ï€Î¿Î¸Î·ÎºÎµÏÏ„Î·ÎºÎµ Ï„Î¿Ï€Î¹ÎºÎ¬ ÏƒÏ„Î· ÏƒÏ…ÏƒÎºÎµÏ…Î® Î¼Îµ Î·Î¼ÎµÏÎ¿Î¼Î·Î½Î¯Î± ÎºÎ±Î¹ ÏŽÏÎ±.",
    historyCleared: "Î¤Î¿ Ï„Î¿Ï€Î¹ÎºÏŒ Î¹ÏƒÏ„Î¿ÏÎ¹ÎºÏŒ Î±Ï…Ï„Î®Ï‚ Ï„Î·Ï‚ Î¿Î¸ÏŒÎ½Î·Ï‚ Î´Î¹Î±Î³ÏÎ¬Ï†Î·ÎºÎµ Î±Ï€ÏŒ Ï„Î· ÏƒÏ…ÏƒÎºÎµÏ…Î®.",
  },

  en: {
    pageBadge: "Pantavion Elder Safe Mode",
    pageTitle: "A simple protection screen.",
    pageIntro:
      "For elders, people living alone, and users who need large buttons, clear voice support, simple help, language choice, and less confusion.",
    languageLabel: "Language",
    languageHelp:
      "Your choice is stored with the global Pantavion key so it is not lost between SOS, translation, and AI friend flows.",
    emergencyBoundary:
      "The red SOS is for immediate danger. It does not promise automatic government dispatch, ambulance dispatch, or satellite rescue without a certified provider.",

    redKicker: "Red = Immediate danger",
    sosButton: "SOS",
    redTitle: "One tap: strong device alert and time record.",
    redBody:
      "Emergency contacts must be set in advance. For the full Live SOS flow, open the main SOS page.",
    openLiveSos: "Open Live SOS",
    emergencyCircle: "Emergency Circle",

    orangeKicker: "Orange = Help / Translation",
    orangeTitle: "Speak and understand.",
    orangeBody:
      "For home, hospital, street, taxi, public service, or a person speaking another language. It does not access the green private history.",
    orangeButton: "Help / Translation",

    greenKicker: "Green = AI Friend / Journal",
    greenTitle: "Speak or write what worries you.",
    greenBody:
      "Full natural voice AI will come with the PantaAI provider layer. For now, we keep the right local journal with date and time.",
    greenNoteLabel: "Write a note for yourself or the family you have chosen:",
    greenPlaceholder:
      "Example: today I felt dizzy, lonely, or I want to speak with my family...",
    saveToPhone: "Save to phone",
    aiVoiceNext: "AI Friend: next stage",
    aiBoundary:
      "The AI Friend is not a doctor, does not diagnose, and does not replace emergency help. It will listen, organize concerns, and suggest human or medical help when needed.",

    historyTitle: "Local history",
    historyBody: "Stored on this device with date, time, and continuity.",
    deleteHistory: "Delete history",
    noHistory: "There is no local history on this device yet.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "Language",
    noteHistoryLabel: "Note",

    rulesTitle: "Protection and continuity rules",
    rules: [
      "The caregiver does not get automatic access to the green history.",
      "Family sees only what the user allows or what a lawful guardian rule permits.",
      "Orange helps live communication, not reading private files.",
      "Language, local history, and notes keep continuity on the device.",
      "Pantavion will be built with flow memory, not forgotten isolated threads.",
    ],

    sosHistoryText:
      "The red SOS was pressed in Elder Safe Mode. Live SOS was opened for sending/sharing through available channels.",
    languageSavedPrefix: "Language saved as",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "The special screen language changed to",
    localSosActivated:
      "Local SOS activated: sound/vibration where allowed and time recorded on the device.",
    noteSaved: "The note was saved locally on the device with date and time.",
    historyCleared: "The local history of this screen was deleted from the device.",
  },

  tr: {
    pageBadge: "Pantavion YaÅŸlÄ± GÃ¼venli Modu",
    pageTitle: "Basit bir koruma ekranÄ±.",
    pageIntro:
      "YaÅŸlÄ±lar, yalnÄ±z yaÅŸayan kiÅŸiler ve bÃ¼yÃ¼k dÃ¼ÄŸmeler, net ses, basit yardÄ±m, dil seÃ§imi ve daha az karmaÅŸa isteyen kullanÄ±cÄ±lar iÃ§in.",
    languageLabel: "Dil",
    languageHelp:
      "SeÃ§im, SOS, Ã§eviri ve AI arkadaÅŸ akÄ±ÅŸlarÄ± arasÄ±nda kaybolmamasÄ± iÃ§in global Pantavion anahtarÄ±yla saklanÄ±r.",
    emergencyBoundary:
      "KÄ±rmÄ±zÄ± SOS acil tehlike iÃ§indir. SertifikalÄ± saÄŸlayÄ±cÄ± olmadan otomatik resmi sevk, ambulans veya uydu kurtarma sÃ¶zÃ¼ vermez.",

    redKicker: "KÄ±rmÄ±zÄ± = Acil tehlike",
    sosButton: "SOS",
    redTitle: "Tek dokunuÅŸ: cihazda gÃ¼Ã§lÃ¼ uyarÄ± ve zaman kaydÄ±.",
    redBody:
      "Acil kiÅŸiler Ã¶nceden ayarlanmÄ±ÅŸ olmalÄ±dÄ±r. Tam Live SOS akÄ±ÅŸÄ± iÃ§in ana SOS sayfasÄ±nÄ± aÃ§Ä±n.",
    openLiveSos: "Live SOS'u aÃ§",
    emergencyCircle: "Acil Ã‡evre",

    orangeKicker: "Turuncu = YardÄ±m / Ã‡eviri",
    orangeTitle: "KonuÅŸ ve anla.",
    orangeBody:
      "Ev, hastane, sokak, taksi, kamu hizmeti veya baÅŸka dil konuÅŸan biri iÃ§in. YeÅŸil Ã¶zel geÃ§miÅŸe eriÅŸmez.",
    orangeButton: "YardÄ±m / Ã‡eviri",

    greenKicker: "YeÅŸil = AI ArkadaÅŸ / GÃ¼nlÃ¼k",
    greenTitle: "Seni endiÅŸelendiren ÅŸeyi konuÅŸ veya yaz.",
    greenBody:
      "DoÄŸal sesli tam AI, PantaAI saÄŸlayÄ±cÄ± katmanÄ±yla gelecek. Åžimdilik doÄŸru yerel gÃ¼nlÃ¼ÄŸÃ¼ tarih ve saatle tutuyoruz.",
    greenNoteLabel: "Kendin veya seÃ§tiÄŸin aile iÃ§in bir not yaz:",
    greenPlaceholder:
      "Ã–rn. bugÃ¼n baÅŸÄ±m dÃ¶ndÃ¼, yalnÄ±z hissettim veya ailemle konuÅŸmak istiyorum...",
    saveToPhone: "Telefona kaydet",
    aiVoiceNext: "AI ArkadaÅŸ: sonraki aÅŸama",
    aiBoundary:
      "AI ArkadaÅŸ doktor deÄŸildir, tanÄ± koymaz ve acil yardÄ±mÄ±n yerini almaz. Dinler, endiÅŸeleri dÃ¼zenler ve gerektiÄŸinde insan veya tÄ±bbi yardÄ±m Ã¶nerir.",

    historyTitle: "Yerel geÃ§miÅŸ",
    historyBody: "Bu cihazda tarih, saat ve sÃ¼reklilikle saklanÄ±r.",
    deleteHistory: "GeÃ§miÅŸi sil",
    noHistory: "Bu cihazda henÃ¼z yerel geÃ§miÅŸ yok.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "Dil",
    noteHistoryLabel: "Not",

    rulesTitle: "Koruma ve sÃ¼reklilik kurallarÄ±",
    rules: [
      "BakÄ±cÄ± yeÅŸil geÃ§miÅŸe otomatik eriÅŸim almaz.",
      "Aile yalnÄ±zca kullanÄ±cÄ±nÄ±n izin verdiÄŸini veya yasal guardian kuralÄ±nÄ±n izin verdiÄŸini gÃ¶rÃ¼r.",
      "Turuncu canlÄ± iletiÅŸime yardÄ±m eder, Ã¶zel dosyalarÄ± okumaz.",
      "Dil, yerel geÃ§miÅŸ ve notlar cihazda sÃ¼reklilik saÄŸlar.",
      "Pantavion, unutulan kopuk konularla deÄŸil akÄ±ÅŸ hafÄ±zasÄ±yla inÅŸa edilecektir.",
    ],

    sosHistoryText:
      "YaÅŸlÄ± GÃ¼venli Modunda kÄ±rmÄ±zÄ± SOS'a basÄ±ldÄ±. Live SOS mevcut kanallardan gÃ¶nderme/paylaÅŸma iÃ§in aÃ§Ä±ldÄ±.",
    languageSavedPrefix: "Dil kaydedildi:",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "Ã–zel ekran dili deÄŸiÅŸtirildi:",
    localSosActivated:
      "Yerel SOS etkinleÅŸtirildi: izin verilen yerde ses/titreÅŸim ve cihazda zaman kaydÄ±.",
    noteSaved: "Not, tarih ve saatle cihazda yerel olarak kaydedildi.",
    historyCleared: "Bu ekranÄ±n yerel geÃ§miÅŸi cihazdan silindi.",
  },

  ar: {
    pageBadge: "ÙˆØ¶Ø¹ Pantavion Ø§Ù„Ø¢Ù…Ù† Ù„ÙƒØ¨Ø§Ø± Ø§Ù„Ø³Ù†",
    pageTitle: "Ø´Ø§Ø´Ø© Ø­Ù…Ø§ÙŠØ© Ø¨Ø³ÙŠØ·Ø©.",
    pageIntro:
      "Ù„ÙƒØ¨Ø§Ø± Ø§Ù„Ø³Ù†ØŒ ÙˆØ§Ù„Ø£Ø´Ø®Ø§Øµ Ø§Ù„Ø°ÙŠÙ† ÙŠØ¹ÙŠØ´ÙˆÙ† ÙˆØ­Ø¯Ù‡Ù…ØŒ ÙˆØ§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† Ø§Ù„Ø°ÙŠÙ† ÙŠØ­ØªØ§Ø¬ÙˆÙ† Ø¥Ù„Ù‰ Ø£Ø²Ø±Ø§Ø± ÙƒØ¨ÙŠØ±Ø©ØŒ ÙˆØµÙˆØª ÙˆØ§Ø¶Ø­ØŒ ÙˆÙ…Ø³Ø§Ø¹Ø¯Ø© Ø¨Ø³ÙŠØ·Ø©ØŒ ÙˆØ§Ø®ØªÙŠØ§Ø± Ø§Ù„Ù„ØºØ©ØŒ ÙˆØªÙ‚Ù„ÙŠÙ„ Ø§Ù„Ø§Ø±ØªØ¨Ø§Ùƒ.",
    languageLabel: "Ø§Ù„Ù„ØºØ©",
    languageHelp:
      "ÙŠØªÙ… Ø­ÙØ¸ Ø§Ø®ØªÙŠØ§Ø±Ùƒ Ø¨Ù…ÙØªØ§Ø­ Pantavion Ø¹Ø§Ù„Ù…ÙŠ Ø­ØªÙ‰ Ù„Ø§ ÙŠØ¶ÙŠØ¹ Ø¨ÙŠÙ† SOS ÙˆØ§Ù„ØªØ±Ø¬Ù…Ø© ÙˆØµØ¯ÙŠÙ‚ AI.",
    emergencyBoundary:
      "Ø²Ø± SOS Ø§Ù„Ø£Ø­Ù…Ø± Ù…Ø®ØµØµ Ù„Ù„Ø®Ø·Ø± Ø§Ù„ÙÙˆØ±ÙŠ. Ù„Ø§ ÙŠØ¹Ø¯ Ø¨Ø¥Ø±Ø³Ø§Ù„ Ø­ÙƒÙˆÙ…ÙŠ Ø£Ùˆ Ø¥Ø³Ø¹Ø§Ù Ø£Ùˆ Ø¥Ù†Ù‚Ø§Ø° Ø¹Ø¨Ø± Ø§Ù„Ø£Ù‚Ù…Ø§Ø± Ø§Ù„ØµÙ†Ø§Ø¹ÙŠØ© Ø¨Ø¯ÙˆÙ† Ù…Ø²ÙˆØ¯ Ù…Ø¹ØªÙ…Ø¯.",

    redKicker: "Ø§Ù„Ø£Ø­Ù…Ø± = Ø®Ø·Ø± ÙÙˆØ±ÙŠ",
    sosButton: "SOS",
    redTitle: "Ø¶ØºØ·Ø© ÙˆØ§Ø­Ø¯Ø©: ØªÙ†Ø¨ÙŠÙ‡ Ù‚ÙˆÙŠ Ø¹Ù„Ù‰ Ø§Ù„Ø¬Ù‡Ø§Ø² ÙˆØªØ³Ø¬ÙŠÙ„ Ø§Ù„ÙˆÙ‚Øª.",
    redBody:
      "ÙŠØ¬Ø¨ ØªØ­Ø¯ÙŠØ¯ Ø¬Ù‡Ø§Øª Ø§Ù„Ø·ÙˆØ§Ø±Ø¦ Ù…Ø³Ø¨Ù‚Ù‹Ø§. Ù„ÙØªØ­ ØªØ¯ÙÙ‚ Live SOS Ø§Ù„ÙƒØ§Ù…Ù„ØŒ Ø§ÙØªØ­ ØµÙØ­Ø© SOS Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©.",
    openLiveSos: "ÙØªØ­ Live SOS",
    emergencyCircle: "Ø¯Ø§Ø¦Ø±Ø© Ø§Ù„Ø·ÙˆØ§Ø±Ø¦",

    orangeKicker: "Ø§Ù„Ø¨Ø±ØªÙ‚Ø§Ù„ÙŠ = Ù…Ø³Ø§Ø¹Ø¯Ø© / ØªØ±Ø¬Ù…Ø©",
    orangeTitle: "ØªØ­Ø¯Ø« ÙˆØ§ÙÙ‡Ù….",
    orangeBody:
      "Ù„Ù„Ù…Ù†Ø²Ù„ØŒ Ø§Ù„Ù…Ø³ØªØ´ÙÙ‰ØŒ Ø§Ù„Ø´Ø§Ø±Ø¹ØŒ Ø§Ù„ØªØ§ÙƒØ³ÙŠØŒ Ø§Ù„Ø®Ø¯Ù…Ø© Ø§Ù„Ø¹Ø§Ù…Ø©ØŒ Ø£Ùˆ Ø´Ø®Øµ ÙŠØªØ­Ø¯Ø« Ù„ØºØ© Ø£Ø®Ø±Ù‰. Ù„Ø§ ÙŠØµÙ„ Ø¥Ù„Ù‰ Ø§Ù„ØªØ§Ø±ÙŠØ® Ø§Ù„Ø®Ø§Øµ Ø§Ù„Ø£Ø®Ø¶Ø±.",
    orangeButton: "Ù…Ø³Ø§Ø¹Ø¯Ø© / ØªØ±Ø¬Ù…Ø©",

    greenKicker: "Ø§Ù„Ø£Ø®Ø¶Ø± = ØµØ¯ÙŠÙ‚ AI / ÙŠÙˆÙ…ÙŠØ§Øª",
    greenTitle: "ØªØ­Ø¯Ø« Ø£Ùˆ Ø§ÙƒØªØ¨ Ù…Ø§ ÙŠÙ‚Ù„Ù‚Ùƒ.",
    greenBody:
      "Ø³ÙŠØ£ØªÙŠ Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ Ø§Ù„ØµÙˆØªÙŠ Ø§Ù„ÙƒØ§Ù…Ù„ Ù…Ø¹ Ø·Ø¨Ù‚Ø© Ù…Ø²ÙˆØ¯ PantaAI. Ø§Ù„Ø¢Ù† Ù†Ø­ÙØ¸ Ø§Ù„ÙŠÙˆÙ…ÙŠØ§Øª Ø§Ù„Ù…Ø­Ù„ÙŠØ© Ø§Ù„ØµØ­ÙŠØ­Ø© Ø¨Ø§Ù„ØªØ§Ø±ÙŠØ® ÙˆØ§Ù„ÙˆÙ‚Øª.",
    greenNoteLabel: "Ø§ÙƒØªØ¨ Ù…Ù„Ø§Ø­Ø¸Ø© Ù„Ù†ÙØ³Ùƒ Ø£Ùˆ Ù„Ù„Ø¹Ø§Ø¦Ù„Ø© Ø§Ù„ØªÙŠ Ø§Ø®ØªØ±ØªÙ‡Ø§:",
    greenPlaceholder:
      "Ù…Ø«Ø§Ù„: Ø´Ø¹Ø±Øª Ø§Ù„ÙŠÙˆÙ… Ø¨Ø§Ù„Ø¯ÙˆØ§Ø± Ø£Ùˆ Ø§Ù„ÙˆØ­Ø¯Ø© Ø£Ùˆ Ø£Ø±ÙŠØ¯ Ø§Ù„ØªØ­Ø¯Ø« Ù…Ø¹ Ø¹Ø§Ø¦Ù„ØªÙŠ...",
    saveToPhone: "Ø­ÙØ¸ Ø¹Ù„Ù‰ Ø§Ù„Ù‡Ø§ØªÙ",
    aiVoiceNext: "ØµØ¯ÙŠÙ‚ AI: Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„ØªØ§Ù„ÙŠØ©",
    aiBoundary:
      "ØµØ¯ÙŠÙ‚ AI Ù„ÙŠØ³ Ø·Ø¨ÙŠØ¨Ù‹Ø§ØŒ ÙˆÙ„Ø§ ÙŠØ´Ø®ØµØŒ ÙˆÙ„Ø§ ÙŠØ³ØªØ¨Ø¯Ù„ Ø§Ù„Ù…Ø³Ø§Ø¹Ø¯Ø© Ø§Ù„Ø·Ø§Ø±Ø¦Ø©. Ø³ÙŠØ³ØªÙ…Ø¹ØŒ ÙˆÙŠÙ†Ø¸Ù… Ø§Ù„Ù…Ø®Ø§ÙˆÙØŒ ÙˆÙŠÙ‚ØªØ±Ø­ Ù…Ø³Ø§Ø¹Ø¯Ø© Ø¨Ø´Ø±ÙŠØ© Ø£Ùˆ Ø·Ø¨ÙŠØ© Ø¹Ù†Ø¯ Ø§Ù„Ø­Ø§Ø¬Ø©.",

    historyTitle: "Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„Ù…Ø­Ù„ÙŠ",
    historyBody: "ÙŠØªÙ… Ø­ÙØ¸Ù‡ Ø¹Ù„Ù‰ Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø² Ù…Ø¹ Ø§Ù„ØªØ§Ø±ÙŠØ® ÙˆØ§Ù„ÙˆÙ‚Øª ÙˆØ§Ù„Ø§Ø³ØªÙ…Ø±Ø§Ø±ÙŠØ©.",
    deleteHistory: "Ø­Ø°Ù Ø§Ù„Ø³Ø¬Ù„",
    noHistory: "Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø³Ø¬Ù„ Ù…Ø­Ù„ÙŠ Ø¹Ù„Ù‰ Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø² Ø¨Ø¹Ø¯.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "Ø§Ù„Ù„ØºØ©",
    noteHistoryLabel: "Ù…Ù„Ø§Ø­Ø¸Ø©",

    rulesTitle: "Ù‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ø­Ù…Ø§ÙŠØ© ÙˆØ§Ù„Ø§Ø³ØªÙ…Ø±Ø§Ø±ÙŠØ©",
    rules: [
      "Ù„Ø§ ÙŠØ­ØµÙ„ Ù…Ù‚Ø¯Ù… Ø§Ù„Ø±Ø¹Ø§ÙŠØ© Ø¹Ù„Ù‰ ÙˆØµÙˆÙ„ ØªÙ„Ù‚Ø§Ø¦ÙŠ Ø¥Ù„Ù‰ Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„Ø£Ø®Ø¶Ø±.",
      "ØªØ±Ù‰ Ø§Ù„Ø¹Ø§Ø¦Ù„Ø© ÙÙ‚Ø· Ù…Ø§ ÙŠØ³Ù…Ø­ Ø¨Ù‡ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø£Ùˆ Ù…Ø§ ØªØ³Ù…Ø­ Ø¨Ù‡ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„ÙˆØµÙŠ Ø§Ù„Ù‚Ø§Ù†ÙˆÙ†ÙŠØ©.",
      "Ø§Ù„Ø¨Ø±ØªÙ‚Ø§Ù„ÙŠ ÙŠØ³Ø§Ø¹Ø¯ Ø¹Ù„Ù‰ Ø§Ù„ØªÙˆØ§ØµÙ„ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±ØŒ ÙˆÙ„ÙŠØ³ Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ù…Ù„ÙØ§Øª Ø§Ù„Ø®Ø§ØµØ©.",
      "Ø§Ù„Ù„ØºØ© ÙˆØ§Ù„Ø³Ø¬Ù„ Ø§Ù„Ù…Ø­Ù„ÙŠ ÙˆØ§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª ØªØ­ÙØ¸ Ø§Ù„Ø§Ø³ØªÙ…Ø±Ø§Ø±ÙŠØ© Ø¯Ø§Ø®Ù„ Ø§Ù„Ø¬Ù‡Ø§Ø².",
      "Ø³ÙŠØªÙ… Ø¨Ù†Ø§Ø¡ Pantavion Ø¨Ø°Ø§ÙƒØ±Ø© ØªØ¯ÙÙ‚ØŒ ÙˆÙ„ÙŠØ³ Ø¨Ø®ÙŠÙˆØ· Ù…Ù†ÙØµÙ„Ø© Ù…Ù†Ø³ÙŠØ©.",
    ],

    sosHistoryText:
      "ØªÙ… Ø§Ù„Ø¶ØºØ· Ø¹Ù„Ù‰ Ø²Ø± SOS Ø§Ù„Ø£Ø­Ù…Ø± ÙÙŠ ÙˆØ¶Ø¹ ÙƒØ¨Ø§Ø± Ø§Ù„Ø³Ù† Ø§Ù„Ø¢Ù…Ù†. ØªÙ… ÙØªØ­ Live SOS Ù„Ù„Ø¥Ø±Ø³Ø§Ù„/Ø§Ù„Ù…Ø´Ø§Ø±ÙƒØ© Ø¹Ø¨Ø± Ø§Ù„Ù‚Ù†ÙˆØ§Øª Ø§Ù„Ù…ØªØ§Ø­Ø©.",
    languageSavedPrefix: "ØªÙ… Ø­ÙØ¸ Ø§Ù„Ù„ØºØ© ÙƒÙ€",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "ØªÙ… ØªØºÙŠÙŠØ± Ù„ØºØ© Ø§Ù„Ø´Ø§Ø´Ø© Ø§Ù„Ø®Ø§ØµØ© Ø¥Ù„Ù‰",
    localSosActivated:
      "ØªÙ… ØªÙØ¹ÙŠÙ„ SOS Ø§Ù„Ù…Ø­Ù„ÙŠ: ØµÙˆØª/Ø§Ù‡ØªØ²Ø§Ø² Ø­ÙŠØ«Ù…Ø§ ÙŠÙØ³Ù…Ø­ØŒ ÙˆØªØ³Ø¬ÙŠÙ„ Ø§Ù„ÙˆÙ‚Øª Ø¹Ù„Ù‰ Ø§Ù„Ø¬Ù‡Ø§Ø².",
    noteSaved: "ØªÙ… Ø­ÙØ¸ Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø© Ù…Ø­Ù„ÙŠÙ‹Ø§ Ø¹Ù„Ù‰ Ø§Ù„Ø¬Ù‡Ø§Ø² Ù…Ø¹ Ø§Ù„ØªØ§Ø±ÙŠØ® ÙˆØ§Ù„ÙˆÙ‚Øª.",
    historyCleared: "ØªÙ… Ø­Ø°Ù Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„Ù…Ø­Ù„ÙŠ Ù„Ù‡Ø°Ù‡ Ø§Ù„Ø´Ø§Ø´Ø© Ù…Ù† Ø§Ù„Ø¬Ù‡Ø§Ø².",
  },

  fr: {
    pageBadge: "Mode sÃ©curitÃ© senior Pantavion",
    pageTitle: "Un Ã©cran de protection simple.",
    pageIntro:
      "Pour les personnes Ã¢gÃ©es, les personnes vivant seules et les utilisateurs qui ont besoin de grands boutons, d'une voix claire, d'une aide simple, d'un choix de langue et de moins de confusion.",
    languageLabel: "Langue",
    languageHelp:
      "Le choix est enregistrÃ© avec la clÃ© globale Pantavion afin de ne pas Ãªtre perdu entre SOS, traduction et ami AI.",
    emergencyBoundary:
      "Le SOS rouge est rÃ©servÃ© au danger immÃ©diat. Il ne promet pas d'envoi officiel, d'ambulance ou de secours satellite sans fournisseur certifiÃ©.",

    redKicker: "Rouge = Danger immÃ©diat",
    sosButton: "SOS",
    redTitle: "Un appui : alerte forte sur l'appareil et heure enregistrÃ©e.",
    redBody:
      "Les contacts d'urgence doivent Ãªtre dÃ©finis Ã  l'avance. Pour le flux Live SOS complet, ouvrez la page SOS principale.",
    openLiveSos: "Ouvrir Live SOS",
    emergencyCircle: "Cercle d'urgence",

    orangeKicker: "Orange = Aide / Traduction",
    orangeTitle: "Parlez et comprenez.",
    orangeBody:
      "Pour la maison, l'hÃ´pital, la rue, le taxi, un service public ou une personne parlant une autre langue. Cela n'accÃ¨de pas Ã  l'historique privÃ© vert.",
    orangeButton: "Aide / Traduction",

    greenKicker: "Vert = Ami AI / Journal",
    greenTitle: "Parlez ou Ã©crivez ce qui vous prÃ©occupe.",
    greenBody:
      "L'AI avec voix naturelle complÃ¨te arrivera avec la couche fournisseur PantaAI. Pour l'instant, nous gardons le bon journal local avec date et heure.",
    greenNoteLabel: "Ã‰crivez une note pour vous-mÃªme ou la famille choisie :",
    greenPlaceholder:
      "Exemple : aujourd'hui j'ai eu des vertiges, je me suis senti seul ou je veux parler Ã  ma famille...",
    saveToPhone: "Enregistrer sur le tÃ©lÃ©phone",
    aiVoiceNext: "Ami AI : prochaine Ã©tape",
    aiBoundary:
      "L'Ami AI n'est pas mÃ©decin, ne diagnostique pas et ne remplace pas l'aide d'urgence. Il Ã©coutera, organisera les inquiÃ©tudes et proposera une aide humaine ou mÃ©dicale si nÃ©cessaire.",

    historyTitle: "Historique local",
    historyBody: "StockÃ© sur cet appareil avec date, heure et continuitÃ©.",
    deleteHistory: "Supprimer l'historique",
    noHistory: "Il n'y a pas encore d'historique local sur cet appareil.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "Langue",
    noteHistoryLabel: "Note",

    rulesTitle: "RÃ¨gles de protection et de continuitÃ©",
    rules: [
      "L'aidant n'obtient pas un accÃ¨s automatique Ã  l'historique vert.",
      "La famille voit seulement ce que l'utilisateur autorise ou ce qu'une rÃ¨gle lÃ©gale de tuteur permet.",
      "L'orange aide la communication en direct, pas la lecture de fichiers privÃ©s.",
      "La langue, l'historique local et les notes gardent la continuitÃ© sur l'appareil.",
      "Pantavion sera construit avec une mÃ©moire de flux, pas avec des fils isolÃ©s oubliÃ©s.",
    ],

    sosHistoryText:
      "Le SOS rouge a Ã©tÃ© pressÃ© en mode sÃ©curitÃ© senior. Live SOS a Ã©tÃ© ouvert pour envoyer/partager via les canaux disponibles.",
    languageSavedPrefix: "Langue enregistrÃ©e :",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "La langue de l'Ã©cran spÃ©cial est passÃ©e Ã ",
    localSosActivated:
      "SOS local activÃ© : son/vibration si autorisÃ© et heure enregistrÃ©e sur l'appareil.",
    noteSaved: "La note a Ã©tÃ© enregistrÃ©e localement sur l'appareil avec date et heure.",
    historyCleared: "L'historique local de cet Ã©cran a Ã©tÃ© supprimÃ© de l'appareil.",
  },

  de: {
    pageBadge: "Pantavion Senioren-Sicherheitsmodus",
    pageTitle: "Ein einfacher Schutzbildschirm.",
    pageIntro:
      "FÃ¼r Ã¤ltere Menschen, allein lebende Personen und Nutzer, die groÃŸe Tasten, klare Stimme, einfache Hilfe, Sprachauswahl und weniger Verwirrung brauchen.",
    languageLabel: "Sprache",
    languageHelp:
      "Die Auswahl wird mit dem globalen Pantavion-SchlÃ¼ssel gespeichert, damit sie zwischen SOS, Ãœbersetzung und AI-Freund nicht verloren geht.",
    emergencyBoundary:
      "Das rote SOS ist fÃ¼r unmittelbare Gefahr. Es verspricht keinen automatischen staatlichen Einsatz, Krankenwagen oder Satellitenrettung ohne zertifizierten Anbieter.",

    redKicker: "Rot = Unmittelbare Gefahr",
    sosButton: "SOS",
    redTitle: "Ein Tastendruck: starke GerÃ¤tewarnung und Zeitaufzeichnung.",
    redBody:
      "Notfallkontakte mÃ¼ssen vorher eingerichtet sein. FÃ¼r den vollstÃ¤ndigen Live-SOS-Ablauf Ã¶ffnen Sie die Haupt-SOS-Seite.",
    openLiveSos: "Live SOS Ã¶ffnen",
    emergencyCircle: "Notfallkreis",

    orangeKicker: "Orange = Hilfe / Ãœbersetzung",
    orangeTitle: "Sprechen und verstehen.",
    orangeBody:
      "FÃ¼r Zuhause, Krankenhaus, StraÃŸe, Taxi, BehÃ¶rde oder eine Person mit anderer Sprache. Es greift nicht auf den grÃ¼nen privaten Verlauf zu.",
    orangeButton: "Hilfe / Ãœbersetzung",

    greenKicker: "GrÃ¼n = AI-Freund / Tagebuch",
    greenTitle: "Sprechen oder schreiben Sie, was Sie beschÃ¤ftigt.",
    greenBody:
      "VollstÃ¤ndige natÃ¼rliche Sprach-AI kommt mit der PantaAI-Anbieterschicht. Vorerst speichern wir das richtige lokale Tagebuch mit Datum und Uhrzeit.",
    greenNoteLabel: "Schreiben Sie eine Notiz fÃ¼r sich oder die ausgewÃ¤hlte Familie:",
    greenPlaceholder:
      "Beispiel: Heute war mir schwindlig, ich fÃ¼hlte mich allein oder mÃ¶chte mit meiner Familie sprechen...",
    saveToPhone: "Auf Telefon speichern",
    aiVoiceNext: "AI-Freund: nÃ¤chste Stufe",
    aiBoundary:
      "Der AI-Freund ist kein Arzt, stellt keine Diagnose und ersetzt keine Notfallhilfe. Er hÃ¶rt zu, ordnet Sorgen und empfiehlt bei Bedarf menschliche oder medizinische Hilfe.",

    historyTitle: "Lokaler Verlauf",
    historyBody: "Auf diesem GerÃ¤t mit Datum, Uhrzeit und KontinuitÃ¤t gespeichert.",
    deleteHistory: "Verlauf lÃ¶schen",
    noHistory: "Auf diesem GerÃ¤t gibt es noch keinen lokalen Verlauf.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "Sprache",
    noteHistoryLabel: "Notiz",

    rulesTitle: "Schutz- und KontinuitÃ¤tsregeln",
    rules: [
      "Die Pflegeperson erhÃ¤lt keinen automatischen Zugriff auf den grÃ¼nen Verlauf.",
      "Die Familie sieht nur, was der Nutzer erlaubt oder was eine rechtmÃ¤ÃŸige Vormund-Regel erlaubt.",
      "Orange hilft bei Live-Kommunikation, nicht beim Lesen privater Dateien.",
      "Sprache, lokaler Verlauf und Notizen behalten KontinuitÃ¤t auf dem GerÃ¤t.",
      "Pantavion wird mit FlussgedÃ¤chtnis gebaut, nicht mit vergessenen getrennten Threads.",
    ],

    sosHistoryText:
      "Das rote SOS wurde im Senioren-Sicherheitsmodus gedrÃ¼ckt. Live SOS wurde zum Senden/Teilen Ã¼ber verfÃ¼gbare KanÃ¤le geÃ¶ffnet.",
    languageSavedPrefix: "Sprache gespeichert als",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "Die Sprache des Spezialbildschirms wurde geÃ¤ndert zu",
    localSosActivated:
      "Lokales SOS aktiviert: Ton/Vibration, wo erlaubt, und Zeit auf dem GerÃ¤t gespeichert.",
    noteSaved: "Die Notiz wurde lokal auf dem GerÃ¤t mit Datum und Uhrzeit gespeichert.",
    historyCleared: "Der lokale Verlauf dieses Bildschirms wurde vom GerÃ¤t gelÃ¶scht.",
  },

  es: {
    pageBadge: "Modo seguro para mayores Pantavion",
    pageTitle: "Una pantalla simple de protecciÃ³n.",
    pageIntro:
      "Para personas mayores, personas que viven solas y usuarios que necesitan botones grandes, voz clara, ayuda simple, elecciÃ³n de idioma y menos confusiÃ³n.",
    languageLabel: "Idioma",
    languageHelp:
      "La elecciÃ³n se guarda con la clave global de Pantavion para que no se pierda entre SOS, traducciÃ³n y amigo AI.",
    emergencyBoundary:
      "El SOS rojo es para peligro inmediato. No promete despacho oficial, ambulancia o rescate satelital sin proveedor certificado.",

    redKicker: "Rojo = Peligro inmediato",
    sosButton: "SOS",
    redTitle: "Un toque: alerta fuerte en el dispositivo y registro de hora.",
    redBody:
      "Los contactos de emergencia deben configurarse antes. Para el flujo Live SOS completo, abre la pÃ¡gina principal de SOS.",
    openLiveSos: "Abrir Live SOS",
    emergencyCircle: "CÃ­rculo de emergencia",

    orangeKicker: "Naranja = Ayuda / TraducciÃ³n",
    orangeTitle: "Habla y entiende.",
    orangeBody:
      "Para casa, hospital, calle, taxi, servicio pÃºblico o una persona que habla otro idioma. No accede al historial privado verde.",
    orangeButton: "Ayuda / TraducciÃ³n",

    greenKicker: "Verde = Amigo AI / Diario",
    greenTitle: "Habla o escribe lo que te preocupa.",
    greenBody:
      "La AI completa con voz natural llegarÃ¡ con la capa de proveedor PantaAI. Por ahora guardamos el diario local correcto con fecha y hora.",
    greenNoteLabel: "Escribe una nota para ti o para la familia que elegiste:",
    greenPlaceholder:
      "Ejemplo: hoy me sentÃ­ mareado, solo, o quiero hablar con mi familia...",
    saveToPhone: "Guardar en el telÃ©fono",
    aiVoiceNext: "Amigo AI: siguiente etapa",
    aiBoundary:
      "El Amigo AI no es mÃ©dico, no diagnostica y no reemplaza la ayuda de emergencia. EscucharÃ¡, organizarÃ¡ preocupaciones y sugerirÃ¡ ayuda humana o mÃ©dica cuando sea necesario.",

    historyTitle: "Historial local",
    historyBody: "Guardado en este dispositivo con fecha, hora y continuidad.",
    deleteHistory: "Eliminar historial",
    noHistory: "AÃºn no hay historial local en este dispositivo.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "Idioma",
    noteHistoryLabel: "Nota",

    rulesTitle: "Reglas de protecciÃ³n y continuidad",
    rules: [
      "El cuidador no obtiene acceso automÃ¡tico al historial verde.",
      "La familia ve solo lo que el usuario permite o lo que permite una regla legal de tutor.",
      "El naranja ayuda a la comunicaciÃ³n en vivo, no a leer archivos privados.",
      "El idioma, historial local y notas mantienen continuidad en el dispositivo.",
      "Pantavion se construirÃ¡ con memoria de flujo, no con hilos aislados olvidados.",
    ],

    sosHistoryText:
      "Se presionÃ³ el SOS rojo en el Modo seguro para mayores. Live SOS se abriÃ³ para enviar/compartir por canales disponibles.",
    languageSavedPrefix: "Idioma guardado como",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "El idioma de la pantalla especial cambiÃ³ a",
    localSosActivated:
      "SOS local activado: sonido/vibraciÃ³n donde se permita y hora registrada en el dispositivo.",
    noteSaved: "La nota se guardÃ³ localmente en el dispositivo con fecha y hora.",
    historyCleared: "El historial local de esta pantalla fue eliminado del dispositivo.",
  },

  it: {
    pageBadge: "ModalitÃ  sicura anziani Pantavion",
    pageTitle: "Una schermata semplice di protezione.",
    pageIntro:
      "Per anziani, persone che vivono sole e utenti che hanno bisogno di pulsanti grandi, voce chiara, aiuto semplice, scelta lingua e meno confusione.",
    languageLabel: "Lingua",
    languageHelp:
      "La scelta viene salvata con la chiave globale Pantavion cosÃ¬ non si perde tra SOS, traduzione e amico AI.",
    emergencyBoundary:
      "Il SOS rosso Ã¨ per pericolo immediato. Non promette invio ufficiale, ambulanza o soccorso satellitare senza provider certificato.",

    redKicker: "Rosso = Pericolo immediato",
    sosButton: "SOS",
    redTitle: "Un tocco: forte avviso sul dispositivo e registrazione dell'ora.",
    redBody:
      "I contatti di emergenza devono essere impostati prima. Per il flusso Live SOS completo, apri la pagina SOS principale.",
    openLiveSos: "Apri Live SOS",
    emergencyCircle: "Cerchia emergenza",

    orangeKicker: "Arancione = Aiuto / Traduzione",
    orangeTitle: "Parla e capisci.",
    orangeBody:
      "Per casa, ospedale, strada, taxi, servizio pubblico o una persona che parla un'altra lingua. Non accede alla cronologia privata verde.",
    orangeButton: "Aiuto / Traduzione",

    greenKicker: "Verde = Amico AI / Diario",
    greenTitle: "Parla o scrivi ciÃ² che ti preoccupa.",
    greenBody:
      "L'AI completa con voce naturale arriverÃ  con il layer provider PantaAI. Per ora manteniamo il diario locale corretto con data e ora.",
    greenNoteLabel: "Scrivi una nota per te o per la famiglia scelta:",
    greenPlaceholder:
      "Esempio: oggi mi sono sentito stordito, solo, o voglio parlare con la mia famiglia...",
    saveToPhone: "Salva sul telefono",
    aiVoiceNext: "Amico AI: fase successiva",
    aiBoundary:
      "L'Amico AI non Ã¨ un medico, non fa diagnosi e non sostituisce l'aiuto di emergenza. AscolterÃ , organizzerÃ  le preoccupazioni e suggerirÃ  aiuto umano o medico quando serve.",

    historyTitle: "Cronologia locale",
    historyBody: "Salvata su questo dispositivo con data, ora e continuitÃ .",
    deleteHistory: "Elimina cronologia",
    noHistory: "Non c'Ã¨ ancora cronologia locale su questo dispositivo.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "Lingua",
    noteHistoryLabel: "Nota",

    rulesTitle: "Regole di protezione e continuitÃ ",
    rules: [
      "Il caregiver non ottiene accesso automatico alla cronologia verde.",
      "La famiglia vede solo ciÃ² che l'utente consente o ciÃ² che permette una regola legale di tutore.",
      "L'arancione aiuta la comunicazione live, non la lettura di file privati.",
      "Lingua, cronologia locale e note mantengono continuitÃ  sul dispositivo.",
      "Pantavion sarÃ  costruito con memoria di flusso, non con thread isolati dimenticati.",
    ],

    sosHistoryText:
      "Il SOS rosso Ã¨ stato premuto in ModalitÃ  sicura anziani. Live SOS Ã¨ stato aperto per inviare/condividere tramite canali disponibili.",
    languageSavedPrefix: "Lingua salvata come",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "La lingua della schermata speciale Ã¨ cambiata in",
    localSosActivated:
      "SOS locale attivato: suono/vibrazione dove consentito e ora registrata sul dispositivo.",
    noteSaved: "La nota Ã¨ stata salvata localmente sul dispositivo con data e ora.",
    historyCleared: "La cronologia locale di questa schermata Ã¨ stata eliminata dal dispositivo.",
  },

  ro: {
    pageBadge: "Mod sigur pentru vÃ¢rstnici Pantavion",
    pageTitle: "Un ecran simplu de protecÈ›ie.",
    pageIntro:
      "Pentru vÃ¢rstnici, persoane care locuiesc singure È™i utilizatori care au nevoie de butoane mari, voce clarÄƒ, ajutor simplu, alegerea limbii È™i mai puÈ›inÄƒ confuzie.",
    languageLabel: "LimbÄƒ",
    languageHelp:
      "Alegerea este salvatÄƒ cu cheia globalÄƒ Pantavion, ca sÄƒ nu se piardÄƒ Ã®ntre SOS, traducere È™i prietenul AI.",
    emergencyBoundary:
      "SOS-ul roÈ™u este pentru pericol imediat. Nu promite intervenÈ›ie oficialÄƒ, ambulanÈ›Äƒ sau salvare prin satelit fÄƒrÄƒ furnizor certificat.",

    redKicker: "RoÈ™u = Pericol imediat",
    sosButton: "SOS",
    redTitle: "O apÄƒsare: alertÄƒ puternicÄƒ pe dispozitiv È™i Ã®nregistrarea orei.",
    redBody:
      "Contactele de urgenÈ›Äƒ trebuie setate dinainte. Pentru fluxul complet Live SOS, deschide pagina principalÄƒ SOS.",
    openLiveSos: "Deschide Live SOS",
    emergencyCircle: "Cercul de urgenÈ›Äƒ",

    orangeKicker: "Portocaliu = Ajutor / Traducere",
    orangeTitle: "VorbeÈ™te È™i Ã®nÈ›elege.",
    orangeBody:
      "Pentru casÄƒ, spital, stradÄƒ, taxi, serviciu public sau o persoanÄƒ care vorbeÈ™te altÄƒ limbÄƒ. Nu acceseazÄƒ istoricul privat verde.",
    orangeButton: "Ajutor / Traducere",

    greenKicker: "Verde = Prieten AI / Jurnal",
    greenTitle: "VorbeÈ™te sau scrie ce te preocupÄƒ.",
    greenBody:
      "AI complet cu voce naturalÄƒ va veni cu layerul de provider PantaAI. DeocamdatÄƒ pÄƒstrÄƒm jurnalul local corect cu datÄƒ È™i orÄƒ.",
    greenNoteLabel: "Scrie o notÄƒ pentru tine sau familia pe care ai ales-o:",
    greenPlaceholder:
      "Exemplu: astÄƒzi m-am simÈ›it ameÈ›it, singur sau vreau sÄƒ vorbesc cu familia mea...",
    saveToPhone: "SalveazÄƒ pe telefon",
    aiVoiceNext: "Prieten AI: etapa urmÄƒtoare",
    aiBoundary:
      "Prietenul AI nu este medic, nu pune diagnostic È™i nu Ã®nlocuieÈ™te ajutorul de urgenÈ›Äƒ. Va asculta, va organiza Ã®ngrijorÄƒrile È™i va sugera ajutor uman sau medical cÃ¢nd este nevoie.",

    historyTitle: "Istoric local",
    historyBody: "Salvat pe acest dispozitiv cu datÄƒ, orÄƒ È™i continuitate.",
    deleteHistory: "È˜terge istoricul",
    noHistory: "Nu existÄƒ Ã®ncÄƒ istoric local pe acest dispozitiv.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "LimbÄƒ",
    noteHistoryLabel: "NotÄƒ",

    rulesTitle: "Reguli de protecÈ›ie È™i continuitate",
    rules: [
      "ÃŽngrijitorul nu primeÈ™te acces automat la istoricul verde.",
      "Familia vede doar ce permite utilizatorul sau ce permite o regulÄƒ legalÄƒ de tutore.",
      "Portocaliul ajutÄƒ comunicarea live, nu citirea fiÈ™ierelor private.",
      "Limba, istoricul local È™i notele pÄƒstreazÄƒ continuitatea pe dispozitiv.",
      "Pantavion va fi construit cu memorie de flux, nu cu fire izolate uitate.",
    ],

    sosHistoryText:
      "SOS-ul roÈ™u a fost apÄƒsat Ã®n Modul sigur pentru vÃ¢rstnici. Live SOS a fost deschis pentru trimitere/distribuire prin canale disponibile.",
    languageSavedPrefix: "Limba salvatÄƒ ca",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "Limba ecranului special a fost schimbatÄƒ Ã®n",
    localSosActivated:
      "SOS local activat: sunet/vibraÈ›ie unde este permis È™i ora Ã®nregistratÄƒ pe dispozitiv.",
    noteSaved: "Nota a fost salvatÄƒ local pe dispozitiv cu datÄƒ È™i orÄƒ.",
    historyCleared: "Istoricul local al acestui ecran a fost È™ters de pe dispozitiv.",
  },

  ru: {
    pageBadge: "Ð‘ÐµÐ·Ð¾Ð¿Ð°ÑÐ½Ñ‹Ð¹ Ñ€ÐµÐ¶Ð¸Ð¼ Ð´Ð»Ñ Ð¿Ð¾Ð¶Ð¸Ð»Ñ‹Ñ… Pantavion",
    pageTitle: "ÐŸÑ€Ð¾ÑÑ‚Ð¾Ð¹ ÑÐºÑ€Ð°Ð½ Ð·Ð°Ñ‰Ð¸Ñ‚Ñ‹.",
    pageIntro:
      "Ð”Ð»Ñ Ð¿Ð¾Ð¶Ð¸Ð»Ñ‹Ñ… Ð»ÑŽÐ´ÐµÐ¹, Ð»ÑŽÐ´ÐµÐ¹, Ð¶Ð¸Ð²ÑƒÑ‰Ð¸Ñ… Ð¾Ð´Ð½Ð¸Ñ…, Ð¸ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÐµÐ¹, ÐºÐ¾Ñ‚Ð¾Ñ€Ñ‹Ð¼ Ð½ÑƒÐ¶Ð½Ñ‹ Ð±Ð¾Ð»ÑŒÑˆÐ¸Ðµ ÐºÐ½Ð¾Ð¿ÐºÐ¸, Ð¿Ð¾Ð½ÑÑ‚Ð½Ð°Ñ Ð³Ð¾Ð»Ð¾ÑÐ¾Ð²Ð°Ñ Ð¿Ð¾Ð¼Ð¾Ñ‰ÑŒ, Ð¿Ñ€Ð¾ÑÑ‚Ð¾Ð¹ Ð¸Ð½Ñ‚ÐµÑ€Ñ„ÐµÐ¹Ñ, Ð²Ñ‹Ð±Ð¾Ñ€ ÑÐ·Ñ‹ÐºÐ° Ð¸ Ð¼ÐµÐ½ÑŒÑˆÐµ Ð¿ÑƒÑ‚Ð°Ð½Ð¸Ñ†Ñ‹.",
    languageLabel: "Ð¯Ð·Ñ‹Ðº",
    languageHelp:
      "Ð’Ñ‹Ð±Ð¾Ñ€ ÑÐ¾Ñ…Ñ€Ð°Ð½ÑÐµÑ‚ÑÑ Ð³Ð»Ð¾Ð±Ð°Ð»ÑŒÐ½Ñ‹Ð¼ ÐºÐ»ÑŽÑ‡Ð¾Ð¼ Pantavion, Ñ‡Ñ‚Ð¾Ð±Ñ‹ Ð¾Ð½ Ð½Ðµ Ñ‚ÐµÑ€ÑÐ»ÑÑ Ð¼ÐµÐ¶Ð´Ñƒ SOS, Ð¿ÐµÑ€ÐµÐ²Ð¾Ð´Ð¾Ð¼ Ð¸ AI-Ð´Ñ€ÑƒÐ³Ð¾Ð¼.",
    emergencyBoundary:
      "ÐšÑ€Ð°ÑÐ½Ñ‹Ð¹ SOS Ð¿Ñ€ÐµÐ´Ð½Ð°Ð·Ð½Ð°Ñ‡ÐµÐ½ Ð´Ð»Ñ Ð½ÐµÐ¿Ð¾ÑÑ€ÐµÐ´ÑÑ‚Ð²ÐµÐ½Ð½Ð¾Ð¹ Ð¾Ð¿Ð°ÑÐ½Ð¾ÑÑ‚Ð¸. ÐžÐ½ Ð½Ðµ Ð¾Ð±ÐµÑ‰Ð°ÐµÑ‚ Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÑƒÑŽ Ð¾Ñ„Ð¸Ñ†Ð¸Ð°Ð»ÑŒÐ½ÑƒÑŽ Ð¾Ñ‚Ð¿Ñ€Ð°Ð²ÐºÑƒ ÑÐ»ÑƒÐ¶Ð±, ÑÐºÐ¾Ñ€ÑƒÑŽ Ð¿Ð¾Ð¼Ð¾Ñ‰ÑŒ Ð¸Ð»Ð¸ ÑÐ¿ÑƒÑ‚Ð½Ð¸ÐºÐ¾Ð²Ð¾Ðµ ÑÐ¿Ð°ÑÐµÐ½Ð¸Ðµ Ð±ÐµÐ· ÑÐµÑ€Ñ‚Ð¸Ñ„Ð¸Ñ†Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ð¾Ð³Ð¾ Ð¿Ñ€Ð¾Ð²Ð°Ð¹Ð´ÐµÑ€Ð°.",

    redKicker: "ÐšÑ€Ð°ÑÐ½Ñ‹Ð¹ = ÐÐµÐ¼ÐµÐ´Ð»ÐµÐ½Ð½Ð°Ñ Ð¾Ð¿Ð°ÑÐ½Ð¾ÑÑ‚ÑŒ",
    sosButton: "SOS",
    redTitle: "ÐžÐ´Ð½Ð¾ Ð½Ð°Ð¶Ð°Ñ‚Ð¸Ðµ: ÑÐ¸Ð»ÑŒÐ½Ð¾Ðµ Ð¾Ð¿Ð¾Ð²ÐµÑ‰ÐµÐ½Ð¸Ðµ Ð½Ð° ÑƒÑÑ‚Ñ€Ð¾Ð¹ÑÑ‚Ð²Ðµ Ð¸ Ð·Ð°Ð¿Ð¸ÑÑŒ Ð²Ñ€ÐµÐ¼ÐµÐ½Ð¸.",
    redBody:
      "Ð­ÐºÑÑ‚Ñ€ÐµÐ½Ð½Ñ‹Ðµ ÐºÐ¾Ð½Ñ‚Ð°ÐºÑ‚Ñ‹ Ð´Ð¾Ð»Ð¶Ð½Ñ‹ Ð±Ñ‹Ñ‚ÑŒ ÑƒÐºÐ°Ð·Ð°Ð½Ñ‹ Ð·Ð°Ñ€Ð°Ð½ÐµÐµ. Ð”Ð»Ñ Ð¿Ð¾Ð»Ð½Ð¾Ð³Ð¾ Ð¿Ð¾Ñ‚Ð¾ÐºÐ° Live SOS Ð¾Ñ‚ÐºÑ€Ð¾Ð¹Ñ‚Ðµ Ð¾ÑÐ½Ð¾Ð²Ð½ÑƒÑŽ ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ñƒ SOS.",
    openLiveSos: "ÐžÑ‚ÐºÑ€Ñ‹Ñ‚ÑŒ Live SOS",
    emergencyCircle: "Ð­ÐºÑÑ‚Ñ€ÐµÐ½Ð½Ñ‹Ð¹ ÐºÑ€ÑƒÐ³",

    orangeKicker: "ÐžÑ€Ð°Ð½Ð¶ÐµÐ²Ñ‹Ð¹ = ÐŸÐ¾Ð¼Ð¾Ñ‰ÑŒ / ÐŸÐµÑ€ÐµÐ²Ð¾Ð´",
    orangeTitle: "Ð“Ð¾Ð²Ð¾Ñ€Ð¸Ñ‚Ðµ Ð¸ Ð¿Ð¾Ð½Ð¸Ð¼Ð°Ð¹Ñ‚Ðµ.",
    orangeBody:
      "Ð”Ð»Ñ Ð´Ð¾Ð¼Ð°, Ð±Ð¾Ð»ÑŒÐ½Ð¸Ñ†Ñ‹, ÑƒÐ»Ð¸Ñ†Ñ‹, Ñ‚Ð°ÐºÑÐ¸, Ð³Ð¾ÑÑÐ»ÑƒÐ¶Ð±Ñ‹ Ð¸Ð»Ð¸ Ñ‡ÐµÐ»Ð¾Ð²ÐµÐºÐ°, Ð³Ð¾Ð²Ð¾Ñ€ÑÑ‰ÐµÐ³Ð¾ Ð½Ð° Ð´Ñ€ÑƒÐ³Ð¾Ð¼ ÑÐ·Ñ‹ÐºÐµ. ÐÐµ Ð¸Ð¼ÐµÐµÑ‚ Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð° Ðº Ð·ÐµÐ»ÐµÐ½Ð¾Ð¹ Ð¿Ñ€Ð¸Ð²Ð°Ñ‚Ð½Ð¾Ð¹ Ð¸ÑÑ‚Ð¾Ñ€Ð¸Ð¸.",
    orangeButton: "ÐŸÐ¾Ð¼Ð¾Ñ‰ÑŒ / ÐŸÐµÑ€ÐµÐ²Ð¾Ð´",

    greenKicker: "Ð—ÐµÐ»ÐµÐ½Ñ‹Ð¹ = AI-Ð´Ñ€ÑƒÐ³ / Ð–ÑƒÑ€Ð½Ð°Ð»",
    greenTitle: "Ð“Ð¾Ð²Ð¾Ñ€Ð¸Ñ‚Ðµ Ð¸Ð»Ð¸ Ð¿Ð¸ÑˆÐ¸Ñ‚Ðµ Ð¾ Ñ‚Ð¾Ð¼, Ñ‡Ñ‚Ð¾ Ð²Ð°Ñ Ð±ÐµÑÐ¿Ð¾ÐºÐ¾Ð¸Ñ‚.",
    greenBody:
      "ÐŸÐ¾Ð»Ð½Ñ‹Ð¹ AI Ñ ÐµÑÑ‚ÐµÑÑ‚Ð²ÐµÐ½Ð½Ñ‹Ð¼ Ð³Ð¾Ð»Ð¾ÑÐ¾Ð¼ Ð¿Ð¾ÑÐ²Ð¸Ñ‚ÑÑ Ñ PantaAI provider layer. ÐŸÐ¾ÐºÐ° Ð¼Ñ‹ Ð²ÐµÐ´ÐµÐ¼ Ð¿Ñ€Ð°Ð²Ð¸Ð»ÑŒÐ½Ñ‹Ð¹ Ð»Ð¾ÐºÐ°Ð»ÑŒÐ½Ñ‹Ð¹ Ð¶ÑƒÑ€Ð½Ð°Ð» Ñ Ð´Ð°Ñ‚Ð¾Ð¹ Ð¸ Ð²Ñ€ÐµÐ¼ÐµÐ½ÐµÐ¼.",
    greenNoteLabel: "ÐÐ°Ð¿Ð¸ÑˆÐ¸Ñ‚Ðµ Ð·Ð°Ð¼ÐµÑ‚ÐºÑƒ Ð´Ð»Ñ ÑÐµÐ±Ñ Ð¸Ð»Ð¸ Ð²Ñ‹Ð±Ñ€Ð°Ð½Ð½Ð¾Ð¹ ÑÐµÐ¼ÑŒÐ¸:",
    greenPlaceholder:
      "ÐÐ°Ð¿Ñ€Ð¸Ð¼ÐµÑ€: ÑÐµÐ³Ð¾Ð´Ð½Ñ Ñƒ Ð¼ÐµÐ½Ñ ÐºÑ€ÑƒÐ¶Ð¸Ð»Ð°ÑÑŒ Ð³Ð¾Ð»Ð¾Ð²Ð°, Ñ Ñ‡ÑƒÐ²ÑÑ‚Ð²Ð¾Ð²Ð°Ð» ÑÐµÐ±Ñ Ð¾Ð´Ð¸Ð½Ð¾ÐºÐ¾ Ð¸Ð»Ð¸ Ñ…Ð¾Ñ‡Ñƒ Ð¿Ð¾Ð³Ð¾Ð²Ð¾Ñ€Ð¸Ñ‚ÑŒ Ñ ÑÐµÐ¼ÑŒÐµÐ¹...",
    saveToPhone: "Ð¡Ð¾Ñ…Ñ€Ð°Ð½Ð¸Ñ‚ÑŒ Ð½Ð° Ñ‚ÐµÐ»ÐµÑ„Ð¾Ð½",
    aiVoiceNext: "AI-Ð´Ñ€ÑƒÐ³: ÑÐ»ÐµÐ´ÑƒÑŽÑ‰Ð¸Ð¹ ÑÑ‚Ð°Ð¿",
    aiBoundary:
      "AI-Ð´Ñ€ÑƒÐ³ Ð½Ðµ ÑÐ²Ð»ÑÐµÑ‚ÑÑ Ð²Ñ€Ð°Ñ‡Ð¾Ð¼, Ð½Ðµ ÑÑ‚Ð°Ð²Ð¸Ñ‚ Ð´Ð¸Ð°Ð³Ð½Ð¾Ð· Ð¸ Ð½Ðµ Ð·Ð°Ð¼ÐµÐ½ÑÐµÑ‚ ÑÐºÑÑ‚Ñ€ÐµÐ½Ð½ÑƒÑŽ Ð¿Ð¾Ð¼Ð¾Ñ‰ÑŒ. ÐžÐ½ Ð±ÑƒÐ´ÐµÑ‚ ÑÐ»ÑƒÑˆÐ°Ñ‚ÑŒ, ÑƒÐ¿Ð¾Ñ€ÑÐ´Ð¾Ñ‡Ð¸Ð²Ð°Ñ‚ÑŒ Ñ‚Ñ€ÐµÐ²Ð¾Ð³Ð¸ Ð¸ Ð¿Ñ€ÐµÐ´Ð»Ð°Ð³Ð°Ñ‚ÑŒ Ñ‡ÐµÐ»Ð¾Ð²ÐµÑ‡ÐµÑÐºÑƒÑŽ Ð¸Ð»Ð¸ Ð¼ÐµÐ´Ð¸Ñ†Ð¸Ð½ÑÐºÑƒÑŽ Ð¿Ð¾Ð¼Ð¾Ñ‰ÑŒ Ð¿Ñ€Ð¸ Ð½ÐµÐ¾Ð±Ñ…Ð¾Ð´Ð¸Ð¼Ð¾ÑÑ‚Ð¸.",

    historyTitle: "Ð›Ð¾ÐºÐ°Ð»ÑŒÐ½Ð°Ñ Ð¸ÑÑ‚Ð¾Ñ€Ð¸Ñ",
    historyBody: "Ð¡Ð¾Ñ…Ñ€Ð°Ð½ÑÐµÑ‚ÑÑ Ð½Ð° ÑÑ‚Ð¾Ð¼ ÑƒÑÑ‚Ñ€Ð¾Ð¹ÑÑ‚Ð²Ðµ Ñ Ð´Ð°Ñ‚Ð¾Ð¹, Ð²Ñ€ÐµÐ¼ÐµÐ½ÐµÐ¼ Ð¸ Ð½ÐµÐ¿Ñ€ÐµÑ€Ñ‹Ð²Ð½Ð¾ÑÑ‚ÑŒÑŽ.",
    deleteHistory: "Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ Ð¸ÑÑ‚Ð¾Ñ€Ð¸ÑŽ",
    noHistory: "ÐÐ° ÑÑ‚Ð¾Ð¼ ÑƒÑÑ‚Ñ€Ð¾Ð¹ÑÑ‚Ð²Ðµ Ð¿Ð¾ÐºÐ° Ð½ÐµÑ‚ Ð»Ð¾ÐºÐ°Ð»ÑŒÐ½Ð¾Ð¹ Ð¸ÑÑ‚Ð¾Ñ€Ð¸Ð¸.",
    sosHistoryLabel: "SOS",
    languageHistoryLabel: "Ð¯Ð·Ñ‹Ðº",
    noteHistoryLabel: "Ð—Ð°Ð¼ÐµÑ‚ÐºÐ°",

    rulesTitle: "ÐŸÑ€Ð°Ð²Ð¸Ð»Ð° Ð·Ð°Ñ‰Ð¸Ñ‚Ñ‹ Ð¸ Ð½ÐµÐ¿Ñ€ÐµÑ€Ñ‹Ð²Ð½Ð¾ÑÑ‚Ð¸",
    rules: [
      "ÐžÐ¿ÐµÐºÑƒÐ½/ÑÐ¸Ð´ÐµÐ»ÐºÐ° Ð½Ðµ Ð¿Ð¾Ð»ÑƒÑ‡Ð°ÐµÑ‚ Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ Ð´Ð¾ÑÑ‚ÑƒÐ¿ Ðº Ð·ÐµÐ»ÐµÐ½Ð¾Ð¹ Ð¸ÑÑ‚Ð¾Ñ€Ð¸Ð¸.",
      "Ð¡ÐµÐ¼ÑŒÑ Ð²Ð¸Ð´Ð¸Ñ‚ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ñ‚Ð¾, Ñ‡Ñ‚Ð¾ Ñ€Ð°Ð·Ñ€ÐµÑˆÐ¸Ð» Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð¸Ð»Ð¸ Ð·Ð°ÐºÐ¾Ð½Ð½Ð¾Ðµ Ð¿Ñ€Ð°Ð²Ð¸Ð»Ð¾ Ð¾Ð¿ÐµÐºÑƒÐ½Ð°.",
      "ÐžÑ€Ð°Ð½Ð¶ÐµÐ²Ñ‹Ð¹ Ð¿Ð¾Ð¼Ð¾Ð³Ð°ÐµÑ‚ Ð¶Ð¸Ð²Ð¾Ð¼Ñƒ Ð¾Ð±Ñ‰ÐµÐ½Ð¸ÑŽ, Ð° Ð½Ðµ Ñ‡Ñ‚ÐµÐ½Ð¸ÑŽ Ð»Ð¸Ñ‡Ð½Ñ‹Ñ… Ñ„Ð°Ð¹Ð»Ð¾Ð².",
      "Ð¯Ð·Ñ‹Ðº, Ð»Ð¾ÐºÐ°Ð»ÑŒÐ½Ð°Ñ Ð¸ÑÑ‚Ð¾Ñ€Ð¸Ñ Ð¸ Ð·Ð°Ð¼ÐµÑ‚ÐºÐ¸ ÑÐ¾Ñ…Ñ€Ð°Ð½ÑÑŽÑ‚ Ð½ÐµÐ¿Ñ€ÐµÑ€Ñ‹Ð²Ð½Ð¾ÑÑ‚ÑŒ Ð½Ð° ÑƒÑÑ‚Ñ€Ð¾Ð¹ÑÑ‚Ð²Ðµ.",
      "Pantavion Ð±ÑƒÐ´ÐµÑ‚ ÑÑ‚Ñ€Ð¾Ð¸Ñ‚ÑŒÑÑ Ñ Ð¿Ð°Ð¼ÑÑ‚ÑŒÑŽ Ð¿Ð¾Ñ‚Ð¾ÐºÐ°, Ð° Ð½Ðµ Ñ Ð·Ð°Ð±Ñ‹Ñ‚Ñ‹Ð¼Ð¸ Ð¾Ñ‚Ð´ÐµÐ»ÑŒÐ½Ñ‹Ð¼Ð¸ Ð²ÐµÑ‚ÐºÐ°Ð¼Ð¸.",
    ],

    sosHistoryText:
      "ÐšÑ€Ð°ÑÐ½Ð°Ñ ÐºÐ½Ð¾Ð¿ÐºÐ° SOS Ð±Ñ‹Ð»Ð° Ð½Ð°Ð¶Ð°Ñ‚Ð° Ð² Ð±ÐµÐ·Ð¾Ð¿Ð°ÑÐ½Ð¾Ð¼ Ñ€ÐµÐ¶Ð¸Ð¼Ðµ Ð´Ð»Ñ Ð¿Ð¾Ð¶Ð¸Ð»Ñ‹Ñ…. Live SOS Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚ Ð´Ð»Ñ Ð¾Ñ‚Ð¿Ñ€Ð°Ð²ÐºÐ¸/Ð¿ÐµÑ€ÐµÐ´Ð°Ñ‡Ð¸ Ñ‡ÐµÑ€ÐµÐ· Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ñ‹Ðµ ÐºÐ°Ð½Ð°Ð»Ñ‹.",
    languageSavedPrefix: "Ð¯Ð·Ñ‹Ðº ÑÐ¾Ñ…Ñ€Ð°Ð½ÐµÐ½ ÐºÐ°Ðº",
    languageSavedSuffix: ".",
    languageHistoryPrefix: "Ð¯Ð·Ñ‹Ðº ÑÐ¿ÐµÑ†Ð¸Ð°Ð»ÑŒÐ½Ð¾Ð³Ð¾ ÑÐºÑ€Ð°Ð½Ð° Ð¸Ð·Ð¼ÐµÐ½ÐµÐ½ Ð½Ð°",
    localSosActivated:
      "Ð›Ð¾ÐºÐ°Ð»ÑŒÐ½Ñ‹Ð¹ SOS Ð°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð¾Ð²Ð°Ð½: Ð·Ð²ÑƒÐº/Ð²Ð¸Ð±Ñ€Ð°Ñ†Ð¸Ñ, Ð³Ð´Ðµ Ñ€Ð°Ð·Ñ€ÐµÑˆÐµÐ½Ð¾, Ð¸ Ð·Ð°Ð¿Ð¸ÑÑŒ Ð²Ñ€ÐµÐ¼ÐµÐ½Ð¸ Ð½Ð° ÑƒÑÑ‚Ñ€Ð¾Ð¹ÑÑ‚Ð²Ðµ.",
    noteSaved: "Ð—Ð°Ð¼ÐµÑ‚ÐºÐ° ÑÐ¾Ñ…Ñ€Ð°Ð½ÐµÐ½Ð° Ð»Ð¾ÐºÐ°Ð»ÑŒÐ½Ð¾ Ð½Ð° ÑƒÑÑ‚Ñ€Ð¾Ð¹ÑÑ‚Ð²Ðµ Ñ Ð´Ð°Ñ‚Ð¾Ð¹ Ð¸ Ð²Ñ€ÐµÐ¼ÐµÐ½ÐµÐ¼.",
    historyCleared: "Ð›Ð¾ÐºÐ°Ð»ÑŒÐ½Ð°Ñ Ð¸ÑÑ‚Ð¾Ñ€Ð¸Ñ ÑÑ‚Ð¾Ð³Ð¾ ÑÐºÑ€Ð°Ð½Ð° ÑƒÐ´Ð°Ð»ÐµÐ½Ð° Ñ ÑƒÑÑ‚Ñ€Ð¾Ð¹ÑÑ‚Ð²Ð°.",
  },
};

function formatDateTime(value: string, languageCode: ElderLanguageCode) {
  return new Date(value).toLocaleString(languageCode, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function readHistory(): ElderHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(historyKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: ElderHistoryItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(historyKey, JSON.stringify(items.slice(0, 12)));
}

function isSupportedLanguage(code: string): code is ElderLanguageCode {
  return languageOptions.some((language) => language.code === code);
}

function readLanguageCode(): ElderLanguageCode {
  if (typeof window === "undefined") return "el";

  const saved = window.localStorage.getItem(globalLanguageKey);
  if (saved && isSupportedLanguage(saved)) {
    return saved;
  }

  const browserLanguage = window.navigator.language?.slice(0, 2).toLowerCase();
  if (browserLanguage && isSupportedLanguage(browserLanguage)) {
    return browserLanguage;
  }

  return "el";
}

function readHelperLanguageCode(): ElderLanguageCode {
  if (typeof window === "undefined") return "en";

  const saved = window.localStorage.getItem(helperLanguageKey);
  if (saved && isSupportedLanguage(saved)) {
    return saved;
  }

  return "en";
}

function readTranslationMode(): ElderTranslationMode {
  if (typeof window === "undefined") return "auto";

  const saved = window.localStorage.getItem(translationModeKey);
  return saved === "manual" ? "manual" : "auto";
}

function createSiren() {
  if (typeof window === "undefined") return;

  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(720, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      1180,
      audioContext.currentTime + 0.35
    );
    oscillator.frequency.exponentialRampToValueAtTime(
      720,
      audioContext.currentTime + 0.7
    );

    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, audioContext.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.8);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1.85);
  } catch {
    // Browser/audio permission may block sound. The visual state still updates.
  }
}

export default function ElderSafeModePage() {
  const [history, setHistory] = useState<ElderHistoryItem[]>([]);
  const [note, setNote] = useState("");
  const [lastAction, setLastAction] = useState("");
  const [languageCode, setLanguageCode] = useState<ElderLanguageCode>("el");
  const [helperLanguageCode, setHelperLanguageCode] =
    useState<ElderLanguageCode>("en");
  const [translationMode, setTranslationMode] =
    useState<ElderTranslationMode>("auto");
  const [helperLanguageCode, setHelperLanguageCode] =
    useState<ElderLanguageCode>("en");

  const selectedLanguage = useMemo(
    () =>
      languageOptions.find((language) => language.code === languageCode) ??
      languageOptions[0],
    [languageCode]
  );

  const selectedHelperLanguage = useMemo(
    () =>
      languageOptions.find((language) => language.code === helperLanguageCode) ??
      languageOptions[1],
    [helperLanguageCode]
  );

  const t = elderTranslations[languageCode];

  useEffect(() => {
    setHistory(readHistory());
    setLanguageCode(readLanguageCode());
    setHelperLanguageCode(readHelperLanguageCode());
    setTranslationMode(readTranslationMode());
    setHelperLanguageCode(readHelperLanguageCode());
  }, []);

  function addHistoryItem(item: ElderHistoryItem) {
    const next = [item, ...history].slice(0, 12);
    setHistory(next);
    saveHistory(next);
  }

  function changeLanguage(nextCode: string) {
    const nextLanguage = isSupportedLanguage(nextCode) ? nextCode : "el";
    const nextLanguageMeta =
      languageOptions.find((language) => language.code === nextLanguage) ??
      languageOptions[0];
    const nextTranslation = elderTranslations[nextLanguage];

    setLanguageCode(nextLanguage);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(globalLanguageKey, nextLanguage);
    }

    addHistoryItem({
      id: `language-${Date.now()}`,
      mode: "language",
      text: `${nextTranslation.languageHistoryPrefix} ${nextLanguageMeta.nativeLabel}.`,
      createdAt: new Date().toISOString(),
    });

    setLastAction(
      `${nextTranslation.languageSavedPrefix} ${nextLanguageMeta.nativeLabel}${nextTranslation.languageSavedSuffix}`
    );
  }

  function changeHelperLanguage(nextCode: string) {
    const nextLanguage = isSupportedLanguage(nextCode) ? nextCode : "en";
    const nextLanguageMeta =
      languageOptions.find((language) => language.code === nextLanguage) ??
      languageOptions[1];

    setHelperLanguageCode(nextLanguage);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(helperLanguageKey, nextLanguage);
    }

    addHistoryItem({
      id: `helper-language-${Date.now()}`,
      mode: "language",
      text: `Î— Î³Î»ÏŽÏƒÏƒÎ± ÏƒÏ…Î½Î¿Î¼Î¹Î»Î·Ï„Î® / Î¿Î¹ÎºÎ¹Î±ÎºÎ®Ï‚ Î²Î¿Î·Î¸Î¿Ï Î¬Î»Î»Î±Î¾Îµ ÏƒÎµ ${nextLanguageMeta.nativeLabel}.`,
      createdAt: new Date().toISOString(),
    });

    setLastAction(
      `Î— Î´ÎµÏÏ„ÎµÏÎ· Î³Î»ÏŽÏƒÏƒÎ± Î±Ï€Î¿Î¸Î·ÎºÎµÏÏ„Î·ÎºÎµ Ï‰Ï‚ ${nextLanguageMeta.nativeLabel}.`
    );
  }

  function changeTranslationMode(nextMode: ElderTranslationMode) {
    setTranslationMode(nextMode);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(translationModeKey, nextMode);
    }

    setLastAction(
      nextMode === "auto"
        ? "Î— Ï€Î¿ÏÏ„Î¿ÎºÎ±Î»Î¯ Î¼ÎµÏ„Î¬Ï†ÏÎ±ÏƒÎ· Î¸Î± Î±Î½Î¿Î¯Î³ÎµÎ¹ Î¼Îµ Î±Ï…Ï„ÏŒÎ¼Î±Ï„Î· Î±Î½Î±Î³Î½ÏŽÏÎ¹ÏƒÎ· Î¿Î¼Î¹Î»Î¯Î±Ï‚."
        : "Î— Ï€Î¿ÏÏ„Î¿ÎºÎ±Î»Î¯ Î¼ÎµÏ„Î¬Ï†ÏÎ±ÏƒÎ· Î¸Î± Ï‡ÏÎ·ÏƒÎ¹Î¼Î¿Ï€Î¿Î¹ÎµÎ¯ Ï‡ÎµÎ¹ÏÎ¿ÎºÎ¯Î½Î·Ï„Î· Î´ÎµÏÏ„ÎµÏÎ· Î³Î»ÏŽÏƒÏƒÎ±."
    );
  }

  function changeHelperLanguage(nextCode: string) {
    const nextLanguage = isSupportedLanguage(nextCode) ? nextCode : "en";
    const nextLanguageMeta =
      languageOptions.find((language) => language.code === nextLanguage) ??
      languageOptions[1];

    setHelperLanguageCode(nextLanguage);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(helperLanguageKey, nextLanguage);
    }

    addHistoryItem({
      id: `helper-language-${Date.now()}`,
      mode: "language",
      text: `Helper/counterparty language changed to ${nextLanguageMeta.nativeLabel}.`,
      createdAt: new Date().toISOString(),
    });

    setLastAction(`Î— Î´ÎµÏÏ„ÎµÏÎ· Î³Î»ÏŽÏƒÏƒÎ± Î±Ï€Î¿Î¸Î·ÎºÎµÏÏ„Î·ÎºÎµ Ï‰Ï‚ ${nextLanguageMeta.nativeLabel}.`);
  }

  function activateLocalSos() {
    if ("vibrate" in navigator) {
      navigator.vibrate?.([700, 200, 700]);
    }

    createSiren();

    addHistoryItem({
      id: `sos-${Date.now()}`,
      mode: "sos",
      text: t.sosHistoryText,
      createdAt: new Date().toISOString(),
    });

    setLastAction(t.localSosActivated);
  }

  function saveAiNote() {
    const clean = note.trim();
    if (!clean) return;

    addHistoryItem({
      id: `note-${Date.now()}`,
      mode: "ai-note",
      text: clean,
      createdAt: new Date().toISOString(),
    });

    setNote("");
    setLastAction(t.noteSaved);
  }

  function clearLocalHistory() {
    setHistory([]);
    saveHistory([]);
    setLastAction(t.historyCleared);
  }

  return (
    <main
      className="min-h-screen bg-[#06111f] px-4 py-6 text-white"
      dir={selectedLanguage.direction}
      lang={selectedLanguage.code}
    >
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <div className="rounded-[2rem] border border-white/15 bg-[#091a31] p-5 shadow-2xl">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.35em] text-yellow-300">
            {t.pageBadge}
          </p>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">
            {t.pageTitle}
          </h1>
          <p className="mt-4 text-lg leading-8 text-white/85">{t.pageIntro}</p>

          <div className="mt-5 rounded-3xl border border-yellow-300/40 bg-yellow-300/10 p-4">
            <label
              htmlFor="elder-language"
              className="block text-xl font-black text-yellow-100"
            >
              {t.languageLabel}
            </label>
            <select
              id="elder-language"
              value={languageCode}
              onChange={(event) => changeLanguage(event.target.value)}
              className="mt-3 w-full rounded-2xl border-4 border-yellow-200 bg-white px-4 py-5 text-2xl font-black text-[#091a31] outline-none focus:ring-8 focus:ring-yellow-300"
            >
              {languageOptions.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.nativeLabel} - {language.label}
                </option>
              ))}
            </select>

            <div className="mt-5 rounded-2xl border border-orange-300/40 bg-orange-300/10 p-4">
              <label
                htmlFor="elder-helper-language"
                className="block text-xl font-black text-orange-100"
              >
                Î“Î»ÏŽÏƒÏƒÎ± Î¿Î¹ÎºÎ¹Î±ÎºÎ®Ï‚ Î²Î¿Î·Î¸Î¿Ï / ÏƒÏ…Î½Î¿Î¼Î¹Î»Î·Ï„Î®
              </label>
              <select
                id="elder-helper-language"
                value={helperLanguageCode}
                onChange={(event) => changeHelperLanguage(event.target.value)}
                className="mt-3 w-full rounded-2xl border-4 border-orange-200 bg-white px-4 py-5 text-2xl font-black text-[#091a31] outline-none focus:ring-8 focus:ring-orange-300"
              >
                {languageOptions.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.nativeLabel} - {language.label}
                  </option>
                ))}
              </select>
              <p className="mt-3 text-base font-bold leading-7 text-orange-100">
                Î‘Ï…Ï„Î® ÎµÎ¯Î½Î±Î¹ Î· Î´ÎµÏÏ„ÎµÏÎ· Î³Î»ÏŽÏƒÏƒÎ± Î³Î¹Î± Ï„Î·Î½ Ï€Î¿ÏÏ„Î¿ÎºÎ±Î»Î¯ Î²Î¿Î®Î¸ÎµÎ¹Î± /
                Î¼ÎµÏ„Î¬Ï†ÏÎ±ÏƒÎ· Î¼Îµ Î¿Î¹ÎºÎ¹Î±ÎºÎ® Î²Î¿Î·Î¸ÏŒ, Î½Î¿ÏƒÎ·Î»ÎµÏ…Ï„Î®, Î³Î¹Î±Ï„ÏÏŒ, Ï„Î±Î¾Î¯,
                Ï…Ï€Î·ÏÎµÏƒÎ¯Î± Î® Î¬Î»Î»Î¿ Î¬Î½Î¸ÏÏ‰Ï€Î¿.
              </p>
            </div>

            <p className="mt-3 text-base font-bold leading-7 text-yellow-100">
              {t.languageHelp}
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-yellow-300/40 bg-yellow-300/10 p-4 text-base font-bold leading-7 text-yellow-100">
            {t.emergencyBoundary}
          </div>
        </div>

        <section className="rounded-[2rem] border-4 border-red-200 bg-red-700 p-5 shadow-2xl">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-red-100">
            {t.redKicker}
          </p>
          <button
            type="button"
            onClick={activateLocalSos}
            className="mt-4 w-full rounded-[2rem] bg-red-100 px-6 py-12 text-center text-7xl font-black text-red-800 shadow-2xl transition hover:scale-[1.01] focus:outline-none focus:ring-8 focus:ring-white"
            aria-label={t.sosButton}
          >
            {t.sosButton}
          </button>
          <p className="mt-4 text-2xl font-black leading-9 text-white">
            {t.redTitle}
          </p>
          <p className="mt-2 text-lg leading-8 text-red-50">{t.redBody}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              href="/sos"
              className="rounded-2xl bg-white px-5 py-5 text-center text-2xl font-black text-red-800"
            >
              {t.openLiveSos}
            </Link>
            <Link
              href="/sos/contacts"
              className="rounded-2xl border-2 border-white px-5 py-5 text-center text-2xl font-black text-white"
            >
              {t.emergencyCircle}
            </Link>
          </div>
        </section>

        <section className="rounded-[2rem] border-4 border-orange-200 bg-orange-500 p-5 shadow-2xl">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-orange-950">
            {t.orangeKicker}
          </p>
          <h2 className="mt-3 text-4xl font-black leading-tight text-orange-950">
            {t.orangeTitle}
          </h2>
          <p className="mt-3 text-xl font-bold leading-9 text-orange-950">
            {t.orangeBody}
          </p>

          <div
            data-pantavion-elder-auto-speech-mode="true"
            className="mt-4 rounded-2xl border-4 border-orange-100 bg-white/85 p-4 text-orange-950"
          >
            <p className="text-lg font-black">Translation mode</p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => changeTranslationMode("auto")}
                className={`rounded-2xl px-4 py-5 text-xl font-black ${
                  translationMode === "auto"
                    ? "bg-orange-950 text-orange-100"
                    : "border-4 border-orange-300 bg-white text-orange-950"
                }`}
              >
                Auto speech language detection
              </button>

              <button
                type="button"
                onClick={() => changeTranslationMode("manual")}
                className={`rounded-2xl px-4 py-5 text-xl font-black ${
                  translationMode === "manual"
                    ? "bg-orange-950 text-orange-100"
                    : "border-4 border-orange-300 bg-white text-orange-950"
                }`}
              >
                Manual second language backup
              </button>
            </div>

            {translationMode === "auto" ? (
              <div className="mt-4 rounded-2xl border-4 border-green-300 bg-green-50 p-4">
                <p className="text-2xl font-black">
                  {selectedLanguage.nativeLabel} â†” auto-detect speech
                </p>
                <p className="mt-2 text-base font-bold leading-7">
                  Default mode: the elder speaks naturally. The other person
                  speaks naturally. Real live recognition requires a future
                  speech/translation provider, microphone consent and privacy controls.
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border-4 border-orange-300 bg-orange-50 p-4">
                <label
                  htmlFor="elder-helper-language"
                  className="block text-xl font-black"
                >
                  Helper / counterparty language
                </label>

                <select
                  id="elder-helper-language"
                  value={helperLanguageCode}
                  onChange={(event) => changeHelperLanguage(event.target.value)}
                  className="mt-3 w-full rounded-2xl border-4 border-orange-300 bg-white px-4 py-5 text-2xl font-black text-[#091a31] outline-none focus:ring-8 focus:ring-orange-300"
                >
                  {languageOptions.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.nativeLabel} - {language.label}
                    </option>
                  ))}
                </select>

                <p className="mt-3 text-2xl font-black">
                  {selectedLanguage.nativeLabel} â†’ {selectedHelperLanguage.nativeLabel}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-2xl border-4 border-orange-100 bg-white/80 p-4 text-orange-950">
            <p className="text-lg font-black">Î“Î»ÏŽÏƒÏƒÎµÏ‚ ÏƒÏ…Î½Î¿Î¼Î¹Î»Î¯Î±Ï‚</p>
            <p className="mt-2 text-3xl font-black">
              {selectedLanguage.nativeLabel} â†’ {selectedHelperLanguage.nativeLabel}
            </p>
            <p className="mt-2 text-base font-bold leading-7">
              Î— Ï€ÏÏŽÏ„Î· ÎµÎ¯Î½Î±Î¹ Ï„Î¿Ï… Ï‡ÏÎ®ÏƒÏ„Î·. Î— Î´ÎµÏÏ„ÎµÏÎ· ÎµÎ¯Î½Î±Î¹ Ï„Î¿Ï… Î±Î½Î¸ÏÏŽÏ€Î¿Ï… Ï€Î¿Ï… Î¼Î¹Î»Î¬
              Î¼Î±Î¶Î¯ Ï„Î¿Ï….
            </p>
          </div>

          <Link
            href={`/sos-interpreter?from=${languageCode}&to=${helperLanguageCode}`}
            className="mt-5 block rounded-[2rem] bg-orange-950 px-6 py-8 text-center text-3xl font-black text-orange-100 shadow-xl"
          >
            {t.orangeButton}
          </Link>
        </section>

        <section className="rounded-[2rem] border-4 border-green-200 bg-green-600 p-5 shadow-2xl">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-green-950">
            {t.greenKicker}
          </p>
          <h2 className="mt-3 text-4xl font-black leading-tight text-green-950">
            {t.greenTitle}
          </h2>
          <p className="mt-3 text-xl font-bold leading-9 text-green-950">
            {t.greenBody}
          </p>

          <label className="mt-5 block text-xl font-black text-green-950">
            {t.greenNoteLabel}
          </label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t.greenPlaceholder}
            className="mt-3 min-h-36 w-full rounded-3xl border-4 border-green-200 bg-white p-5 text-2xl font-bold leading-9 text-green-950 outline-none focus:ring-8 focus:ring-green-200"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={saveAiNote}
              className="rounded-2xl bg-green-950 px-5 py-6 text-2xl font-black text-green-100"
            >
              {t.saveToPhone}
            </button>
            <button
              type="button"
              disabled
              className="rounded-2xl border-2 border-green-950/40 px-5 py-6 text-2xl font-black text-green-950/70"
            >
              {t.aiVoiceNext}
            </button>
          </div>
          <p className="mt-4 text-lg font-bold leading-8 text-green-950">
            {t.aiBoundary}
          </p>
        </section>

        <section className="rounded-[2rem] border border-white/15 bg-white/10 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-black">{t.historyTitle}</h2>
              <p className="mt-2 text-lg text-white/75">{t.historyBody}</p>
            </div>
            <button
              type="button"
              onClick={clearLocalHistory}
              className="rounded-2xl border border-white/30 px-4 py-3 text-lg font-black text-white"
            >
              {t.deleteHistory}
            </button>
          </div>

          {lastAction ? (
            <div className="mt-4 rounded-2xl border border-yellow-300/50 bg-yellow-300/10 p-4 text-lg font-bold text-yellow-100">
              {lastAction}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3">
            {history.length ? (
              history.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-white/15 bg-[#071426] p-4"
                >
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-yellow-300">
                    {item.mode === "sos"
                      ? t.sosHistoryLabel
                      : item.mode === "language"
                        ? t.languageHistoryLabel
                        : t.noteHistoryLabel}{" "}
                    Â· {formatDateTime(item.createdAt, languageCode)}
                  </p>
                  <p className="mt-2 text-lg font-bold leading-8 text-white/90">
                    {item.text}
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-2xl border border-white/15 bg-[#071426] p-4 text-lg text-white/75">
                {t.noHistory}
              </p>
            )}
          </div>
        </section>

        <div className="rounded-[2rem] border border-white/15 bg-[#091a31] p-5">
          <h2 className="text-2xl font-black">{t.rulesTitle}</h2>
          <ul className="mt-4 space-y-3 text-lg font-bold leading-8 text-white/85">
            {t.rules.map((rule) => (
              <li key={rule}>â€¢ {rule}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
