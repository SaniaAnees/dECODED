"use client";

import { useEffect, useRef, useState } from "react";
import type { AuthProviderId } from "@/lib/auth-status";
import { OAuthProviderIcon } from "@/components/auth/OAuthProviderIcon";

const CLICK_FEEDBACK_MS = 320;

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

  return (
    <button
      type="button"
      disabled={!ready || disabled || phase !== "idle"}
      onClick={async () => {
        if (!ready || disabled || phase !== "idle") return;
        setPhase("pressed");
        await new Promise((resolve) => setTimeout(resolve, CLICK_FEEDBACK_MS));
        setPhase("launching");
        await onLaunch();
      }}
      className={[
        "oauth-btn group relative flex w-full items-center gap-3 overflow-hidden rounded-lg border px-4 py-3.5 font-serif text-[15px] transition-all duration-200",
        ready
          ? "border-white/30 bg-white/15 text-[#f7f1e6] backdrop-blur-sm hover:border-white/45 hover:bg-white/22"
          : "cursor-not-allowed border-white/15 bg-white/8 text-[#f7f1e6]/40",
        phase === "pressed"
          ? "oauth-btn--pressed scale-[0.97] border-[#e4b45c]/60 bg-white/28 shadow-[0_0_0_3px_rgba(228,180,92,0.25)]"
          : "",
        phase === "launching"
          ? "oauth-btn--launching scale-[0.98] border-[#e4b45c]/50 bg-white/25"
          : "",
      ].join(" ")}
    >
      <span
        aria-hidden
        className={[
          "oauth-btn__ripple pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent",
          phase === "pressed" ? "oauth-btn__ripple--active" : "",
        ].join(" ")}
      />

      <span
        className={[
          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform duration-200",
          phase === "pressed" ? "scale-110" : "group-hover:scale-105",
          phase === "launching" ? "scale-95" : "",
        ].join(" ")}
      >
        {phase === "launching" ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#1c2340]/20 border-t-[#1c2340]" />
        ) : (
          <OAuthProviderIcon provider={provider} className="h-[18px] w-[18px]" />
        )}
      </span>

      <span className="relative z-10 flex-1 text-left">
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
