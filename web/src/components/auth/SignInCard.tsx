"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import type { AuthProviderId } from "@/lib/auth-status";
import { MAIN_SITE_URL } from "@/lib/site";

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
              onClick={() => signIn(provider.id, { callbackUrl })}
              className="flex w-full items-center justify-center rounded-lg border border-[#f7f1e6]/30 bg-white/10 px-4 py-3.5 font-serif text-[15px] text-[#f7f1e6] transition-colors hover:border-[#f7f1e6]/45 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {provider.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
