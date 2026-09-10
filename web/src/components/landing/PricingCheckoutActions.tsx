"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CONTACT_EMAIL, PLAN_PAID, SIGN_IN_URL } from "@/lib/site";

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

const POLL_MS = 1500;
const POLL_TIMEOUT_MS = 45_000;

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
  const callback =
    typeof window !== "undefined"
      ? `${window.location.origin}/pricing`
      : "/pricing";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}callbackUrl=${encodeURIComponent(callback)}`;
}

const btnBase =
  "mt-6 inline-flex h-11 w-full items-center justify-center rounded-md border font-serif text-[16px] transition-colors disabled:cursor-not-allowed disabled:opacity-60";
const btnPro = `${btnBase} border-gilt/60 bg-gilt/15 text-moon hover:border-gilt hover:bg-gilt/25`;
const btnFree = `${btnBase} border-line bg-transparent text-moon hover:border-gilt/50 hover:bg-ink/40`;

export function PricingCheckoutActions() {
  const { data: session, status: authStatus } = useSession();
  // Default Free immediately — never block first paint on billing fetch.
  const [plan, setPlan] = useState<"free" | "pro">("free");
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
      if (status?.plan === "pro") setPlan("pro");
      else setPlan("free");
    } catch {
      // keep current plan
    }
  }, [authStatus]);

  useEffect(() => {
    if (authStatus === "loading") return;
    void refreshPlan();
  }, [authStatus, refreshPlan]);

  const confirmAndPoll = useCallback(async (response: RazorpayHandlerResponse) => {
    const paidId = response.razorpay_payment_id || null;
    setPaymentId(paidId);
    setPhase("confirming");
    setMessage("Payment received — unlocking Pro…");
    setBusy(true);

    // Immediate server unlock (signature-verified) — do not wait on webhook alone.
    try {
      const confirmRes = await fetch("/api/razorpay/confirm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_subscription_id: response.razorpay_subscription_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });
      const confirmData = (await confirmRes.json()) as {
        plan?: string;
        pending?: boolean;
      };
      if (confirmData.plan === "pro") {
        setPlan("pro");
        setPhase("done");
        setMessage(null);
        setBusy(false);
        return;
      }
    } catch {
      // fall through to poll (webhook may still land)
    }

    const started = Date.now();
    while (Date.now() - started < POLL_TIMEOUT_MS) {
      try {
        const status = await fetchBillingStatus();
        if (status?.plan === "pro") {
          setPlan("pro");
          setPhase("done");
          setMessage(null);
          setBusy(false);
          return;
        }
      } catch {
        // keep polling
      }
      await new Promise((r) => setTimeout(r, POLL_MS));
    }

    // Last chance — webhook often already wrote Pro.
    try {
      const status = await fetchBillingStatus();
      if (status?.plan === "pro") {
        setPlan("pro");
        setPhase("done");
        setMessage(null);
        setBusy(false);
        return;
      }
    } catch {
      // ignore
    }

    setPhase("timeout");
    setBusy(false);
    setMessage(
      paidId
        ? `Almost there — refresh this page. If you’re still Free, email ${CONTACT_EMAIL} with payment id ${paidId}.`
        : `Almost there — refresh this page. If you’re still Free, email ${CONTACT_EMAIL} with your Razorpay payment id.`,
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
        setMessage(null);
        setBusy(false);
        return;
      }

      if (!res.ok || !data.keyId || !data.subscriptionId) {
        setPhase("error");
        setMessage(data.error || "Could not start checkout.");
        setBusy(false);
        return;
      }

      await loadRazorpayScript();
      if (!window.Razorpay) {
        setPhase("error");
        setMessage("Checkout failed to load. Refresh and try again.");
        setBusy(false);
        return;
      }

      setPhase("checkout");
      const rzp = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: data.name || "usecoded",
        description: data.description || "Pro",
        prefill: {
          email: session?.user?.email || undefined,
          name: session?.user?.name || undefined,
        },
        theme: { color: "#c4a574" },
        handler: (response) => {
          void confirmAndPoll(response);
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
  }, [busy, confirmAndPoll, session?.user?.email, session?.user?.name]);

  // Instant CTAs — no "Loading…" gate on first paint.
  if (plan === "pro") {
    return (
      <button type="button" disabled className={btnPro}>
        You&apos;re on Pro
      </button>
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
        ? "Unlocking Pro…"
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
  // Instant CTA — don’t wait on session loading.
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
