import Image from "next/image";

export function HeroBackground() {
  return (
    <div className="hero-sky pointer-events-none absolute inset-0 overflow-hidden">
      <Image
        src="/sky.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="hero-sky__img sky-print object-cover object-[50%_42%]"
      />
    </div>
  );
}