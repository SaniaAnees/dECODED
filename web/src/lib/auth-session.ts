/** Production session — same browser stays signed in; other browsers re-auth via OAuth. */

/** Default 30 days — industry standard for web apps. */
export const SESSION_MAX_AGE_SEC =
  Number(process.env.AUTH_SESSION_MAX_AGE_DAYS ?? 30) * 24 * 60 * 60;

/** Rolling session: extend expiry when user is active (daily). */
export const SESSION_UPDATE_AGE_SEC = 24 * 60 * 60;

/** Short-lived cookie set after OAuth to route new vs returning users. */
export const AUTH_KIND_COOKIE = "wrayle_auth_kind";

export type AuthKind = "new" | "returning";
