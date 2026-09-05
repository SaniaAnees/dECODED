import type { ReactNode } from "react";
import { AuthFlowPlane } from "@/components/auth/AuthFlowPlane";

export function AuthFlowStatus({
  label,
  title,
  subtitle,
  visual,
}: {
  label: string;
  title: string;
  subtitle: string;
  /** Defaults to the Wrayle plane. Pass e.g. Google icon for OAuth step. */
  visual?: ReactNode;
}) {
  return (
    <div className="auth-flow-overlay__content relative z-10 px-8 text-center">
      {visual ?? <AuthFlowPlane />}
      <p className="font-mono text-[11px] tracking-[0.32em] text-[#e4b45c]">
        {label}
      </p>
      <p
        className="mt-3 font-serif text-2xl text-[#f7f1e6] md:text-[1.75rem]"
        style={{ textShadow: "0 2px 16px rgba(8,14,32,0.45)" }}
      >
        {title}
      </p>
      <p className="mt-2 font-serif text-[15px] text-[#f7f1e6]/70">{subtitle}</p>
      <div className="mx-auto mt-8 h-1 w-32 overflow-hidden rounded-full bg-white/20">
        <div className="oauth-overlay-bar h-full w-1/3 rounded-full bg-[#e4b45c]" />
      </div>
    </div>
  );
}
