export function SignInPanelPlane() {
  return (
    <div
      className="auth-panel-plane pointer-events-none absolute inset-0 z-[5] overflow-hidden"
      aria-hidden
    >
      <div className="auth-panel-plane__fly">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/plane.png?v=2"
          alt=""
          width={1453}
          height={678}
          decoding="async"
          className="auth-panel-plane__img h-auto w-[min(56vw,220px)] md:w-[min(30vw,280px)]"
        />
      </div>
    </div>
  );
}
