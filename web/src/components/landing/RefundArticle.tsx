import Link from "next/link";
import { LegalDoc, LegalSection } from "@/components/landing/LegalDoc";
import {
  CONTACT_EMAIL,
  PAYMENT_PROVIDER,
  PLAN_FREE,
  PLAN_PAID,
  PRICING_URL,
  REFUND_URL,
  SITE_NAME,
} from "@/lib/site";

/**
 * Cancel ≠ refund; 14-day little/no-use window; 5–10 business day payout.
 * Pattern aligned with Cursor billing help + JetBrains monthly cancel clarity.
 */
export function RefundArticle() {
  return (
    <LegalDoc
      eyebrow="REFUNDS"
      title="Refund & cancellation"
      lead={`How cancel and refund work for ${SITE_NAME} Free (${PLAN_FREE.priceLabel}) and ${PLAN_PAID.name} (${PLAN_PAID.priceLabel}/month). Cancel stops future charges; it is not the same as a refund.`}
      updated="10 September 2026"
    >
      <LegalSection id="scope" title="1. Scope">
        <p>
          This policy covers {SITE_NAME} (wrayle.com), operated by Sania
          Anees. Plans are on <Link href="/pricing">Pricing</Link>; the
          contract is the <Link href="/terms">Terms of service</Link>.
        </p>
        <p>
          Paid is a digital CLI license. There is no physical product and no
          shipping.
        </p>
      </LegalSection>

      <LegalSection id="cancel" title="2. Cancellation">
        <p>
          Paid renews automatically each month through {PAYMENT_PROVIDER}{" "}
          until you cancel. Cancel anytime from billing controls (when
          available) or by emailing{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the
          email on the subscription.
        </p>
        <p>
          <strong>Cancel stops the next renewal.</strong> It does not
          automatically refund a charge that already went through. You keep
          Paid CLI access until the end of the billing period you already
          paid for.
        </p>
        <p>
          Free ({PLAN_FREE.priceLabel}) has no subscription fee. Stop using
          it anytime; ask us to delete the account if you want the record
          removed.
        </p>
      </LegalSection>

      <LegalSection id="eligibility" title="3. When a refund is available">
        <p>You may request a refund of a Paid charge if all of these are true:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            you ask within <strong>fourteen (14) days</strong> of that
            payment
          </li>
          <li>
            you have made little or no use of the Paid CLI during that period
          </li>
          <li>the charge is a subscription fee (not a third-party fee)</li>
        </ul>
        <p>
          We will check the account before approving. If eligible, we cancel
          Paid (if still active) and refund that payment.
        </p>
        <p>
          Outside the 14-day window, or after meaningful use of Paid in the
          period, that payment is generally not refundable. You can still
          cancel so you are not charged again.
        </p>
        <p>
          We do not issue mid-cycle prorated refunds for unused days after
          you cancel with use in the period. Cancel keeps Paid access until
          the period ends; it does not claw back the rest of the month.
        </p>
      </LegalSection>

      <LegalSection id="exceptions" title="4. Other refund cases">
        <p>
          We will also refund when required by law, when we charged you in
          clear error (duplicate payment), or when we permanently discontinue
          Paid and you have prepaid unused time — then on a pro-rata basis.
        </p>
        <p>
          If we terminate Paid for our convenience (not because you broke the
          Terms), we refund prepaid unused time on a pro-rata basis, as in
          the Terms.
        </p>
      </LegalSection>

      <LegalSection id="request" title="5. How to request a refund">
        <p>
          Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>the email on the account</li>
          <li>payment date and amount</li>
          <li>
            {PAYMENT_PROVIDER} payment or subscription id, if you have it
          </li>
          <li>a short note that you want a refund (and cancel, if you do)</li>
        </ul>
        <p>
          Approved refunds go to the original payment method through{" "}
          {PAYMENT_PROVIDER}. After we approve, we initiate the refund within{" "}
          <strong>five to ten (5–10) business days</strong>. Your bank or UPI
          app may take longer to show the credit.
        </p>
      </LegalSection>

      <LegalSection id="failed" title="6. Failed payments and disputes">
        <p>
          If a renewal fails, Paid access may pause until payment succeeds.
        </p>
        <p>
          If a charge looks wrong, write us before filing a chargeback. We
          will fix genuine duplicates or errors. Unfounded chargebacks may
          lead to account suspension.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="7. Changes">
        <p>
          We may update this policy. The date at the top will change. Live
          version: <a href={REFUND_URL}>{REFUND_URL}</a>. See also{" "}
          <Link href={PRICING_URL}>Pricing</Link>.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
