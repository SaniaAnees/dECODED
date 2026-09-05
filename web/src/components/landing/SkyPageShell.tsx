import { HeroBackground } from "@/components/landing/HeroBackground";
import { HeroPlane } from "@/components/landing/HeroPlane";

export function SkyPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="sky-backdrop pointer-events-none fixed inset-0 overflow-hidden">
        <HeroBackground />
      </div>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,18,40,0.18) 0%, rgba(10,18,40,0.08) 55%, rgba(10,18,40,0.14) 100%)",
        }}
      />
      <HeroPlane />
      {children}
    </div>
  );
}
