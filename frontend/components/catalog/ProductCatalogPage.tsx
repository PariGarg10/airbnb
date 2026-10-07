"use client";

import { CatalogRow } from "@/components/catalog/CatalogRow";
import { APP_NAME } from "@/lib/brand";

export function ProductCatalogPage({
  sections,
}: {
  sections: { id: string; title: string; subtitle?: string; featured?: boolean; items: import("@/lib/mock/experiences").CatalogItem[] }[];
}) {
  return (
    <main className="container-home space-y-6 pb-12 md:space-y-10 md:pt-[54px]">
      {sections.map((section) => {
        const title = section.title.replace("<app name>", APP_NAME);
        return (
          <CatalogRow
            key={section.id}
            title={title}
            subtitle={section.subtitle}
            featured={section.featured}
            items={section.items}
          />
        );
      })}
    </main>
  );
}
