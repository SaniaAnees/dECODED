"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function BetaForm() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setJoined(true);
  };

  if (joined) {
    return (
      <p className="max-w-2xl text-sm text-accent">You&apos;re on the list.</p>
    );
  }

  return (
    <form
      onSubmit={handleJoin}
      className="flex max-w-2xl flex-col gap-2 sm:flex-row"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        required
        className={cn(
          "flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-heading",
          "placeholder:text-muted/70 outline-none",
          "focus:border-[#3f3f46]"
        )}
      />
      <button
        type="submit"
        className="rounded-lg border border-border bg-transparent px-5 py-2.5 text-sm font-medium text-heading transition-colors hover:border-[#3f3f46] hover:bg-surface"
      >
        Join beta
      </button>
    </form>
  );
}
