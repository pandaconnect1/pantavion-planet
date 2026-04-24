"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function LoginClient() {
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");

    if (!email) {
      setMessage("Βάλε email για local foundation session.");
      return;
    }

    localStorage.setItem("pantavion.session", "local-foundation");
    localStorage.setItem("pantavion.lastLoginEmail", email);
    setMessage("Local foundation session created. Production login needs auth provider/database.");
  }

  return (
    <form className="pv-form pv-panel" onSubmit={submit}>
      <span className="pv-status">Login Foundation</span>
      <h1>Login to Pantavion</h1>
      <p className="pv-muted">
        This is a real route and client-side foundation flow. It does not pretend to be secure production auth.
      </p>

      {message ? <div className="pv-result">{message}</div> : null}

      <div className="pv-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" />
      </div>

      <div className="pv-field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" />
      </div>

      <div className="pv-actions">
        <button className="pv-button gold" type="submit">Create local session</button>
        <Link className="pv-button blue" href="/dashboard">Open Dashboard</Link>
        <Link className="pv-button" href="/auth/register">Register</Link>
      </div>
    </form>
  );
}
