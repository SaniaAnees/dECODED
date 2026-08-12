"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";

const GITHUB_URL = "https://github.com/SaniaAnees/dECODED";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#22262b] bg-[#0b0c0e]/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-mono text-sm font-semibold tracking-tight text-[#f4f4f5]"
        >
          dECODED
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6">
          <a
            href="#setup"
            className="hidden text-sm text-[#9ca3af] transition-colors hover:text-[#f4f4f5] sm:block"
          >
            Docs
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-sm text-[#9ca3af] transition-colors hover:text-[#f4f4f5] sm:block"
          >
            GitHub
          </a>
          <button
            type="button"
            onClick={() => signIn("google")}
            className="text-sm text-[#9ca3af] transition-colors hover:text-[#f4f4f5]"
          >
            Sign In
          </button>
          <a
            href="#beta"
            className="rounded-md border border-[#22262b] bg-[#121316] px-3.5 py-1.5 text-sm text-[#e4e4e7] transition-colors hover:border-[#3f3f46] hover:bg-[#181a1f]"
          >
            Join Beta
          </a>
        </nav>
      </div>
    </header>
  );
}
