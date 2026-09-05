import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { WelcomeScreen } from "@/components/auth/WelcomeScreen";
import { SkyPageShell } from "@/components/landing/SkyPageShell";
import { getAuthOptions } from "@/lib/auth";
import { AUTH_KIND_COOKIE } from "@/lib/auth-session";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Welcome — ${SITE_NAME}`,
  robots: { index: false },
};

export default async function WelcomePage() {
  const session = await getServerSession(getAuthOptions());
  if (!session) redirect("/sign-in");

  const jar = await cookies();
  const authKind = jar.get(AUTH_KIND_COOKIE)?.value;

  if (authKind === "returning") {
    redirect("/");
  }

  return (
    <SkyPageShell>
      <WelcomeScreen />
    </SkyPageShell>
  );
}
