"use client";

import { signIn } from "next-auth/react";

export function SignInButton() {
  return (
    <button
      type="button"
      onClick={() => signIn("google")}
      className="font-serif text-[15px] text-white/80 transition-colors hover:text-white"
    >
      Sign in
    </button>
  );
}
