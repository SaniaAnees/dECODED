import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { SignInBrandPanel } from "@/components/auth/SignInBrandPanel";
import { SignInCard } from "@/components/auth/SignInCard";
import { SignInErrorBanner } from "@/components/auth/SignInErrorBanner";
import { getAuthOptions } from "@/lib/auth";
import { getConfiguredProviders } from "@/lib/auth-status";
import { WELCOME_URL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Sign in — ${SITE_NAME}`,
};

export default async function SignInPage() {
  const session = await getServerSession(getAuthOptions());
  if (session) redirect("/");

  const configured = getConfiguredProviders();
  const callbackUrl = WELCOME_URL;

  return (
    <div className="sky-scroll relative min-h-screen md:grid md:grid-cols-2">
      {/* Single sky canvas — right half dims into twilight, no separate galaxy layer. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sky.jpg"
          alt=""
          className="hero-sky__img sky-print h-full w-full object-cover object-[50%_42%]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(10,18,40,0.35) 0%, rgba(10,18,40,0.12) 45%, rgba(10,18,40,0.04) 72%, transparent 100%)",
          }}
        />
      </div>

      <SignInBrandPanel />

      <div className="relative z-10 flex min-h-[calc(100vh-240px)] items-center justify-center px-6 py-12 md:min-h-screen md:py-16">
        <div className="w-full max-w-md px-2">
          <Suspense fallback={null}>
            <SignInErrorBanner />
          </Suspense>
          <SignInCard configured={configured} callbackUrl={callbackUrl} />
        </div>
      </div>
    </div>
  );
}
