/** Centered Wrayle plane — gentle hover for auth loading screens. */
export function AuthFlowPlane() {
  return (
    <div className="auth-flow-plane mx-auto mb-6" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/plane.png?v=2"
        alt=""
        width={1453}
        height={678}
        decoding="async"
        className="auth-flow-plane__img h-auto w-[min(180px,42vw)] md:w-[min(220px,28vw)]"
      />
    </div>
  );
}
