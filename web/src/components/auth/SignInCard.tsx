"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { OAuthButton } from "@/components/auth/OAuthButton";
import type { AuthProviderId } from "@/lib/auth-status";
import { MAIN_SITE_URL, PRIVACY_URL } from "@/lib/site";

const OAUTH: { id: AuthProviderId; label: string }[] = [
  { id: "google", label: "Continue with Google" },
  { id: "github", label: "Continue with GitHub" },
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
          <h2 className="font-serif text-2xl font-medium text-[#f7f1e6] md:text-3xl">
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
            <OAuthButton
              key={provider.id}
              provider={provider.id}
              label={provider.label}
              ready={ready}
              disabled={false}
              onLaunch={async () => {
                const authParams =
                  provider.id === "google"
                    ? { prompt: "select_account" }
                    : undefined;
                await signIn(provider.id, { callbackUrl }, authParams);
              }}
            />
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
