"use client";

import { useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  OAuthCallback:
    "Google sign-in could not finish. Clear cookies for localhost and try again.",
  OAuthCreateAccount:
    "Could not save your account. Database write failed — restart dev server and try again.",
  Callback:
    "Sign-in failed after Google returned. Check DATABASE_URL and auth tables in Supabase.",
  Configuration:
    "Auth is misconfigured. Check AUTH_SECRET and Google credentials in .env.local.",
  AccessDenied: "Access was denied.",
  Verification: "Verification link expired or already used.",
};

export function SignInErrorBanner() {
  const params = useSearchParams();
  const error = params.get("error");

  if (!error) return null;

  return (
    <div
      role="alert"
      className="mb-6 border border-red-400/40 bg-red-950/40 px-4 py-3 font-serif text-[14px] text-red-100"
    >
      {MESSAGES[error] ?? `Sign-in error: ${error}`}
    </div>
  );
}
