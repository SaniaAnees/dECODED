import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { WelcomeScreen } from "@/components/auth/WelcomeScreen";
import { SkyPageShell } from "@/components/landing/SkyPageShell";
import { getAuthOptions } from "@/lib/auth";
import { safeReturnPath } from "@/lib/auth-return";
import { AUTH_KIND_COOKIE } from "@/lib/auth-session";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Welcome — ${SITE_NAME}`,
  robots: { index: false },
};

type WelcomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  const session = await getServerSession(getAuthOptions());
  if (!session) redirect("/sign-in");

  const params = (await searchParams) ?? {};
  const nextPath = safeReturnPath(firstParam(params.next)) || "/";

  const jar = await cookies();
  const authKind = jar.get(AUTH_KIND_COOKIE)?.value;

  if (authKind === "returning") {
    redirect(nextPath);
  }

  return (
    <SkyPageShell>
      <WelcomeScreen nextPath={nextPath} />
    </SkyPageShell>
  );
}
