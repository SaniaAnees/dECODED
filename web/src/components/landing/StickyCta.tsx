"use client";

import { useEffect, useState } from "react";

export function StickyCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById("hero");
      const threshold = hero ? hero.offsetHeight - 64 : 420;
      setShow(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/90 p-3 backdrop-blur-md md:hidden">
      <a
        href="#start"
        className="block bg-moon py-3 text-center font-serif text-[15px] text-white"
      >
        Join the list
      </a>
    </div>
  );
}
