"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { SessionLoadingScreen } from "@/components/auth/SessionLoadingScreen";
import { displayNameFromUser } from "@/lib/display-name";
import { UserAvatar } from "@/lib/user-avatar";
import { BrandMark } from "@/components/landing/BrandMark";
import { SIGN_IN_URL } from "@/lib/site";

const HOLD_MS = 3800;
const EXIT_MS = 900;

type FlowPhase = "loading" | "enter" | "hold" | "exit";

export function WelcomeScreen() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [phase, setPhase] = useState<FlowPhase>("loading");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;

    setPhase("enter");
    const enterTimer = window.setTimeout(() => setPhase("hold"), 700);

    const holdTimer = window.setTimeout(() => setPhase("exit"), HOLD_MS);
    const exitTimer = window.setTimeout(
      () => router.replace("/"),
      HOLD_MS + EXIT_MS,
    );

    const started = performance.now();
    const total = HOLD_MS + EXIT_MS;
    let frame = 0;

    const tick = (now: number) => {
      setProgress(Math.min(100, ((now - started) / total) * 100));
      if (now - started < total) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      cancelAnimationFrame(frame);
    };
  }, [status, router]);

  const shellClass = [
    "auth-welcome-shell relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center",
    phase === "enter" || phase === "hold" ? "auth-welcome-shell--visible" : "",
    phase === "exit" ? "auth-welcome-shell--exit" : "",
  ].join(" ");

  if (status === "loading" || (status === "authenticated" && phase === "loading")) {
    return <SessionLoadingScreen />;
  }

  if (status === "unauthenticated") {
    return (
      <div className="sky-scroll relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="font-serif text-xl text-moon">Session expired.</p>
        <Link
          href={SIGN_IN_URL}
          className="mt-6 font-serif text-[15px] text-gilt hover:text-moon"
        >
          Sign in again
        </Link>
      </div>
    );
  }

  const user = session!.user;
  const name = displayNameFromUser(user);

  return (
    <div className={`sky-scroll ${shellClass}`}>
      <div className="auth-welcome-card mx-auto w-full max-w-md px-8 py-10 md:px-10 md:py-12">
        <div className="auth-welcome-item auth-welcome-item--1 mx-auto w-fit">
          <UserAvatar
            src={user.image}
            name={name}
            size={80}
            className="ring-2 ring-[#e4b45c]/50"
          />
        </div>

        <div className="auth-welcome-item auth-welcome-item--2 mt-8">
          <BrandMark className="mx-auto h-14 w-14" />
        </div>
        <p className="auth-welcome-item auth-welcome-item--2 mt-5 font-mono text-[11px] tracking-[0.34em] text-gilt">
          WELCOME TO WRAYLE
        </p>
        <h1
          className="auth-welcome-item auth-welcome-item--3 mt-4 font-serif text-4xl font-medium leading-tight text-moon md:text-[2.75rem]"
          style={{ textShadow: "0 2px 18px rgba(8,14,32,0.35)" }}
        >
          Welcome, {name}
        </h1>
        {user.email ? (
          <p className="auth-welcome-item auth-welcome-item--4 mt-3 font-mono text-[12px] tracking-[0.06em] text-mist">
            {user.email}
          </p>
        ) : null}
        <p className="auth-welcome-item auth-welcome-item--5 mt-8 font-serif text-[16px] leading-relaxed text-mist">
          {phase === "exit"
            ? "See you on the other side…"
            : "Your account is ready. Gliding you home…"}
        </p>

        <div className="auth-welcome-item auth-welcome-item--6 mt-10 h-[2px] w-full overflow-hidden rounded-full bg-white/25">
          <div
            className="auth-welcome-progress h-full rounded-full bg-gradient-to-r from-[#e4b45c] to-[#f7f1e6]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {phase !== "exit" ? (
          <Link
            href="/"
            className="auth-welcome-item auth-welcome-item--7 mt-8 inline-block font-serif text-[15px] text-gilt transition-colors hover:text-moon"
          >
            Continue now →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
