/** Light sky backdrop — matches main site, not dark galaxy. */
export function AuthFlowBackdrop() {
  return (
    <div
      aria-hidden
      className="auth-flow-backdrop auth-flow-backdrop--sky pointer-events-none fixed inset-0 overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/sky.jpg"
        alt=""
        className="hero-sky__img sky-print h-full w-full object-cover object-[50%_42%]"
      />
      <div className="auth-flow-backdrop__sky-wash absolute inset-0" />
      <div className="auth-flow-backdrop__sky-sparkle absolute inset-0" />
    </div>
  );
}
