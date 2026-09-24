import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Marks a block for the scroll-linked entrance defined in globals.css. The
 * resting state is fully visible, so this is safe with JavaScript disabled and
 * with motion reduced. Server component, no runtime cost.
 */
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("about-reveal", className)}>{children}</div>;
}
