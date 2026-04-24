"use client";

import { FormEvent, useState } from "react";

export default function PantaAIExecuteClient() {
  const [result, setResult] = useState<string>("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const intent = String(data.get("intent") ?? "");

    setResult("Executing intent through Pantavion foundation kernel...");

    const response = await fetch("/api/intelligence/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ intent }),
    });

    const packet = await response.json();
    setResult(JSON.stringify(packet, null, 2));
  }

  return (
    <form className="pv-form pv-panel" onSubmit={submit}>
      <span className="pv-status">Intent → Plan → Capability → Result</span>
      <h1>PantaAI Execute</h1>
      <p className="pv-muted">
        Write a goal. Pantavion will classify it, create a plan, route it to a capability family
        and return a result packet. This is the real execution shell before external AI/tool providers.
      </p>

      <div className="pv-field">
        <label htmlFor="intent">Your intent</label>
        <textarea
          id="intent"
          name="intent"
          placeholder="Example: Θέλω να ξεκινήσω υπηρεσία μετάφρασης και να βρω πελάτες..."
        />
      </div>

      <button className="pv-button gold" type="submit">Execute intent</button>

      {result ? <pre className="pv-result">{result}</pre> : null}
    </form>
  );
}
