export function HeroPlane() {
  return (
    <div
      className="hero-plane pointer-events-none fixed inset-0 z-[2] overflow-hidden"
      aria-hidden
    >
      <div className="hero-plane__fly">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/plane.webp"
          alt=""
          width={640}
          height={299}
          decoding="async"
          fetchPriority="low"
          className="hero-plane__img h-auto w-[min(44vw,220px)] md:w-[min(32vw,300px)]"
        />
      </div>
    </div>
  );
}
