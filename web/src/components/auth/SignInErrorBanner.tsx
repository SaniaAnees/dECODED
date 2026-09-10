"use client";

import { useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "That email is already on your account with the other sign-in method. Use the same provider you signed up with, or try again — we now link Google and GitHub when the email matches.",
  OAuthCallback:
    "Sign-in could not finish. Try again in a moment.",
  OAuthCreateAccount:
    "Could not save your account. Try again in a moment.",
  Callback:
    "Sign-in failed after the provider returned. Try again in a moment.",
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
