import Link from "next/link";
import { HelpCentreShell, LegalArticle, RelatedArticles } from "@/components/legal/HelpCentreShell";
import { APP_NAME } from "@/lib/brand";
import { PRIVACY_RELATED, PRIVACY_SUPPLEMENTS } from "@/lib/legal/privacy-content";

export default function PrivacyPage() {
  return (
    <HelpCentreShell sidebar={<RelatedArticles items={PRIVACY_RELATED} />}>
      <LegalArticle kicker="Legal terms" title={`${APP_NAME} Privacy`}>
        <p className="legal-lead">
          Our Privacy Policy explains what personal information we collect, how we use personal information, how
          personal information is shared, and privacy rights.
        </p>
        <p className="mt-4">
          <Link href="/legal/privacy#policy" className="font-semibold text-ink underline underline-offset-2">
            Privacy Policy
          </Link>
        </p>
        <p className="mt-4 text-sm leading-6 text-ink">
          Please review the supplemental privacy policies linked within the privacy policy documents, such as for
          certain {APP_NAME} services, that may be applicable to you.
        </p>
        <h2 id="supplements" className="legal-h2">
          Supplemental Privacy Policy Documents
        </h2>
        <ul className="legal-list">
          {PRIVACY_SUPPLEMENTS.map((item) => (
            <li key={item}>
              <Link href="/coming-soon" className="text-ink underline underline-offset-2">
                {item}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm leading-6 text-ink">
          {APP_NAME}.org is a separate and independent entity from {APP_NAME}, Inc. Access the {APP_NAME}.org Privacy
          Policy.
        </p>
        <h2 id="policy" className="legal-h2">
          Privacy Policy
        </h2>
        <p className="text-sm leading-6 text-ink">
          We collect information you provide when you create an account, book a stay, list a home, or contact support.
          We use this information to operate the platform, process payments, personalise search results, prevent fraud,
          and comply with law. We share information with hosts and guests as needed to complete reservations, with
          service providers who help us run the platform, and when required by law or to protect safety.
        </p>
        <p className="mt-4 text-sm leading-6 text-ink">
          Depending on where you live, you may have rights to access, correct, delete, or port your personal data, and
          to object to or restrict certain processing. You can exercise these rights from your account settings or by
          contacting us through the Help Centre.
        </p>
      </LegalArticle>
    </HelpCentreShell>
  );
}
