import { ABOUT_DEMO_VIDEO, SITE_NAME } from "@/lib/site";

/**
 * Demo slot. Drop a `src` into `ABOUT_DEMO_VIDEO` (lib/site.ts) and the
 * placeholder is replaced without touching this layout.
 */
export function DemoSlot() {
  const { src, poster } = ABOUT_DEMO_VIDEO;

  if (src) {
    return (
      <video
        className="mt-10 w-full border border-line shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
        controls
        playsInline
        preload="metadata"
        poster={poster ?? undefined}
      >
        <source src={src} type="video/mp4" />
      </video>
    );
  }

  return (
    <div className="relative mt-10 aspect-[21/9] w-full overflow-hidden border border-line bg-[rgba(8,14,32,0.55)]">
      <div aria-hidden className="about-scan absolute inset-0" />

      <svg
        aria-hidden
        focusable="false"
        viewBox="0 0 100 43"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full text-gilt/45"
      >
        <rect
          x="0.5"
          y="0.5"
          width="99"
          height="42"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          className="about-frame-draw"
        />
      </svg>

      <div className="relative flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="about-play-ring flex h-16 w-16 items-center justify-center rounded-full border border-gilt/50">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-5 w-5 translate-x-[1px] text-gilt"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        <p className="font-mono text-[12px] tracking-[0.3em] text-gilt">
          {SITE_NAME.toUpperCase()}
        </p>
        <p className="font-mono text-[11px] tracking-[0.3em] text-mist">
          DEMO COMING SOON
        </p>
      </div>
    </div>
  );
}
