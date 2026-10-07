import Link from "next/link";
import { notFound } from "next/navigation";
import { HelpCentreShell, LegalArticle } from "@/components/legal/HelpCentreShell";
import { HELP_BY_SLUG, HELP_PAGES } from "@/lib/help/pages";

export function generateStaticParams() {
  return HELP_PAGES.map((page) => ({ slug: page.slug }));
}

export default function HelpTopicPage({ params }: { params: { slug: string } }) {
  const page = HELP_BY_SLUG[params.slug];
  if (!page) notFound();

  return (
    <HelpCentreShell>
      <LegalArticle kicker={page.category} title={page.title}>
        <p className="legal-lead">{page.summary}</p>
        {page.body.map((paragraph) => (
          <p key={paragraph.slice(0, 48)} className="mt-4 text-sm leading-6 text-ink">
            {paragraph}
          </p>
        ))}
        {page.links?.length ? (
          <ul className="legal-list mt-6">
            {page.links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-ink underline underline-offset-2">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </LegalArticle>
    </HelpCentreShell>
  );
}
