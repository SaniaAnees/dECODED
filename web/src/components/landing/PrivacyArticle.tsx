import type { ReactNode } from "react";
import { CONTACT_EMAIL, PRIVACY_URL, SITE_NAME } from "@/lib/site";

const sections: { id: string; title: string; body: ReactNode }[] = [
  {
    id: "who",
    title: "Who this is",
    body: (
      <>
        <p>
          This policy covers the site at wrayle.com (shown as {SITE_NAME}),
          plus auth.wrayle.com and proxy.wrayle.com. The Google sign-in app is
          named dECODED. Both are operated by Sania Anees.
        </p>
        <p>
          The product that exists today is a localhost proxy and a waitlist.
          This page describes only what we actually collect — not a future
          agent.
        </p>
      </>
    ),
  },
  {
    id: "waitlist",
    title: "Waitlist email",
    body: (
      <>
        <p>
          If you leave an email on the homepage, we store that address and the
          time you joined. That is the whole record. We do not send a
          confirmation yet, and we do not sync the list to a marketing tool.
        </p>
        <p>
          We will write when there is something true to send — the cache
          layer, or the harness, when it exists. We do not sell the list.
        </p>
      </>
    ),
  },
  {
    id: "signin",
    title: "Google and GitHub sign-in",
    body: (
      <>
        <p>
          If you continue with Google, we receive your name, email address, and
          profile photo. Those are the only scopes we ask for:{" "}
          <span className="font-mono text-[14px] text-moon/90">openid</span>,{" "}
          <span className="font-mono text-[14px] text-moon/90">email</span>, and{" "}
          <span className="font-mono text-[14px] text-moon/90">profile</span>.
          We do not read Gmail, Drive, Calendar, or any other Google product.
        </p>
        <p>
          If you continue with GitHub, we receive the same kind of public
          profile information (name, email, photo).
        </p>
        <p>
          We keep a session cookie so you stay signed in — about 30 days if
          you keep using the site. Sign-out ends it. We store the account so
          you can come back without creating a password here.
        </p>
        <p>
          Apple and Microsoft buttons are on the sign-in page but are not
          connected yet. We do not collect anything from those providers until
          they are.
        </p>
      </>
    ),
  },
  {
    id: "limited-use",
    title: "How we use Google account data",
    body: (
      <>
        <p>
          We use Google name, email, and photo only to sign you in, show your
          account, and keep you signed in. We do not sell this data. We do not
          use it for advertising, credit decisions, or any purpose other than
          authentication.
        </p>
        <p>
          We do not share Google user data except with the hosting and
          database providers that run this site, who process it for us. That
          is the Limited Use standard Google requires for this kind of
          sign-in.
        </p>
      </>
    ),
  },
  {
    id: "keys",
    title: "Keys stay on your machine",
    body: (
      <>
        <p>
          The dECODED proxy listens on your computer (
          <span className="font-mono text-[14px] text-moon/90">
            127.0.0.1:8080
          </span>
          ). Your provider API keys never leave the laptop. Prompts and
          completions are not stored on our servers. There is no hosted hop.
        </p>
        <p>
          Traffic goes from your agent to localhost, then to the lab you
          already pay. We do not see that traffic. We do not take payment
          information — there is no checkout on this site.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and analytics",
    body: (
      <>
        <p>
          Sign-in sets cookies for the session, CSRF protection, and
          short-lived OAuth state. Those cookies are what keep you logged in
          across wrayle.com and auth.wrayle.com.
        </p>
        <p>
          The site also loads Google Analytics so we can tell whether pages
          are used. We do not run other marketing pixels, and we do not use
          Analytics to advertise to you.
        </p>
      </>
    ),
  },
  {
    id: "processors",
    title: "Who else sees it",
    body: (
      <>
        <p>
          The site is hosted on Vercel. Waitlist emails and sign-in accounts
          are stored in a hosted PostgreSQL database (currently Supabase).
          Google sees OAuth and Analytics traffic. GitHub sees OAuth traffic
          if you choose that button.
        </p>
        <p>
          They process data to run the site. They are not a buyer of the
          list.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <p>
        Waitlist emails stay until you ask us to remove them. Account records
        stay until you ask us to delete them. Sessions expire on their own;
        signing out ends the current one.
      </p>
    ),
  },
  {
    id: "choices",
    title: "Your choices",
    body: (
      <>
        <p>
          Email{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-gilt underline-offset-4 transition-colors hover:text-moon hover:underline"
          >
            {CONTACT_EMAIL}
          </a>{" "}
          to see, correct, or delete your waitlist row or sign-in account.
          Say which address to remove. We will do it.
        </p>
        <p>
          You can sign out from the header. You can also revoke access in
          your Google Account under Third-party access.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>This site is not directed at children under 13.</p>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    body: (
      <p>
        If this policy changes, we will update this page and the date at the
        top. The current version lives at{" "}
        <a
          href={PRIVACY_URL}
          className="text-gilt underline-offset-4 transition-colors hover:text-moon hover:underline"
        >
          {PRIVACY_URL}
        </a>
        .
      </p>
    ),
  },
];

export function PrivacyArticle() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-16 md:px-8 md:py-24">
      <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">
        POLICY
      </p>
      <h1 className="mt-5 font-serif text-4xl font-medium leading-tight text-moon md:text-5xl">
        Privacy
      </h1>
      <p className="mt-6 font-serif text-lg leading-relaxed text-mist">
        Waitlist email, Google sign-in, and the keys that stay on your
        machine. Nothing here is a claim about a product we have not shipped.
      </p>
      <p className="mt-4 font-mono text-[11px] tracking-[0.12em] text-dusk">
        Last updated 7 September 2026
      </p>

      <div className="mt-14 divide-y divide-line border-y border-line">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24 py-10">
            <h2 className="font-serif text-xl italic text-moon md:text-2xl">
              {section.title}
            </h2>
            <div className="mt-4 space-y-4 font-serif text-[17px] leading-relaxed text-mist">
              {section.body}
            </div>
          </section>
        ))}
      </div>

      <section id="contact" className="scroll-mt-24 pt-12">
        <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">
          CONTACT
        </p>
        <p className="mt-4 font-serif text-[17px] leading-relaxed text-mist">
          Sania Anees
          <br />
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-gilt underline-offset-4 transition-colors hover:text-moon hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </section>
    </article>
  );
}
