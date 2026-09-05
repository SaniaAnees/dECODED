"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { displayNameFromUser } from "@/lib/display-name";
import { UserAvatar } from "@/lib/user-avatar";

export function UserProfileMenu({ user }: { user: Session["user"] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const name = displayNameFromUser(user);

  useEffect(() => {
    if (!open) return;

    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 py-1 pl-1 pr-3 backdrop-blur-md transition-colors hover:border-white/35 hover:bg-white/15"
      >
        <UserAvatar
          src={user.image}
          name={name}
          size={32}
          className="rounded-full ring-1 ring-white/25"
        />
        <span className="max-w-[7rem] truncate font-serif text-[14px] text-white/95">
          {name}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className={`h-3 w-3 text-white/60 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[11rem] overflow-hidden rounded-lg border border-white/15 bg-[#0c1428]/95 py-1 shadow-xl backdrop-blur-xl"
        >
          <div className="border-b border-white/10 px-3 py-2.5">
            <p className="truncate font-serif text-[13px] text-white/95">{name}</p>
            {user.email ? (
              <p className="mt-0.5 truncate font-mono text-[10px] text-white/45">
                {user.email}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full px-3 py-2.5 text-left font-serif text-[14px] text-white/75 transition-colors hover:bg-white/5 hover:text-white"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
