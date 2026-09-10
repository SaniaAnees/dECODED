"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CONTACT_EMAIL, PLAN_PAID, SIGN_IN_URL } from "@/lib/site";

type CheckoutBootstrap = {
  keyId: string;
  subscriptionId: string;
  name: string;
  description: string;
};

type BillingStatus = {
  plan: string;
  status: string;
};

type RazorpayHandlerResponse = {
  razorpay_payment_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature?: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
  theme?: { color?: string };
  prefill?: { email?: string; name?: string };
};

type RazorpayInstance = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

const POLL_MS = 2000;
const POLL_TIMEOUT_MS = 60_000;

async function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-razorpay-checkout="1"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Razorpay script failed")),
        { once: true },
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpayCheckout = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay script failed"));
    document.body.appendChild(script);
  });
}

async function fetchBillingStatus(): Promise<BillingStatus | null> {
  const res = await fetch("/api/billing/status", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("status_failed");
  return (await res.json()) as BillingStatus;
}

function signInHref(): string {
  const base = SIGN_IN_URL.replace(/\/$/, "");
  const callback = `${typeof window !== "undefined" ? window.location.origin : ""}/pricing`;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}callbackUrl=${encodeURIComponent(callback)}`;
}

const btnBase =
  "mt-6 inline-flex h-11 w-full items-center justify-center rounded-md border font-serif text-[16px] transition-colors disabled:cursor-not-allowed disabled:opacity-60";
const btnPro =
  `${btnBase} border-gilt/60 bg-gilt/15 text-moon hover:border-gilt hover:bg-gilt/25`;
const btnFree =
  `${btnBase} border-line bg-transparent text-moon hover:border-gilt/50 hover:bg-ink/40`;

export function PricingCheckoutActions() {
  const { data: session, status: authStatus } = useSession();
  const [plan, setPlan] = useState<"free" | "pro" | "unknown">("unknown");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<
    "idle" | "starting" | "checkout" | "confirming" | "done" | "timeout" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const refreshPlan = useCallback(async () => {
    if (authStatus !== "authenticated") {
      setPlan("free");
      return;
    }
    try {
      const status = await fetchBillingStatus();
      if (!status) {
        setPlan("free");
        return;
      }
      setPlan(status.plan === "pro" ? "pro" : "free");
    } catch {
      setPlan("free");
    }
  }, [authStatus]);

  useEffect(() => {
    void refreshPlan();
  }, [refreshPlan]);

  const pollUntilPro = useCallback(async (paidId: string | null) => {
    setPhase("confirming");
    setMessage("Payment received — confirming Pro…");
    const started = Date.now();
    while (Date.now() - started < POLL_TIMEOUT_MS) {
      try {
        const status = await fetchBillingStatus();
        if (status?.plan === "pro") {
          setPlan("pro");
          setPhase("done");
          setMessage(`You're on ${PLAN_PAID.name}.`);
          return;
        }
      } catch {
        // keep polling
      }
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
    setPhase("timeout");
    setMessage(
      paidId
        ? `Payment received but Pro is not unlocked yet. Email ${CONTACT_EMAIL} with Razorpay payment id ${paidId}.`
        : `Payment received but Pro is not unlocked yet. Email ${CONTACT_EMAIL} with your Razorpay payment id.`,
    );
  }, []);

  const startCheckout = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    setPhase("starting");
    setPaymentId(null);

    try {
      const res = await fetch("/api/razorpay/subscribe", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as {
        error?: string;
        code?: string;
        keyId?: string;
        subscriptionId?: string;
        name?: string;
        description?: string;
      };

      if (res.status === 401) {
        window.location.href = signInHref();
        return;
      }

      if (data.code === "already_pro") {
        setPlan("pro");
        setPhase("done");
        setMessage(`You're on ${PLAN_PAID.name}.`);
        return;
      }

      if (!res.ok || !data.keyId || !data.subscriptionId) {
        setPhase("error");
        setMessage(data.error || "Could not start checkout.");
        return;
      }

      const bootstrap: CheckoutBootstrap = {
        keyId: data.keyId,
        subscriptionId: data.subscriptionId,
        name: data.name || "usecoded",
        description: data.description || "Pro",
      };

      await loadRazorpayScript();
      if (!window.Razorpay) {
        setPhase("error");
        setMessage("Checkout failed to load. Refresh and try again.");
        return;
      }

      setPhase("checkout");
      const rzp = new window.Razorpay({
        key: bootstrap.keyId,
        subscription_id: bootstrap.subscriptionId,
        name: bootstrap.name,
        description: bootstrap.description,
        prefill: {
          email: session?.user?.email || undefined,
          name: session?.user?.name || undefined,
        },
        theme: { color: "#c4a574" },
        handler: (response) => {
          const id = response.razorpay_payment_id || null;
          setPaymentId(id);
          // Never write Pro in the browser — poll the server.
          void pollUntilPro(id);
        },
        modal: {
          ondismiss: () => {
            setPhase("idle");
            setBusy(false);
            setMessage(null);
          },
        },
      });
      rzp.open();
    } catch {
      setPhase("error");
      setMessage("Could not start checkout. Try again.");
      setBusy(false);
    }
  }, [busy, pollUntilPro, session?.user?.email, session?.user?.name]);

  useEffect(() => {
    if (phase === "done" || phase === "timeout" || phase === "error") {
      setBusy(false);
    }
  }, [phase]);

  if (authStatus === "loading" || plan === "unknown") {
    return (
      <button type="button" disabled className={btnPro}>
        Loading…
      </button>
    );
  }

  if (plan === "pro") {
    return (
      <div>
        <button type="button" disabled className={btnPro}>
          You&apos;re on Pro
        </button>
        {message ? (
          <p className="mt-3 text-center font-serif text-sm text-mist">{message}</p>
        ) : null}
      </div>
    );
  }

  if (authStatus !== "authenticated") {
    return (
      <a href={signInHref()} className={btnPro}>
        Upgrade to Pro
      </a>
    );
  }

  const label =
    phase === "starting"
      ? "Starting checkout…"
      : phase === "confirming"
        ? "Confirming…"
        : phase === "checkout"
          ? "Checkout open…"
          : "Upgrade to Pro";

  return (
    <div>
      <button
        type="button"
        className={btnPro}
        disabled={busy || phase === "confirming"}
        onClick={() => void startCheckout()}
      >
        {label}
      </button>
      {message ? (
        <p
          className={
            phase === "error" || phase === "timeout"
              ? "mt-3 text-center font-serif text-sm text-red-200/90"
              : "mt-3 text-center font-serif text-sm text-mist"
          }
        >
          {message}
          {phase === "timeout" && paymentId ? (
            <>
              {" "}
              <span className="font-mono text-[12px]">{paymentId}</span>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

export function StartFreeButton() {
  const { status } = useSession();
  if (status === "authenticated") {
    return (
      <a href="/" className={btnFree}>
        Continue free
      </a>
    );
  }
  return (
    <a href={signInHref()} className={btnFree}>
      Start free
    </a>
  );
}
