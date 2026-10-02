import { betterAuth } from "better-auth";
import { Pool } from "pg";

import { sendPantavionAuthEmail } from "./email";

const databaseUrl = process.env.PANTAVION_AUTH_DATABASE_URL?.trim();

const pool = new Pool({
  connectionString:
    databaseUrl || "postgresql://invalid:invalid@127.0.0.1:1/pantavion_auth",
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

const baseURL =
  process.env.PANTAVION_AUTH_BASE_URL?.trim() || "https://pantavion.com";

export const pantavionAuth = betterAuth({
  appName: "Pantavion",
  baseURL,
  basePath: "/api/pantavion-auth",
  secret: process.env.PANTAVION_AUTH_SECRET,
  database: pool,
  trustedOrigins: [
    "https://pantavion.com",
    "https://pantavion-planet.onrender.com",
    ...(process.env.PANTAVION_AUTH_EXTRA_ORIGINS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 3600,
    sendResetPassword: async ({ user, url }) => {
      await sendPantavionAuthEmail({
        to: user.email,
        subject: "Pantavion — αλλαγή κωδικού",
        text: [
          "Ζητήθηκε αλλαγή κωδικού για τον λογαριασμό Pantavion.",
          "",
          "Άνοιξε τον ασφαλή σύνδεσμο:",
          url,
          "",
          "Αν δεν έκανες εσύ το αίτημα, αγνόησε αυτό το email.",
        ].join("\n"),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: false,
    expiresIn: 3600,
    sendVerificationEmail: async ({ user, url }) => {
      await sendPantavionAuthEmail({
        to: user.email,
        subject: "Pantavion — επιβεβαίωση email",
        text: [
          "Επιβεβαίωσε το email σου για το Pantavion.",
          "",
          "Άνοιξε τον ασφαλή σύνδεσμο:",
          url,
          "",
          "Ο σύνδεσμος λήγει για λόγους ασφαλείας.",
        ].join("\n"),
      });
    },
  },
});

export function pantavionAuthRuntimeReady() {
  return Boolean(
    databaseUrl &&
      process.env.PANTAVION_AUTH_SECRET?.trim() &&
      process.env.PANTAVION_AUTH_EMAIL_API_KEY?.trim() &&
      process.env.PANTAVION_AUTH_FROM_EMAIL?.trim(),
  );
}
