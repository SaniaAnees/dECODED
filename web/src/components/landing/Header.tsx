"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { GITHUB_URL } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-mono text-sm font-medium tracking-tight text-heading"
        >
          dECODED
        </Link>

        <nav className="flex items-center gap-5">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-sm text-muted transition-colors hover:text-heading sm:block"
          >
            GitHub
          </a>
          <button
            type="button"
            onClick={() => signIn("google")}
            className="text-sm text-muted transition-colors hover:text-heading"
          >
            Sign in
          </button>
          <a
            href="#beta"
            className="text-sm text-heading transition-colors hover:text-white"
          >
            Join beta
          </a>
        </nav>
      </div>
    </header>
  );
}
