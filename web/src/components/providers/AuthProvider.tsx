"use client";

import { SessionProvider } from "next-auth/react";

/** Keep session fresh while tab is open — production default. */
const REFETCH_SEC = 5 * 60;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={REFETCH_SEC} refetchOnWindowFocus>
      {children}
    </SessionProvider>
  );
}
