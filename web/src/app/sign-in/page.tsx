import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { SignInBrandPanel } from "@/components/auth/SignInBrandPanel";
import { SignInCard } from "@/components/auth/SignInCard";
import { SignInErrorBanner } from "@/components/auth/SignInErrorBanner";
import { SkyPageShell } from "@/components/landing/SkyPageShell";
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
    <SkyPageShell>
      <div className="sky-scroll relative z-10 min-h-screen md:grid md:grid-cols-2">
        <SignInBrandPanel />

        <div className="relative flex min-h-[calc(100vh-240px)] items-center justify-center px-6 py-12 md:min-h-screen md:py-16">
          <div className="w-full max-w-md px-2">
            <Suspense fallback={null}>
              <SignInErrorBanner />
            </Suspense>
            <SignInCard configured={configured} callbackUrl={callbackUrl} />
          </div>
        </div>
      </div>
    </SkyPageShell>
  );
}
