"use client";

import { useSession } from "next-auth/react";
import { UserProfileMenu } from "@/components/auth/UserProfileMenu";
import { SIGN_IN_URL } from "@/lib/site";

export function SignInLink() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span className="inline-block h-9 w-24 animate-pulse rounded-full bg-white/10" />
    );
  }

  if (session?.user) {
    return <UserProfileMenu user={session.user} />;
  }

  return (
    <a
      href={SIGN_IN_URL}
      className="font-serif text-[15px] text-white/80 transition-colors hover:text-white"
    >
      Sign in
    </a>
  );
}
