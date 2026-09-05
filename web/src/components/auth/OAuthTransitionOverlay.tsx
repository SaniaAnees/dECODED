"use client";

import { AuthFlowBackdrop } from "@/components/auth/AuthFlowBackdrop";
import { AuthFlowStatus } from "@/components/auth/AuthFlowStatus";
import type { AuthProviderId } from "@/lib/auth-status";
import { OAuthProviderIcon } from "@/components/auth/OAuthProviderIcon";

export function OAuthTransitionOverlay({
  provider,
  providerLabel,
}: {
  provider: AuthProviderId;
  providerLabel: string;
}) {
  return (
    <div className="auth-flow-overlay sky-scroll fixed inset-0 z-50 flex items-center justify-center">
      <AuthFlowBackdrop />
      <AuthFlowStatus
        label="CONNECTING"
        title={`Opening ${providerLabel}…`}
        subtitle="You'll return here automatically"
        visual={
          <div className="oauth-overlay-icon mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <OAuthProviderIcon provider={provider} className="h-8 w-8" />
          </div>
        }
      />
    </div>
  );
}
