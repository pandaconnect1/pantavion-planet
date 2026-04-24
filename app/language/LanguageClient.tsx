"use client";

import { FormEvent, useState } from "react";
import { pantavionLanguages } from "@/core/i18n/languages";

export default function LanguageClient() {
  const [result, setResult] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const response = await fetch("/api/translate/text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: String(data.get("text") ?? ""),
        source: String(data.get("source") ?? "el"),
        target: String(data.get("target") ?? "en"),
      }),
    });

    const packet = await response.json();
    setResult(JSON.stringify(packet, null, 2));
  }

  return (
    <form className="pv-form pv-panel" onSubmit={submit}>
      <span className="pv-status">Language Bridge Foundation</span>
      <h1>Translate Assist</h1>
      <p className="pv-muted">
        Real route + real API shell. It performs foundation dictionary/fallback translation now and is ready
        for live provider integration next.
      </p>

      <div className="pv-grid">
        <div className="pv-field">
          <label htmlFor="source">From</label>
          <select id="source" name="source" defaultValue="el">
            {pantavionLanguages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.nativeName}
              </option>
            ))}
          </select>
        </div>

        <div className="pv-field">
          <label htmlFor="target">To</label>
          <select id="target" name="target" defaultValue="en">
            {pantavionLanguages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.nativeName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pv-field">
        <label htmlFor="text">Text</label>
        <textarea id="text" name="text" placeholder="Γράψε κείμενο για μετάφραση..." />
      </div>

      <button className="pv-button gold" type="submit">Translate through foundation bridge</button>

      {result ? <pre className="pv-result">{result}</pre> : null}
    </form>
  );
}
