import { AppConfig } from "./types";

function parseBoolean(input: string | undefined, fallback: boolean): boolean {
  if (input === undefined) return fallback;
  return input.toLowerCase() === "true";
}

export const appConfig: AppConfig = {
  appName: process.env.PANTAVION_APP_NAME || "Pantavion",
  env: (process.env.PANTAVION_ENV as AppConfig["env"]) || "dev",
  region: (process.env.PANTAVION_REGION as AppConfig["region"]) || "eu",
  adminEmail: process.env.PANTAVION_ADMIN_EMAIL || "admin@pantavion.local",
  allowGenerative: parseBoolean(process.env.PANTAVION_ALLOW_GENERATIVE, true),
  allowRestricted: parseBoolean(process.env.PANTAVION_ALLOW_RESTRICTED, false),
};
