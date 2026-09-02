"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function BetaForm({
  submitLabel = "Join the list",
}: {
  submitLabel?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "joined" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === "saving") return;
    setStatus("saving");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Could not save that email.");
        return;
      }
      setStatus("joined");
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  };

  if (status === "joined") {
    return (
      <p className="font-serif text-lg italic text-gilt">
        You&apos;re on the list.
      </p>
    );
  }

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={handleJoin} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          aria-invalid={status === "error"}
          className={cn(
            "flex-1 border border-line bg-ink/70 px-4 py-3 font-serif text-base text-moon",
            "placeholder:text-dusk outline-none",
            "focus:border-gilt/60"
          )}
        />
        <button
          type="submit"
          disabled={status === "saving"}
          className="bg-moon px-6 py-3 font-serif text-[15px] text-canvas transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : submitLabel}
        </button>
      </form>
      {message ? (
        <p className="mt-3 font-serif text-sm text-[#d4a08a]">{message}</p>
      ) : null}
    </div>
  );
}
