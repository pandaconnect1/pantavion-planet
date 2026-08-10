"use client";

import { useEffect, useRef } from "react";
import { PANTAVION_LANGUAGE_STORAGE_KEY } from "@/core/i18n/pantavion-global-language";

const originals = new WeakMap<Text, string>();
const CACHE_PREFIX = "pantavion-ui-translation-v1";

function hashText(value: string) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

function cacheKey(targetLanguage: string, source: string) {
  return `${CACHE_PREFIX}:${targetLanguage}:${hashText(source)}`;
}

function shouldTranslate(node: Text) {
  const parent = node.parentElement;
  if (!parent) return false;
  if (!parent.closest('[data-pantavion-static-ui="true"]')) return false;
  if (parent.closest("[data-pantavion-no-translate]")) return false;
  if (parent.closest("script,style,textarea,input,select,option,code,pre")) return false;
  const value = node.nodeValue?.trim() || "";
  if (value.length < 2) return false;
  if (!/[A-Za-zΑ-Ωα-ωΆ-ώÀ-ÿ\u0600-\u06ff\u0400-\u04ff]/.test(value)) return false;
  return true;
}

function collectTextNodes() {
  const nodes: Text[] = [];
  const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-pantavion-static-ui="true"]'));
  for (const root of roots) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      const textNode = current as Text;
      if (shouldTranslate(textNode)) nodes.push(textNode);
      current = walker.nextNode();
    }
  }
  return nodes;
}

async function translateStaticText(source: string, targetLanguage: string) {
  if (targetLanguage === "en") return source;

  const key = cacheKey(targetLanguage, source);
  try {
    const cached = window.localStorage.getItem(key);
    if (cached) return cached;
  } catch {
    // Cache is optional.
  }

  const response = await fetch("/api/pantavion/translate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      text: source,
      sourceLanguage: "auto",
      targetLanguage,
      domain: "general",
      bidirectional: false,
    }),
  });

  if (!response.ok) return source;
  const body = await response.json().catch(() => null);
  const translated = typeof body?.translatedText === "string" ? body.translatedText.trim() : "";
  if (!translated) return source;

  try {
    window.localStorage.setItem(key, translated);
  } catch {
    // Cache is optional.
  }
  return translated;
}

async function runPool<T>(items: T[], worker: (item: T) => Promise<void>, concurrency = 4) {
  let index = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      await worker(items[currentIndex]);
    }
  });
  await Promise.all(runners);
}

export default function PantavionGlobalUiTranslationRuntime() {
  const runId = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const applyLanguage = async (targetLanguage: string) => {
      const currentRun = ++runId.current;
      const nodes = collectTextNodes();

      for (const node of nodes) {
        if (!originals.has(node)) originals.set(node, node.nodeValue || "");
      }

      if (targetLanguage === "en") {
        for (const node of nodes) {
          const original = originals.get(node);
          if (original != null) node.nodeValue = original;
        }
        return;
      }

      await runPool(nodes.slice(0, 100), async (node) => {
        if (currentRun !== runId.current || !node.isConnected) return;
        const original = originals.get(node) ?? node.nodeValue ?? "";
        const trimmed = original.trim();
        if (!trimmed) return;
        const translated = await translateStaticText(trimmed, targetLanguage).catch(() => trimmed);
        if (currentRun !== runId.current || !node.isConnected || translated === trimmed) return;
        const leading = original.match(/^\s*/)?.[0] || "";
        const trailing = original.match(/\s*$/)?.[0] || "";
        node.nodeValue = `${leading}${translated}${trailing}`;
      });
    };

    const resolveCurrent = () => window.localStorage.getItem(PANTAVION_LANGUAGE_STORAGE_KEY) || document.documentElement.lang || "en";
    void applyLanguage(resolveCurrent());

    const languageHandler = (event: Event) => {
      const custom = event as CustomEvent<string>;
      if (custom.detail) void applyLanguage(custom.detail);
    };

    const observer = new MutationObserver(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void applyLanguage(resolveCurrent()), 180);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("pantavion-language-change", languageHandler as EventListener);

    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("pantavion-language-change", languageHandler as EventListener);
    };
  }, []);

  return null;
}
