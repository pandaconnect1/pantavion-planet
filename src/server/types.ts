export type AppEnvironment = "dev" | "staging" | "prod";
export type AppRegion = "global" | "eu" | "us" | "mena" | "africa" | "apac" | "latam";

export interface AppConfig {
  appName: string;
  env: AppEnvironment;
  region: AppRegion;
  adminEmail: string;
  allowGenerative: boolean;
  allowRestricted: boolean;
}
