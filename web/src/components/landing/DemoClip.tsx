import { LiveGif } from "@/components/landing/LiveGif";

/** Landing hero/season clip — same asset locally and on Vercel (no build-time fs checks). */
const LANDING_DEMO_GIF = "/mistral-cache.gif";
const LANDING_DEMO_ALT =
  "Windows PowerShell: decoded proxy on the left, Mistral cache probe on the right";

type DemoClipProps = {
  className?: string;
  /** Unique per placement so two copies of the same GIF both animate. */
  instance?: string;
};

export function DemoClip({ className, instance = "hero" }: DemoClipProps) {
  const src = `${LANDING_DEMO_GIF}?v=5&clip=${instance}`;

  return (
    <div
      className={`hidden md:flex md:items-center md:justify-end ${className ?? ""}`}
    >
      <LiveGif
        src={src}
        alt={LANDING_DEMO_ALT}
        className="w-full max-w-xl rounded-xl border border-[#f7f1e6]/20 bg-[#0b1020] shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
        width={960}
        height={640}
      />
    </div>
  );
}
