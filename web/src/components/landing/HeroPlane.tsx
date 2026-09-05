export function HeroPlane() {
  return (
    <div
      className="hero-plane pointer-events-none fixed inset-0 z-[2] overflow-hidden"
      aria-hidden
    >
      <div className="hero-plane__fly">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/plane.png?v=2"
          alt=""
          width={1453}
          height={678}
          decoding="async"
          className="hero-plane__img h-auto w-[min(44vw,220px)] md:w-[min(32vw,300px)]"
        />
      </div>
    </div>
  );
}
