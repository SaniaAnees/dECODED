import Link from "next/link";
import { LegalDoc, LegalSection } from "@/components/landing/LegalDoc";
import {
  CONTACT_EMAIL,
  PAYMENT_PROVIDER,
  PLAN_PAID,
  PRIVACY_URL,
  SITE_NAME,
} from "@/lib/site";

/**
 * Structure follows Cursor / Cognition / Replit privacy pages.
 * Age floor follows GitHub, JetBrains, Replit, Copilot (13+), not Cursor’s 18+.
 * Content is limited to what usecoded actually processes today.
 */
export function PrivacyArticle() {
  return (
    <LegalDoc
      eyebrow="PRIVACY"
      title="Privacy policy"
      lead={`What ${SITE_NAME} collects, how we use it, and who we share it with. Operated by Sania Anees.`}
      updated="10 September 2026"
    >
      <LegalSection id="scope" title="1. Scope">
        <p>
          This Privacy Policy explains how we collect, use, disclose, and
          retain personal data when you use wrayle.com, related auth hosts,
          accounts, the waitlist, Paid checkout, and the {SITE_NAME} CLI
          license (together, the “Service”). It works with our{" "}
          <Link href="/terms">Terms of service</Link>.
        </p>
      </LegalSection>

      <LegalSection id="collect" title="2. What we collect">
        <p>
          <strong>Account and contact.</strong> If you sign in with Google or
          GitHub: name, email, and profile photo those providers send us. If
          you join the waitlist: email and join time. If you write us: the
          address and message contents (support, feedback, refunds).
        </p>
        <p>
          <strong>Payment.</strong> {PLAN_PAID.name} ({PLAN_PAID.priceLabel}/month)
          is
          charged by {PAYMENT_PROVIDER}. They collect card or UPI details on
          their pages. We receive status, amount, currency, and payment /
          subscription ids so we can unlock the CLI seat and handle refunds.
          We do not store full card numbers.
        </p>
        <p>
          <strong>Automatic / technical.</strong> Session cookies, CSRF and
          OAuth state, IP address, and basic browser / device data in server
          logs. If Google Analytics is enabled on the site, we receive
          aggregated page-use data from it.
        </p>
        <p>
          <strong>What we do not collect via the website.</strong> Your source
          code, prompts, and repo files are not uploaded to us to run the
          Paid CLI. That product runs on your machine.
        </p>
      </LegalSection>

      <LegalSection id="use" title="3. How we use it">
        <p>We use personal data to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>provide and maintain the Service (site, accounts, waitlist)</li>
          <li>authenticate you and keep sessions working</li>
          <li>bill, renew, and refund Paid subscriptions through {PAYMENT_PROVIDER}</li>
          <li>send Service messages you asked for (including waitlist updates)</li>
          <li>debug, prevent fraud and abuse, and secure the Service</li>
          <li>understand site usage (including Analytics, when enabled)</li>
          <li>comply with law, tax, and accounting rules</li>
        </ul>
        <p>
          We do not sell personal data. We do not use it for cross-context
          behavioral advertising. Google account data is used only to sign
          you in and show your account — not for ads or credit decisions
          (Google Limited Use).
        </p>
      </LegalSection>

      <LegalSection id="share" title="4. How we share it">
        <p>
          <strong>Service providers.</strong> Vercel (hosting), Supabase /
          PostgreSQL (database), {PAYMENT_PROVIDER} (payments), Google and
          GitHub (sign-in), Google Analytics when loaded. They process data
          for us to run the Service — they are not buyers of your data.
        </p>
        <p>
          <strong>Legal and safety.</strong> We may disclose data when
          required by law or legal process, or to prevent fraud, abuse, or
          harm.
        </p>
        <p>
          <strong>Business transfers.</strong> If the project is sold, merged,
          or restructured, personal data may move with it under this policy
          (or a successor notice).
        </p>
      </LegalSection>

      <LegalSection id="oauth" title="5. Google and GitHub sign-in">
        <p>
          Google scopes:{" "}
          <span className="font-mono text-[13px] text-moon/90">openid</span>,{" "}
          <span className="font-mono text-[13px] text-moon/90">email</span>,{" "}
          <span className="font-mono text-[13px] text-moon/90">profile</span>.
          We do not access Gmail, Drive, or Calendar. GitHub provides the same
          kind of public profile fields.
        </p>
        <p>
          We keep a session cookie (about 30 days with ongoing use). Sign-out
          ends it. You can revoke Google access under Third-party access in
          your Google Account. Apple and Microsoft buttons are not connected
          until credentials are set; we collect nothing from them until then.
        </p>
      </LegalSection>

      <LegalSection id="cli" title="6. CLI">
        <p>
          Paid is a license for the closed-source {SITE_NAME} CLI you run
          locally. This policy covers account and billing data for that seat.
          Files that never leave your computer are outside what we collect
          through the Service described here.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="7. Retention">
        <p>
          We keep personal data only as long as needed to run the Service and
          meet legal duties. Waitlist and account records stay until you ask
          us to delete them, or we close the account under the Terms. Payment
          records needed for tax, dispute, or accounting stay as long as law
          requires. Sessions expire; signing out ends the current one.
        </p>
      </LegalSection>

      <LegalSection id="security" title="8. Security">
        <p>
          We use commercially reasonable technical and organizational measures
          (HTTPS, database access controls, OAuth via Google / GitHub,
          payments via {PAYMENT_PROVIDER}). No method of transmission or
          storage is fully secure. Avoid sending secrets in waitlist fields or
          email that you cannot rotate.
        </p>
      </LegalSection>

      <LegalSection id="transfers" title="9. Where data is processed">
        <p>
          Our hosting and database providers may store and process data in
          regions outside your country (including the United States). By using
          the Service you understand that transfer. We still apply the
          protections in this policy.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="10. Your rights">
        <p>
          Depending on where you live, you may have rights to access, correct,
          delete, or receive a copy of personal data we hold, and to object to
          or restrict certain processing. Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> to make a
          request. Say which email the record is under. We may verify identity
          before acting. We will not discriminate against you for exercising
          rights the law gives you.
        </p>
        <p>
          Paid refunds follow the{" "}
          <Link href="/refund">Refund &amp; cancellation policy</Link>.
        </p>
      </LegalSection>

      <LegalSection id="children" title="11. Children">
        <p>
          The Service is not directed at children under 13. You must be at
          least 13 to use it. If your country sets a higher digital age of
          consent, you must meet that age too.
        </p>
        <p>
          If you are under 18 (or under the age of majority where you live),
          a parent or guardian must agree to the Terms before you buy Paid. If
          we learn we have data from someone under 13, we will delete it.
          Write <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> if
          you believe that happened.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="12. Changes">
        <p>
          We may update this policy. We will change the date at the top. Live
          version: <a href={PRIVACY_URL}>{PRIVACY_URL}</a>. Continued use after
          an update means you accept the revised policy, except where law
          requires a different notice.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
