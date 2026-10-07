import Link from "next/link";
import { HelpCentreShell, LegalArticle, RelatedArticles } from "@/components/legal/HelpCentreShell";
import {
  TERMS_EUROPEAN_SECTIONS,
  TERMS_REFERENCED_DOCS,
  TERMS_REGION_NOTICE,
  TERMS_RELATED,
  TERMS_TOC,
} from "@/lib/legal/terms-sections";

export default function TermsPage() {
  return (
    <HelpCentreShell sidebar={<RelatedArticles items={TERMS_RELATED} />}>
      <LegalArticle kicker="Legal terms" title="Terms of Service">
        <div className="legal-callout mb-8">
          {TERMS_REGION_NOTICE.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="text-sm leading-6 text-ink">
              {paragraph}
            </p>
          ))}
        </div>

        {TERMS_EUROPEAN_SECTIONS.filter((s) => s.id === "intro").map((section) => (
          <section key={section.id} id={section.id} className="mb-10">
            <h2 className="legal-h2">{section.title}</h2>
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 40)} className="mt-4 text-sm leading-6 text-ink">
                {p}
              </p>
            ))}
            <h3 className="legal-h3 mt-8">Documents referred to in these Terms</h3>
            <ul className="legal-list mt-3">
              {TERMS_REFERENCED_DOCS.map((doc) => (
                <li key={doc}>{doc}</li>
              ))}
            </ul>
          </section>
        ))}

        <nav aria-label="Table of contents" className="mb-10 rounded-xl border border-divider p-5">
          <h2 className="text-base font-semibold text-ink">Table of Contents for European Users</h2>
          <ul className="mt-4 space-y-2">
            {TERMS_TOC.map((item) => (
              <li key={item.id}>
                <Link href={`#${item.id}`} className="text-sm text-ink underline underline-offset-2">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {TERMS_EUROPEAN_SECTIONS.filter((s) => s.id !== "intro").map((section) => (
          <section key={section.id} id={section.id} className="mb-10 scroll-mt-24">
            <h2 className="legal-h2">{section.title}</h2>
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 40)} className="mt-4 text-sm leading-6 text-ink">
                {p}
              </p>
            ))}
            {section.list ? (
              <ul className="legal-list mt-4">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <p className="text-sm text-muted">
          Terms of Service for Users outside of the EEA, UK, and Australia and Terms of Service for Australian Users
          follow the same structure and are available on request through the Help Centre.
        </p>
      </LegalArticle>
    </HelpCentreShell>
  );
}
