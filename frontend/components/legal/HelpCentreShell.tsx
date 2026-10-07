"use client";

import { Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { APP_NAME } from "@/lib/brand";

function crumbsFromPath(pathname: string) {
  const segments = pathname.replace(/^\/legal\/?/, "").split("/").filter(Boolean);
  const labels = segments.map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
  return ["Home", "All topics", "Legal Terms", ...labels];
}

export function HelpCentreShell({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}) {
  const pathname = usePathname();
  const crumbs = crumbsFromPath(pathname);

  return (
    <div className="min-h-screen bg-white pb-16">
      <header className="border-b border-divider">
        <div className="container-airbnb flex h-[72px] items-center justify-between gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-rausch">
            <Logo wordmark={false} />
            <span className="text-lg font-semibold text-ink">
              {APP_NAME} <span className="font-normal text-muted">Help Centre</span>
            </span>
          </Link>
          <div className="hidden max-w-xl flex-1 md:block">
            <label className="relative block">
              <span className="sr-only">Search how-tos and more</span>
              <input
                type="search"
                placeholder="Search how-tos and more"
                className="h-12 w-full rounded-full border border-divider bg-white pl-5 pr-14 text-sm text-ink outline-none focus:border-ink"
              />
              <span className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-full bg-rausch text-white">
                <Search size={18} aria-hidden />
              </span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Language" className="hidden h-10 w-10 items-center justify-center rounded-full border border-divider md:flex">
              <span className="text-xs font-medium">🌐</span>
            </button>
            <button type="button" aria-label="Main menu" className="flex h-10 items-center gap-2 rounded-full border border-divider px-3">
              <Menu size={16} />
              <span className="hidden h-7 w-7 rounded-full bg-softer md:block" />
            </button>
          </div>
        </div>
      </header>
      <div className="container-airbnb py-6">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-1">
            {crumbs.map((crumb, index) => (
              <li key={`${crumb}-${index}`} className="flex items-center gap-1">
                {index > 0 ? <span aria-hidden>›</span> : null}
                {index === 0 ? (
                  <Link href="/" className="hover:underline">
                    {crumb}
                  </Link>
                ) : (
                  <span className={index === crumbs.length - 1 ? "text-ink" : ""}>{crumb}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">{children}</div>
          <aside className="space-y-6">
            {sidebar}
            <div className="rounded-xl border border-divider p-5">
              <p className="text-sm text-ink">Get help with your reservations, account, and more.</p>
              <Link
                href="/profile"
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-rausch text-sm font-semibold text-white"
              >
                Log in or sign up
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export function LegalArticle({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="legal-prose max-w-[720px]">
      <p className="mb-2 text-sm text-muted">{kicker}</p>
      <h1 className="mb-6 text-[32px] font-semibold leading-9 text-ink">{title}</h1>
      {children}
    </article>
  );
}

export function RelatedArticles({
  items,
}: {
  items: readonly { title: string; category: string; note: string }[];
}) {
  return (
    <div className="rounded-xl border border-divider p-5">
      <h2 className="mb-4 text-base font-semibold text-ink">Related articles</h2>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.title}>
            <p className="text-xs text-muted">{item.category}</p>
            <p className="text-sm font-semibold text-ink">{item.title}</p>
            <p className="mt-1 text-sm text-muted">{item.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
