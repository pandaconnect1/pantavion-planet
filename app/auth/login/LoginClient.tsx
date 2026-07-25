"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { signIn } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="pv-button gold" type="submit" disabled={pending}>
      {pending ? "Signing in..." : "Login"}
    </button>
  );
}

export default function LoginClient() {
  return (
    <form className="pv-form pv-panel" action={signIn}>
      <span className="pv-status">Secure Login</span>
      <h1>Login to Pantavion</h1>
      <p className="pv-muted">Secure email and password authentication powered by Supabase.</p>

      <div className="pv-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="pv-field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>

      <div className="pv-actions">
        <SubmitButton />
        <Link className="pv-button" href="/auth/register">Register</Link>
      </div>
    </form>
  );
}
