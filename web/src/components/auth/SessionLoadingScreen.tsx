"use client";

import { AuthFlowStatus } from "@/components/auth/AuthFlowStatus";

/** After Google returns — content only; parent page supplies SkyPageShell. */
export function SessionLoadingScreen() {
  return (
    <div className="sky-scroll relative z-10 flex min-h-screen items-center justify-center">
      <AuthFlowStatus
        label="SIGNING YOU IN"
        title="Securing your session…"
        subtitle="Welcome aboard — almost there"
      />
    </div>
  );
}
