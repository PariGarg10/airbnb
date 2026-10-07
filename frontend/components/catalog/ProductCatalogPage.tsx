"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SwitchUserModal } from "@/components/auth/SwitchUserModal";
import { CatalogRow } from "@/components/catalog/CatalogRow";
import { ExperienceCatalogRow } from "@/components/catalog/ExperienceCatalogRow";
import { Skeleton } from "@/components/ui/Skeleton";
import { experiencesApi, listingsApi } from "@/lib/api";
import type { CatalogSectionMeta } from "@/lib/catalogSections";
import type { ListingCard as ListingCardData } from "@/types";
import type { ExperienceCard as ExperienceCardData } from "@/types/experience";

function CatalogSkeleton() {
  return (
    <main className="container-home space-y-6 pb-12 md:space-y-10 md:pt-[54px]">
      {Array.from({ length: 2 }, (_, section) => (
        <section key={section}>
          <Skeleton className="h-6 w-72" />
          <Skeleton className="mt-2 h-4 w-56" />
          <div className="home-row no-scrollbar mt-4">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="home-row-card">
                <Skeleton className="aspect-[20/19] w-full rounded-[var(--card-radius)]" />
                <Skeleton className="mt-1.5 h-[19px] w-3/4" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

function pickExperienceItems(items: ExperienceCardData[], section: CatalogSectionMeta): ExperienceCardData[] {
  if (section.city) {
    return items.filter((item) => item.city === section.city).slice(0, section.take ?? 6);
  }
  const start = section.start ?? 0;
  const take = section.take ?? 6;
  return items.slice(start, start + take);
}

function pickSectionItems(items: ListingCardData[], section: CatalogSectionMeta): ListingCardData[] {
  if (section.city) {
    return items.filter((item) => item.city === section.city).slice(0, section.take ?? 6);
  }
  const start = section.start ?? 0;
  const take = section.take ?? 6;
  return items.slice(start, start + take);
}

export function ProductCatalogPage({
  category,
  sections,
}: {
  category: "Experiences" | "Services";
  sections: CatalogSectionMeta[];
}) {
  const [authOpen, setAuthOpen] = useState(false);
  const isExperiences = category === "Experiences";
  const catalog = useQuery({
    queryKey: ["catalog", category],
    queryFn: async (): Promise<ListingCardData[] | ExperienceCardData[]> => {
      if (isExperiences) return experiencesApi.list();
      const page = await listingsApi.search({ category, page_size: 50 });
      return page.items;
    },
    staleTime: 60_000,
  });

  if (catalog.isLoading) return <CatalogSkeleton />;

  const items = catalog.data ?? [];

  if (catalog.isError || items.length === 0) {
    return (
      <main className="container-home py-16 md:pt-[54px]">
        <h2 className="t-section-title">Could not load {category.toLowerCase()}</h2>
        <p className="mt-2 text-meta text-muted">
          Check that the API is reachable and the database includes {category.toLowerCase()} listings (re-seed after deploy if needed).
        </p>
        <button type="button" className="mt-4 t-link" onClick={() => catalog.refetch()}>
          Try again
        </button>
      </main>
    );
  }

  return (
    <main className="container-home space-y-6 pb-12 md:space-y-10 md:pt-[54px]">
      {sections.map((section) => {
        const title = section.title;
        if (section.featured) {
          return (
            <section key={section.id}>
              <h2 className="t-section-title pl-0.5">{title}</h2>
            </section>
          );
        }
        if (isExperiences) {
          const rowItems = pickExperienceItems(items as ExperienceCardData[], section);
          return <ExperienceCatalogRow key={section.id} title={title} subtitle={section.subtitle} items={rowItems} />;
        }
        const rowItems = pickSectionItems(items as ListingCardData[], section);
        return (
          <CatalogRow
            key={section.id}
            title={title}
            subtitle={section.subtitle}
            listings={rowItems}
            onNeedAuth={() => setAuthOpen(true)}
          />
        );
      })}
      <SwitchUserModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </main>
  );
}
