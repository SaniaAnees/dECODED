import Link from "next/link";
import { LegalDoc, LegalSection } from "@/components/landing/LegalDoc";
import {
  CONTACT_EMAIL,
  PAYMENT_PROVIDER,
  PLAN_FREE,
  PLAN_PAID,
  PRICING_URL,
  PRIVACY_URL,
  REFUND_URL,
  SITE_NAME,
  TERMS_URL,
} from "@/lib/site";

/**
 * Section order mirrors Cursor / JetBrains-style product ToS:
 * Service → Eligibility → Accounts → Payments → Cancel → License →
 * Restrictions → Feedback → Termination → Disclaimers → Liability → Law → Changes.
 * Age follows GitHub / JetBrains / Replit (13+), not Cursor’s 18+.
 */
export function TermsArticle() {
  return (
    <LegalDoc
      eyebrow="TERMS"
      title="Terms of service"
      lead={`These Terms govern your use of ${SITE_NAME} — the website, accounts, and Paid CLI license. Read them with the Privacy Policy.`}
      updated="10 September 2026"
    >
      <LegalSection id="service" title="1. The Service">
        <p>
          {SITE_NAME} is operated by Sania Anees. The Service includes
          wrayle.com and related auth hosts, waitlist and sign-in, and — for
          Paid subscribers — a limited license to install and run our
          closed-source CLI / coding harness built for token optimization.
        </p>
        <p>
          Subject to these Terms, we grant you a limited, non-exclusive,
          non-transferable right to access and use the Service. Digital
          software only: no physical goods and no shipping.
        </p>
        <p>
          Your use is also covered by our{" "}
          <Link href="/privacy">Privacy Policy</Link>. Pricing is on the{" "}
          <Link href="/pricing">Pricing</Link> page.
        </p>
      </LegalSection>

      <LegalSection id="eligibility" title="2. Eligibility">
        <p>
          You must be at least 13 years old (or older if your country requires
          it). If you are under 18, or under the age of majority where you
          live, a parent or guardian must agree to these Terms before you buy
          Paid. By using the Service you confirm you meet these rules and that
          your use complies with the laws that apply to you.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="3. Accounts">
        <p>
          Some features need an account (Google or GitHub sign-in). Information
          you give us must be accurate and kept up to date. You are
          responsible for activity under your account and for keeping access
          to your OAuth provider secure. If you think the account was
          compromised, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> right away.
        </p>
        <p>
          We may suspend or close an account that breaks these Terms, is
          unpaid when fees are due, or creates legal or security risk.
        </p>
      </LegalSection>

      <LegalSection id="payments" title="4. Plans, pricing, and payments">
        <p>
          <strong>{PLAN_FREE.name}</strong> — {PLAN_FREE.priceLabel}. No card.
          Free-tier site features we publish.
        </p>
        <p>
          <strong>{PLAN_PAID.name}</strong> — {PLAN_PAID.priceLabel} USD per
          month, billed in advance. License to use the closed-source CLI while
          the subscription is active. Current prices are on{" "}
          <Link href="/pricing">Pricing</Link>. We may change prices with
          notice there; changes apply on your next billing cycle unless we
          say otherwise.
        </p>
        <p>
          {PLAN_PAID.name} is charged through <strong>{PAYMENT_PROVIDER}</strong>.
          By buying or renewing, you authorize {PAYMENT_PROVIDER} to charge the
          method you provide for {PLAN_PAID.priceLabel} USD per month (or the
          amount and currency shown at their checkout), plus any stated tax.
          Card and UPI details are handled by {PAYMENT_PROVIDER}; we do not
          store full card numbers. Their terms and privacy policy also apply
          to checkout.
        </p>
        <p>
          Subscriptions renew automatically each month until you cancel. If a
          renewal fails, we may retry, pause Paid access, or move you to Free
          until payment succeeds.
        </p>
      </LegalSection>

      <LegalSection id="cancel" title="5. Cancellation and refunds">
        <p>
          Cancel Paid anytime (billing controls when available, or email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>). Cancel
          stops the next renewal. You keep Paid access through the period you
          already paid for, unless a refund applies.
        </p>
        <p>
          Refunds and chargebacks are governed by the{" "}
          <Link href="/refund">Refund &amp; cancellation policy</Link>. Free
          has no subscription fee to refund.
        </p>
      </LegalSection>

      <LegalSection id="license" title="6. License and ownership">
        <p>
          We own the site, brand, CLI, and harness, and all related
          intellectual property. Free or Paid access is a limited license to
          use the Service — not a sale of that IP. When Paid ends, the CLI
          license ends. There are no implied licenses beyond what these Terms
          grant.
        </p>
        <p>
          You keep rights in your own code and projects. We do not claim
          ownership of work you create with tools on your machine.
        </p>
      </LegalSection>

      <LegalSection id="restrictions" title="7. Acceptable use">
        <p>Except where applicable law says you may, you may not:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            reverse engineer, decompile, or attempt to extract source from the
            closed-source CLI or Service
          </li>
          <li>share, rent, resell, or redistribute the CLI outside your seat</li>
          <li>remove proprietary notices from the Service</li>
          <li>
            probe, attack, scrape in a harmful way, or break into our hosting,
            auth, or database
          </li>
          <li>use the Service in a way that breaks the law</li>
        </ul>
        <p>
          A Paid seat is for you (or your organization under one seat rules we
          publish). Tell us promptly about unauthorized use you learn of.
        </p>
      </LegalSection>

      <LegalSection id="feedback" title="8. Feedback">
        <p>
          If you send ideas, suggestions, or bug reports, you grant us the
          right to use them to improve the Service without payment or further
          obligation to you.
        </p>
      </LegalSection>

      <LegalSection id="termination" title="9. Termination">
        <p>
          You may stop using the Service at any time. We may modify, suspend,
          or end the Service or your access — with notice when we reasonably
          can, immediately when needed for abuse, security, or law.
        </p>
        <p>
          If we end Paid for our convenience (not because you broke these
          Terms), we will refund prepaid unused time on a pro-rata basis. If
          we end access because you violated these Terms, no refund is owed
          beyond what the Refund policy or law requires.
        </p>
      </LegalSection>

      <LegalSection id="disclaimers" title="10. Disclaimers">
        <p>
          THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE FULLEST
          EXTENT ALLOWED BY LAW, WE DISCLAIM WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not
          warrant uninterrupted access, error-free software, or any fixed
          token-savings result. You are responsible for how you use the CLI
          and for reviewing its output before you rely on it.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="11. Limitation of liability">
        <p>
          This section does not cancel refunds owed under the{" "}
          <Link href="/refund">Refund &amp; cancellation policy</Link>.
        </p>
        <p>
          To the fullest extent allowed by law, we are not liable for lost
          profits, lost data, or indirect, incidental, special, or
          consequential damages arising from the Service. Our total liability
          for claims about the Service is limited to the fees you paid us for
          Paid in the three months before the claim — or{" "}
          {PLAN_FREE.priceLabel} if you were only on Free.
        </p>
      </LegalSection>

      <LegalSection id="law" title="12. Governing law">
        <p>
          These Terms are governed by the laws of India, without regard to
          conflict-of-law rules. Courts in India have exclusive jurisdiction,
          except where consumer law gives you a non-waivable forum.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="13. Changes">
        <p>
          We may change these Terms. We will update the date at the top and
          keep the current version at{" "}
          <a href={TERMS_URL}>{TERMS_URL}</a>. Material Paid billing changes
          apply on the next cycle after we post them, unless law requires
          otherwise. Continued use after an update means you accept the new
          Terms; if you do not, stop using the Service.
        </p>
        <p>
          Related:{" "}
          <Link href={PRICING_URL}>Pricing</Link>
          {" · "}
          <Link href={REFUND_URL}>Refunds</Link>
          {" · "}
          <Link href={PRIVACY_URL}>Privacy</Link>.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
