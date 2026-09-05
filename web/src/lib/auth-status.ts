import { isDatabaseConfigured } from "@/db";

export type AuthProviderId = "google" | "github" | "apple" | "microsoft";

export function getConfiguredProviders(): AuthProviderId[] {
  const providers: AuthProviderId[] = [];

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push("google");
  }
  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    providers.push("github");
  }
  if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
    providers.push("apple");
  }
  if (
    process.env.AUTH_AZURE_AD_ID &&
    process.env.AUTH_AZURE_AD_SECRET
  ) {
    providers.push("microsoft");
  }

  return providers;
}

/** Sign-in UI is available when secret + at least one OAuth provider is configured. */
export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.AUTH_SECRET && getConfiguredProviders().length > 0,
  );
}

/** Database-backed sessions (official path). */
export function isDatabaseAuthReady(): boolean {
  return (
    process.env.AUTH_USE_DATABASE !== "false" &&
    isDatabaseConfigured() &&
    Boolean(process.env.AUTH_SECRET)
  );
}
