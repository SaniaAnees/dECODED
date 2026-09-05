"use client";



import { useState } from "react";

import Link from "next/link";

import type { AuthProviderId } from "@/lib/auth-status";

import { OAuthButton } from "@/components/auth/OAuthButton";

import { OAuthTransitionOverlay } from "@/components/auth/OAuthTransitionOverlay";

import { startOAuth } from "@/lib/oauth-client";

import { BrandMark } from "@/components/landing/BrandMark";
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

  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [pendingProvider, setPendingProvider] = useState<AuthProviderId | null>(

    null,

  );



  const [oauthError, setOauthError] = useState<string | null>(null);



  const pendingLabel =

    pendingProvider === "google"

      ? "Google"

      : pendingProvider

        ? OAUTH.find((p) => p.id === pendingProvider)?.label.replace(

            "Continue with ",

            "",

          )

        : null;



  return (

    <>

      {pendingProvider && pendingLabel ? (

        <OAuthTransitionOverlay

          provider={pendingProvider}

          providerLabel={pendingLabel}

        />

      ) : null}

      <div className="auth-signin-card w-full p-8 md:p-10 animate-[auth-overlay-in_0.5s_cubic-bezier(0.22,1,0.36,1)_both]">

        <div className="mb-8 flex items-start justify-between gap-4">

          <div>

            <BrandMark className="mb-4 h-11 w-11" />

            <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">

              {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}

            </p>

            <h2 className="mt-3 font-serif text-2xl font-medium text-moon md:text-3xl">

              {mode === "signin" ? "Sign in" : "Create account"}

            </h2>

            <p className="mt-2 font-serif text-[15px] text-mist">

              {mode === "signin"

                ? "Sign in to your console"

                : "Start with email or OAuth"}

            </p>

          </div>

          <Link

            href={MAIN_SITE_URL}

            className="shrink-0 font-serif text-[15px] text-dusk transition-colors hover:text-moon"

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

                disabled={pendingProvider !== null}

                onLaunch={async () => {

                  setOauthError(null);

                  setPendingProvider(provider.id);

                  try {

                    await startOAuth(provider.id, callbackUrl);

                  } catch {

                    setPendingProvider(null);

                    setOauthError(

                      "Could not reach sign-in. Restart the dev server and try again.",

                    );

                  }

                }}

              />

            );

          })}

        </div>



        {oauthError ? (

          <p className="mt-3 text-center font-mono text-[10px] tracking-[0.08em] text-red-200/90">

            {oauthError}

          </p>

        ) : null}



        <div className="my-6 flex items-center gap-3">

          <div className="h-px flex-1 bg-line" />

          <span className="font-mono text-[10px] tracking-[0.22em] text-dusk">

            OR

          </span>

          <div className="h-px flex-1 bg-line" />

        </div>



        <form

          className="space-y-4"

          onSubmit={(e) => {

            e.preventDefault();

          }}

        >

          <div>

            <label

              htmlFor="auth-email"

              className="font-mono text-[11px] tracking-[0.18em] text-gilt"

            >

              EMAIL

            </label>

            <input

              id="auth-email"

              type="email"

              autoComplete="email"

              value={email}

              onChange={(e) => setEmail(e.target.value)}

              placeholder="you@company.com"

              className="mt-2 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2.5 font-serif text-[15px] text-moon outline-none placeholder:text-dusk backdrop-blur-sm focus:border-[#e4b45c]/50"

            />

          </div>



          <div>

            <div className="flex items-center justify-between gap-3">

              <label

                htmlFor="auth-password"

                className="font-mono text-[11px] tracking-[0.18em] text-gilt"

              >

                PASSWORD

              </label>

              {mode === "signin" ? (

                <button

                  type="button"

                  className="font-mono text-[10px] tracking-[0.12em] text-dusk hover:text-gilt"

                >

                  Forgot?

                </button>

              ) : null}

            </div>

            <input

              id="auth-password"

              type="password"

              autoComplete={

                mode === "signin" ? "current-password" : "new-password"

              }

              value={password}

              onChange={(e) => setPassword(e.target.value)}

              placeholder="Your password"

              className="mt-2 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2.5 font-serif text-[15px] text-moon outline-none placeholder:text-dusk backdrop-blur-sm focus:border-[#e4b45c]/50"

            />

          </div>



          <button

            type="submit"

            disabled

            className="w-full rounded-md border border-white/15 bg-white/8 px-4 py-3 font-serif text-[15px] text-moon/45"

            title="Email sign-in coming soon"

          >

            {mode === "signin" ? "Sign in" : "Create account"}

          </button>

          <p className="text-center font-mono text-[10px] tracking-[0.1em] text-dusk">

            Email sign-in coming soon — use OAuth above for now.

          </p>

        </form>



        <p className="mt-8 text-center font-serif text-[15px] text-mist">

          {mode === "signin" ? (

            <>

              New here?{" "}

              <button

                type="button"

                onClick={() => setMode("signup")}

                className="text-gilt transition-colors hover:text-moon"

              >

                Create an account

              </button>

            </>

          ) : (

            <>

              Already have an account?{" "}

              <button

                type="button"

                onClick={() => setMode("signin")}

                className="text-gilt transition-colors hover:text-moon"

              >

                Sign in

              </button>

            </>

          )}

        </p>

      </div>

    </>

  );

}

