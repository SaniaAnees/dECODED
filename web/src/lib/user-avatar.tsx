import type { Session } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";

type OAuthProfile = {
  name?: string | null;
  email?: string | null;
  picture?: string | null;
  image?: string | null;
};

export function profileImageFromOAuth(profile: OAuthProfile): string | null {
  return profile.picture ?? profile.image ?? null;
}

/** Merge DB user or JWT token into the client session (keeps Google avatar). */
export function mergeSessionUser(
  session: Session,
  sources: { user?: AdapterUser | null; token?: JWT | null },
): Session {
  const { user, token } = sources;

  if (user) {
    session.user.id = user.id;
    session.user.name = user.name ?? session.user.name;
    session.user.email = user.email ?? session.user.email;
    session.user.image = user.image ?? session.user.image;
  } else if (token) {
    session.user.id = token.sub ?? session.user.id;
    session.user.name = token.name ?? session.user.name;
    session.user.email = token.email ?? session.user.email;
    session.user.image = token.picture ?? session.user.image;
  }

  return session;
}

/** Google profile photos often 403 without no-referrer. */
export function UserAvatar({
  src,
  name,
  size = 32,
  className = "",
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const initial = name.charAt(0).toUpperCase();

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      className={`flex items-center justify-center rounded-full bg-white/15 font-serif text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initial}
    </span>
  );
}
