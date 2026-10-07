"use client";

import Link from "next/link";
import { Globe, X } from "lucide-react";
import { useEffect, useState } from "react";
import { CurrencyModal } from "@/components/layout/CurrencyModal";
import { FooterInspiration } from "@/components/layout/FooterInspiration";
import { APP_LEGAL_NAME, APP_NAME } from "@/lib/brand";
import { DEFAULT_CURRENCY, type CurrencyOption } from "@/lib/legal/currencies";
import { FOOTER_LINKS } from "@/lib/help/pages";

const CURRENCY_STORAGE_KEY = "openstay-currency";

const legal = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/help/sitemap", label: "Sitemap" },
  { href: "/help/company-details", label: "Company details" },
];

function Column({ title, links }: { title: string; links: { label: string; slug: string }[] }) {
  return (
    <section className="border-[var(--border)] py-6 max-md:[&:not(:first-child)]:border-t md:py-0">
      <h3 className="t-footer-heading mb-4">{title}</h3>
      <ul className="flex flex-col gap-4">
        {links.map((link) => (
          <li key={link.slug} className="leading-5">
            <Link href={`/help/${link.slug}`} className="footer-link t-footer-link inline-block">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function MinimalFooter() {
  const year = new Date().getFullYear();
  const links = [
    { href: "/legal/privacy", label: "Privacy" },
    { href: "/legal/terms", label: "Terms" },
    { href: "/help/sitemap", label: "Sitemap" },
    { href: "/help/company-details", label: "Company details" },
  ];
  return (
    <footer className="border-t border-hairline bg-white">
      <div className="container-airbnb t-footer-link flex flex-col gap-3 py-6 md:flex-row md:items-center md:justify-between">
        <p>
          © {year} {APP_LEGAL_NAME}
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Footer">
          {links.map((link) => (
            <Link key={link.label} href={link.href} className="hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export function Footer({ variant = "full" }: { variant?: "full" | "minimal" }) {
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currency, setCurrency] = useState<CurrencyOption>(DEFAULT_CURRENCY);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as CurrencyOption;
      if (parsed?.code) setCurrency(parsed);
    } catch {
      /* ignore */
    }
  }, []);

  const saveCurrency = (next: CurrencyOption) => {
    setCurrency(next);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  if (variant === "minimal") return <MinimalFooter />;

  const year = new Date().getFullYear();
  const currencyShort = currency.symbol ? `${currency.symbol} ${currency.code}` : currency.code;

  return (
    <>
      <footer className="bg-soft pb-20 text-ink">
        <div className="container-home">
          <FooterInspiration />
          <div className="grid md:grid-cols-3 md:gap-4 md:pt-[var(--home-px)]">
          <Column title="Support" links={[...FOOTER_LINKS.support]} />
          <Column title="Hosting" links={[...FOOTER_LINKS.hosting]} />
          <Column title={APP_NAME} links={[...FOOTER_LINKS.about]} />
          </div>
          <div className="border-t border-divider py-6 md:mt-[var(--home-px)]">
            <div className="flex flex-col-reverse gap-5 md:flex-row md:items-center md:justify-between md:gap-4">
              <p className="t-footer-link">
                <span className="mb-1 inline-block lg:mb-0">
                  © {year} {APP_LEGAL_NAME}
                </span>
                <span className="block max-md:leading-5 md:inline">
                  {legal.map((link, index) => (
                    <span key={link.label}>
                      {index === 0 ? <span className="hidden md:inline"> · </span> : " · "}
                      <Link href={link.href} className="footer-link">
                        {link.label}
                      </Link>
                    </span>
                  ))}
                </span>
              </p>
              <div className="flex flex-wrap items-center">
                <Link
                  href="/coming-soon"
                  className="footer-ctrl t-footer-ctrl -ml-2 inline-flex items-center gap-2 rounded-[var(--r-ctrl)] px-2 py-1.5 md:ml-0"
                >
                  <Globe size={16} />
                  English (IN)
                </Link>
                <button
                  type="button"
                  aria-label="Choose a currency"
                  onClick={() => setCurrencyOpen(true)}
                  className="footer-ctrl t-footer-ctrl ml-1 inline-flex items-center rounded-[var(--r-ctrl)] px-2 py-1.5"
                >
                  {currencyShort}
                </button>
                <div className="mt-4 flex w-full items-center gap-6 md:ml-3 md:mt-0 md:w-auto">
                  <Link
                    href="https://x.com/airbnb_in"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="X"
                    className="inline-flex"
                  >
                    <X size={16} />
                  </Link>
                  <Link
                    href="https://www.instagram.com/airbnb"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="inline-flex"
                  >
                    <InstagramIcon />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <CurrencyModal
        open={currencyOpen}
        selectedCode={currency.code}
        onClose={() => setCurrencyOpen(false)}
        onSelect={saveCurrency}
      />
    </>
  );
}
