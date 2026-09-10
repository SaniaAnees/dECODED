"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TOPICS = [
  { value: "", label: "Topic (optional)" },
  { value: "bug", label: "Bug" },
  { value: "idea", label: "Idea" },
  { value: "billing", label: "Billing" },
  { value: "other", label: "Other" },
] as const;

const fieldClass =
  "w-full rounded-xl border border-line bg-transparent px-3 py-2.5 font-serif text-sm text-moon outline-none placeholder:text-dusk focus:border-moon/40";

export function FeedbackForm() {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (emailTouched) return;
    const fromSession = session?.user?.email?.trim();
    if (fromSession) setEmail(fromSession);
  }, [session?.user?.email, emailTouched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "saving") return;

    const value = email.trim().toLowerCase();
    const text = message.trim();
    if (!EMAIL.test(value)) {
      setError("Enter a valid email.");
      setStatus("error");
      return;
    }
    if (!text) {
      setError("Enter a message.");
      setStatus("error");
      return;
    }

    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value,
          topic: topic || undefined,
          message: text,
          page: "/feedback",
          company,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
      };
      if (!res.ok) {
        setError(data.error ?? "Couldn’t send — try again.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError("Couldn’t send — try again.");
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <p className="font-serif text-base italic leading-relaxed text-gilt">
        Thanks — I’ll get back to you by email.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex flex-col gap-4"
      noValidate
    >
      {/* Honeypot — leave empty */}
      <div className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="feedback-company">Company</label>
        <input
          id="feedback-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <div>
        <label
          htmlFor="feedback-email"
          className="mb-1.5 block font-mono text-[11px] tracking-[0.18em] text-gilt"
        >
          EMAIL
        </label>
        <input
          id="feedback-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={320}
          value={email}
          onChange={(e) => {
            setEmailTouched(true);
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          className={fieldClass}
        />
      </div>

      <div>
        <label
          htmlFor="feedback-topic"
          className="mb-1.5 block font-mono text-[11px] tracking-[0.18em] text-gilt"
        >
          TOPIC
        </label>
        <select
          id="feedback-topic"
          name="topic"
          autoComplete="off"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className={cn(fieldClass, "appearance-none pr-8")}
        >
          {TOPICS.map((t) => (
            <option
              key={t.value || "none"}
              value={t.value}
              className="bg-[#0a1228] text-[#f7f1e6]"
            >
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="feedback-message"
          className="mb-1.5 block font-mono text-[11px] tracking-[0.18em] text-gilt"
        >
          MESSAGE
        </label>
        <textarea
          id="feedback-message"
          name="message"
          required
          rows={6}
          maxLength={5000}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          className={cn(fieldClass, "resize-y min-h-[9rem]")}
        />
      </div>

      {status === "error" && error ? (
        <p role="alert" className="font-serif text-sm italic text-gilt">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "saving"}
        className="mt-1 self-start rounded-xl border border-line bg-ink/40 px-5 py-2.5 font-serif text-sm italic text-moon transition-colors hover:border-moon/35 hover:bg-ink/55 disabled:opacity-60"
      >
        {status === "saving" ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
