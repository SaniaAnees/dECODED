import type { AuthProviderId } from "@/lib/auth-status";
import { OAUTH_ORIGIN } from "@/lib/site";

/** Same host as /api/auth — avoids client bundles falling back to localhost. */
function resolveAuthOrigin(): string {
  if (typeof window !== "undefined") {
    const { hostname, origin, protocol, port } = window.location;
    if (hostname === "localhost" || hostname.startsWith("auth.")) {
      // Google OAuth rejects auth.localhost; API still lives on localhost.
      if (hostname.endsWith(".localhost") && hostname !== "localhost") {
        return `${protocol}//localhost:${port || "3000"}`;
      }
      return origin;
    }
  }
  return OAUTH_ORIGIN;
}

/** POST to NextAuth on the auth host (localhost locally — Google rejects auth.localhost). */
export async function startOAuth(
  provider: AuthProviderId,
  callbackUrl: string,
  authorizationParams?: Record<string, string>,
): Promise<void> {
  const authOrigin = resolveAuthOrigin();

  const csrfResponse = await fetch(`${authOrigin}/api/auth/csrf`, {
    credentials: "include",
  });
  if (!csrfResponse.ok) {
    throw new Error(`Auth unavailable (${csrfResponse.status})`);
  }

  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  const query = authorizationParams
    ? `?${new URLSearchParams(authorizationParams).toString()}`
    : "";
  const form = document.createElement("form");
  form.method = "POST";
  form.action = `${authOrigin}/api/auth/signin/${provider}${query}`;

  const csrf = document.createElement("input");
  csrf.type = "hidden";
  csrf.name = "csrfToken";
  csrf.value = csrfToken;
  form.appendChild(csrf);

  const cb = document.createElement("input");
  cb.type = "hidden";
  cb.name = "callbackUrl";
  cb.value = callbackUrl;
  form.appendChild(cb);

  document.body.appendChild(form);
  form.submit();
}
