"use client";

import { useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  OAuthCallback:
    "Google could not finish sign-in. Try Continue with Google again.",
  OAuthCreateAccount:
    "Could not save your account. Try again in a moment.",
  Callback:
    "Sign-in failed after Google returned. Try another provider, or try again in a moment.",
  Configuration:
    "Sign-in is misconfigured. Try again in a moment.",
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
