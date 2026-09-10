"use client";

import { useEffect, useRef, useState } from "react";
import type { AuthProviderId } from "@/lib/auth-status";
import { OAuthProviderIcon } from "@/components/auth/OAuthProviderIcon";

/** Let the golden sweep finish before OAuth redirect. */
const RIPPLE_MS = 520;

export function OAuthButton({
  provider,
  label,
  ready,
  disabled,
  onLaunch,
}: {
  provider: AuthProviderId;
  label: string;
  ready: boolean;
  disabled: boolean;
  onLaunch: () => Promise<void>;
}) {
  const [phase, setPhase] = useState<"idle" | "pressed" | "launching">("idle");
  const wasDisabled = useRef(false);

  useEffect(() => {
    if (wasDisabled.current && !disabled) setPhase("idle");
    wasDisabled.current = disabled;
  }, [disabled]);

  const idle = phase === "idle";

  return (
    <button
      type="button"
      disabled={!ready || disabled || !idle}
      onClick={async () => {
        if (!ready || disabled || !idle) return;
        setPhase("pressed");
        await new Promise((resolve) => setTimeout(resolve, RIPPLE_MS));
        setPhase("launching");
        await onLaunch();
      }}
      className={[
        "oauth-btn group relative flex w-full items-center gap-3 overflow-hidden rounded-lg border px-4 py-3.5 font-serif text-[15px] transition-all duration-200",
        ready
          ? "border-white/30 bg-white/12 text-[#f7f1e6] backdrop-blur-sm"
          : "cursor-not-allowed border-white/15 bg-white/8 text-[#f7f1e6]/40",
        phase === "pressed"
          ? "oauth-btn--pressed scale-[0.98] border-[#e4b45c]/70 bg-white/30 shadow-[0_0_0_3px_rgba(228,180,92,0.28)]"
          : "",
        phase === "launching"
          ? "oauth-btn--launching scale-[0.99] border-[#e4b45c]/60 bg-white/26"
          : "",
      ].join(" ")}
    >
      {idle ? (
        <span aria-hidden className="oauth-btn__hover-sweep pointer-events-none absolute inset-y-0 left-0 w-full" />
      ) : null}

      <span
        aria-hidden
        className={[
          "oauth-btn__ripple pointer-events-none absolute inset-y-0 left-0 w-full",
          phase === "pressed" || phase === "launching"
            ? "oauth-btn__ripple--active"
            : "",
        ].join(" ")}
      />

      <span
        className={[
          "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-200",
          phase === "pressed" ? "scale-110 shadow-md" : "group-hover:scale-105 group-hover:shadow-md",
          phase === "launching" ? "scale-95" : "",
        ].join(" ")}
      >
        {phase === "launching" ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#1c2340]/20 border-t-[#1c2340]" />
        ) : (
          <OAuthProviderIcon provider={provider} className="h-[20px] w-[20px]" />
        )}
      </span>

      <span className="relative z-10 flex-1 text-left transition-colors duration-200 group-hover:text-white">
        {phase === "launching"
          ? `Opening ${label.replace("Continue with ", "")}…`
          : label}
      </span>

      {phase === "launching" ? (
        <span className="relative z-10 font-mono text-[10px] tracking-[0.14em] text-[#e4b45c]">
          →
        </span>
      ) : null}
    </button>
  );
}
