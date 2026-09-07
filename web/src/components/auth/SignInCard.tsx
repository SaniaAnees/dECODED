"use client";

import Link from "next/link";
import type { AuthProviderId } from "@/lib/auth-status";
import { startOAuth } from "@/lib/oauth-client";
import { MAIN_SITE_URL, PRIVACY_URL } from "@/lib/site";

const OAUTH: { id: AuthProviderId; label: string }[] = [
  { id: "google", label: "Continue with Google" },
  { id: "github", label: "Continue with GitHub" },
  { id: "apple", label: "Continue with Apple" },
  { id: "microsoft", label: "Continue with Microsoft" },
];

export function SignInCard({
  configured,
  callbackUrl,
}: {
  configured: AuthProviderId[];
  callbackUrl: string;
}) {
  return (
    <div className="auth-signin-card w-full p-8 md:p-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.28em] text-[#e4b45c]">
            SIGN IN
          </p>
          <h2 className="mt-3 font-serif text-2xl font-medium text-[#f7f1e6] md:text-3xl">
            Sign in
          </h2>
        </div>
        <Link
          href={MAIN_SITE_URL}
          className="shrink-0 font-serif text-[15px] text-[#f7f1e6]/55 transition-colors hover:text-[#f7f1e6]"
        >
          ← Back
        </Link>
      </div>

      <div className="space-y-3">
        {OAUTH.map((provider) => {
          const ready = configured.includes(provider.id);
          return (
            <button
              key={provider.id}
              type="button"
              disabled={!ready}
              onClick={() =>
                void startOAuth(
                  provider.id,
                  callbackUrl,
                  provider.id === "google" || provider.id === "microsoft"
                    ? { prompt: "select_account" }
                    : undefined,
                )
              }
              className="flex w-full items-center justify-center rounded-lg border border-[#f7f1e6]/30 bg-white/10 px-4 py-3.5 font-serif text-[15px] text-[#f7f1e6] transition-colors hover:border-[#f7f1e6]/45 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {provider.label}
            </button>
          );
        })}
      </div>

      <p className="mt-8 text-center font-serif text-[13px] text-[#f7f1e6]/45">
        <a
          href={PRIVACY_URL}
          className="underline-offset-4 transition-colors hover:text-[#f7f1e6]/80 hover:underline"
        >
          Privacy
        </a>
      </p>
    </div>
  );
}
