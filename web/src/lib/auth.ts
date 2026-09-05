import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { NextAuthOptions } from "next-auth";
import AppleProvider from "next-auth/providers/apple";
import AzureADProvider from "next-auth/providers/azure-ad";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { isDatabaseConfigured, getDb } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import {
  authCookiesSecure,
  getAuthCookieDomain,
  getNextAuthUrl,
} from "@/lib/auth-env";
import { getConfiguredProviders } from "@/lib/auth-status";
import { MAIN_SITE_URL } from "@/lib/site";
import {
  mergeSessionUser,
  profileImageFromOAuth,
} from "@/lib/user-avatar";
import {
  AUTH_KIND_COOKIE,
  SESSION_MAX_AGE_SEC,
  SESSION_UPDATE_AGE_SEC,
} from "@/lib/auth-session";
import { cookies } from "next/headers";

/** Database sessions unless explicitly disabled. Requires working DATABASE_URL + tables. */
export function useDatabaseSessions(): boolean {
  if (process.env.AUTH_USE_DATABASE === "false") return false;
  return isDatabaseConfigured();
}

function buildCookieOptions(): NonNullable<NextAuthOptions["cookies"]> {
  const secure = authCookiesSecure();
  const domain = getAuthCookieDomain();
  const shared = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure,
    ...(domain ? { domain } : {}),
  };

  return {
    sessionToken: {
      name: secure
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: shared,
    },
    callbackUrl: {
      name: secure
        ? "__Secure-next-auth.callback-url"
        : "next-auth.callback-url",
      options: shared,
    },
    csrfToken: {
      name: secure ? "__Host-next-auth.csrf-token" : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure,
      },
    },
    pkceCodeVerifier: {
      name: secure
        ? "__Secure-next-auth.pkce.code_verifier"
        : "next-auth.pkce.code_verifier",
      options: shared,
    },
    state: {
      name: secure ? "__Secure-next-auth.state" : "next-auth.state",
      options: shared,
    },
    nonce: {
      name: secure ? "__Secure-next-auth.nonce" : "next-auth.nonce",
      options: shared,
    },
  };
}

function buildProviders() {
  const providers = [];
  const configured = getConfiguredProviders();

  if (configured.includes("google")) {
    providers.push(
      GoogleProvider({
        clientId: process.env.AUTH_GOOGLE_ID!,
        clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      }),
    );
  }

  if (configured.includes("github")) {
    providers.push(
      GitHubProvider({
        clientId: process.env.AUTH_GITHUB_ID!,
        clientSecret: process.env.AUTH_GITHUB_SECRET!,
      }),
    );
  }

  if (configured.includes("apple")) {
    providers.push(
      AppleProvider({
        clientId: process.env.AUTH_APPLE_ID!,
        clientSecret: process.env.AUTH_APPLE_SECRET!,
      }),
    );
  }

  if (configured.includes("microsoft")) {
    providers.push(
      AzureADProvider({
        id: "microsoft",
        clientId: process.env.AUTH_AZURE_AD_ID!,
        clientSecret: process.env.AUTH_AZURE_AD_SECRET!,
        tenantId: process.env.AUTH_AZURE_AD_TENANT_ID ?? "common",
      }),
    );
  }

  return providers;
}

export function getAuthOptions(): NextAuthOptions {
  const databaseSessions = useDatabaseSessions();

  const options: NextAuthOptions = {
    providers: buildProviders(),
    secret: process.env.AUTH_SECRET,
    session: {
      strategy: databaseSessions ? "database" : "jwt",
      maxAge: SESSION_MAX_AGE_SEC,
      updateAge: SESSION_UPDATE_AGE_SEC,
    },
    cookies: buildCookieOptions(),
    pages: {
      signIn: "/sign-in",
      error: "/sign-in",
    },
    callbacks: {
      session({ session, token, user }) {
        return mergeSessionUser(session, {
          user: databaseSessions ? user : undefined,
          token: databaseSessions ? undefined : token,
        });
      },
      jwt({ token, user, account, profile }) {
        if (user) {
          token.sub = user.id;
          token.name = user.name;
          token.email = user.email;
          token.picture = user.image;
        }
        if (account && profile) {
          const image = profileImageFromOAuth(profile);
          if (image) token.picture = image;
          if ("name" in profile && profile.name) token.name = profile.name;
          if ("email" in profile && profile.email) token.email = profile.email;
        }
        return token;
      },
      redirect({ url }) {
        const mainSite = MAIN_SITE_URL.replace(/\/$/, "");
        const authBase = getNextAuthUrl();

        if (url.startsWith("/")) return `${mainSite}${url}`;

        try {
          const target = new URL(url);
          const allowed = [new URL(mainSite).origin, new URL(authBase).origin];
          if (allowed.includes(target.origin)) return url;
        } catch {
          /* ignore malformed url */
        }

        return mainSite;
      },
    },
    events: {
      async signIn({ user, profile, isNewUser }) {
        const jar = await cookies();
        jar.set(AUTH_KIND_COOKIE, isNewUser ? "new" : "returning", {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 120,
          secure: authCookiesSecure(),
          ...(getAuthCookieDomain() ? { domain: getAuthCookieDomain() } : {}),
        });

        if (!user.id || !profile) return;
        const image = profileImageFromOAuth(profile);
        const name = "name" in profile ? profile.name : null;
        if (!image && !name) return;

        await getDb()
          .update(users)
          .set({
            ...(image ? { image } : {}),
            ...(name ? { name } : {}),
          })
          .where(eq(users.id, user.id));
      },
    },
  };

  if (databaseSessions) {
    options.adapter = DrizzleAdapter(getDb(), {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    });
  }

  return options;
}
