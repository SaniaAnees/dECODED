import type { AuthProviderId } from "@/lib/auth-status";
import { OAUTH_ORIGIN } from "@/lib/site";

/** POST to NextAuth on OAUTH_ORIGIN (localhost locally — Google rejects auth.localhost). */
export async function startOAuth(
  provider: AuthProviderId,
  callbackUrl: string,
): Promise<void> {
  const authOrigin = OAUTH_ORIGIN;

  const csrfResponse = await fetch(`${authOrigin}/api/auth/csrf`, {
    credentials: "include",
  });
  if (!csrfResponse.ok) {
    throw new Error(`Auth unavailable (${csrfResponse.status})`);
  }

  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  const form = document.createElement("form");
  form.method = "POST";
  form.action = `${authOrigin}/api/auth/signin/${provider}`;

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
