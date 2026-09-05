import { existsSync } from "node:fs";
import path from "node:path";
import { LiveGif } from "@/components/landing/LiveGif";

type DemoClipProps = {
  className?: string;
  /** Unique per placement so two copies of demo.gif both play. */
  instance?: string;
};

export function DemoClip({ className, instance = "hero" }: DemoClipProps) {
  const proof = path.join(process.cwd(), "public", "mistral-cache.gif");
  const demo = path.join(process.cwd(), "public", "demo.gif");
  const mp4 = path.join(process.cwd(), "public", "demo.mp4");
  const useProof = existsSync(proof);
  const hasGif = useProof || existsSync(demo);
  const hasMp4 = existsSync(mp4);
  if (!hasGif && !hasMp4) {
    return <div aria-hidden className="hidden md:block" />;
  }

  const src = useProof
    ? `/mistral-cache.gif?v=3&clip=${instance}`
    : `/demo.gif?clip=${instance}`;
  const alt = useProof
    ? "Windows PowerShell: decoded proxy on the left, Mistral cache probe on the right"
    : "Mac Terminal: decoded on the left, Claude Code on the right, then /stats";

  return (
    <div
      className={`hidden md:flex md:items-center md:justify-end ${className ?? ""}`}
    >
      {hasGif ? (
        <LiveGif
          src={src}
          alt={alt}
          className="w-full max-w-xl rounded-xl border border-[#f7f1e6]/20 bg-[#0b1020] shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          width={960}
          height={640}
        />
      ) : (
        <video
          className="w-full max-w-md rounded-xl border border-[#f7f1e6]/20 bg-transparent shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          autoPlay
          muted
          loop
          playsInline
          controls={false}
          aria-label="Wrayle running under Claude Code"
        >
          <source src="/demo.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
}
