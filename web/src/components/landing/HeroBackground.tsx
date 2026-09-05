export function HeroBackground() {
  return (
    <div className="hero-sky pointer-events-none absolute inset-0 overflow-hidden">
      {/* Plain img — matches localhost dev and avoids Next/Image WebP drift on Vercel. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/sky.jpg"
        alt=""
        decoding="async"
        className="hero-sky__img sky-print h-full w-full object-cover object-[50%_42%]"
      />
    </div>
  );
}