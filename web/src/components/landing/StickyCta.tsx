"use client";

import { useEffect, useState } from "react";
import { SETUP_CMD } from "@/lib/site";
import { cn } from "@/lib/utils";

export function StickyCta() {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById("hero");
      const threshold = hero ? hero.offsetHeight - 64 : 420;
      setShow(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SETUP_CMD);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard can fail in insecure contexts */
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-canvas/95 p-3 backdrop-blur-md md:hidden">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "flex-1 rounded-lg py-2.5 text-sm font-medium",
            copied ? "bg-accent text-canvas" : "bg-heading text-canvas"
          )}
        >
          {copied ? "Copied" : "Copy setup"}
        </button>
        <a
          href="#beta"
          className="flex-1 rounded-lg border border-border py-2.5 text-center text-sm font-medium text-heading"
        >
          Join beta
        </a>
      </div>
    </div>
  );
}
