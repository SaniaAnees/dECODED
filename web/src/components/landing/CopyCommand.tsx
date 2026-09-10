"use client";

import { useState, type CSSProperties } from "react";
import { SETUP_CMD } from "@/lib/site";
import { cn } from "@/lib/utils";

export function CopyCommand({
  text,
  label = "Copy",
  className,
  style,
}: {
  text?: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text ?? SETUP_CMD);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard can fail in insecure contexts */
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn("transition-colors", className)}
      style={style}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
