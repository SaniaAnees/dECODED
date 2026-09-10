import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { SignInBrandPanel } from "@/components/auth/SignInBrandPanel";
import { SignInCard } from "@/components/auth/SignInCard";
import { SignInErrorBanner } from "@/components/auth/SignInErrorBanner";
import { SkyPageShell } from "@/components/landing/SkyPageShell";
import { getAuthOptions } from "@/lib/auth";
import {
  absoluteReturnUrl,
  oauthCallbackWithReturn,
  safeReturnPath,
} from "@/lib/auth-return";
import { getConfiguredProviders } from "@/lib/auth-status";
import { MAIN_SITE_URL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Sign in — ${SITE_NAME}`,
};

type SignInPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = (await searchParams) ?? {};
  const returnPath = safeReturnPath(firstParam(params.callbackUrl));

  const session = await getServerSession(getAuthOptions());
  if (session) {
    redirect(returnPath ? absoluteReturnUrl(returnPath) : MAIN_SITE_URL);
  }

  const configured = getConfiguredProviders();
  const callbackUrl = oauthCallbackWithReturn(returnPath);

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
