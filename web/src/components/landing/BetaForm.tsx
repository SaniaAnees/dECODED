"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function BetaForm({
  submitLabel = "Request access",
  success = "You're on the list.",
  variant = "page",
}: {
  submitLabel?: string;
  success?: string;
  variant?: "page" | "hero";
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "joined" | "error">(
    "idle"
  );

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL.test(value) || status === "saving") return;
    setStatus("saving");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) {
        setStatus("idle");
        return;
      }
      setStatus("joined");
    } catch {
      setStatus("idle");
    }
  };

  const hero = variant === "hero";
  const typing = email.length > 0;

  if (status === "joined") {
    return (
      <p
        className={cn(
          "waitlist-joined flex min-h-[2.5rem] items-center font-serif text-base italic",
          hero ? "text-[#f1e6c8]" : "text-gilt"
        )}
      >
        {success}
      </p>
    );
  }

  return (
    <form onSubmit={handleJoin}>
      <div
        className={cn(
          "relative flex w-[20rem] items-center rounded-xl border bg-transparent",
          hero
            ? "border-[#f7f1e6]/28 focus-within:border-[#f7f1e6]/55"
            : "border-line focus-within:border-moon/40"
        )}
      >
        <label htmlFor="waitlist-email" className="sr-only">
          Email
        </label>
        <LiveHint visible={!typing} hero={hero} />
        <input
          id="waitlist-email"
          type="text"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={cn(
            "relative z-10 min-w-0 flex-1 bg-transparent py-2 pl-3 pr-2 font-serif text-sm outline-none",
            hero ? "caret-[#f7f1e6] text-[#f7f1e6]" : "text-moon"
          )}
        />
        <button
          type="submit"
          disabled={status === "saving"}
          className={cn(
            "relative z-20 shrink-0 bg-transparent px-3 py-2 font-serif text-sm italic disabled:opacity-60",
            hero
              ? "text-[#f7f1e6]/70 hover:text-[#f7f1e6]"
              : "text-moon/70 hover:text-moon"
          )}
        >
          {status === "saving" ? "Sending…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function LiveHint({ visible, hero }: { visible: boolean; hero: boolean }) {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDots(3);
      return;
    }
    const id = window.setInterval(() => {
      setDots((n) => (n + 1) % 7);
    }, 380);
    return () => window.clearInterval(id);
  }, [visible]);

  if (!visible) return null;

  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 left-0 right-24 z-0 flex items-center px-3 font-serif text-sm",
        hero ? "text-[#f7f1e6]/35" : "text-dusk"
      )}
    >
      join the waitlist{dots > 0 ? ".".repeat(dots) : ""}
    </span>
  );
}
