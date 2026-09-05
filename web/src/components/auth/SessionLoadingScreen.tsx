"use client";

import { AuthFlowBackdrop } from "@/components/auth/AuthFlowBackdrop";
import { AuthFlowStatus } from "@/components/auth/AuthFlowStatus";

/** Full-screen loading step after Google returns — matches OAuth overlay layout. */
export function SessionLoadingScreen() {
  return (
    <div className="auth-flow-overlay sky-scroll fixed inset-0 z-10 flex items-center justify-center">
      <AuthFlowBackdrop />
      <AuthFlowStatus
        label="SIGNING YOU IN"
        title="Securing your session…"
        subtitle="Welcome aboard — almost there"
      />
    </div>
  );
}
