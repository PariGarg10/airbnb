"use client";

import {
  experienceCategoryIcon,
  experienceCategoryLabel,
  experienceCategoryPromo,
} from "@/lib/experienceLabels";
import type { ExperienceCategory } from "@/types/experience";

export function CategoryPromo({ category }: { category: ExperienceCategory }) {
  const label = experienceCategoryLabel(category);
  return (
    <section className="mt-12 bg-[#F7F7F7] px-6 py-16 text-center min-[1128px]:-mx-[calc((100vw-1120px)/2)] min-[1128px]:px-[calc((100vw-1120px)/2+24px)]">
      <div className="mx-auto max-w-[720px]">
        <img
          src={experienceCategoryIcon(category)}
          alt=""
          className="mx-auto h-28 w-28 object-contain"
        />
        <h2 className="mt-6 text-[32px] font-semibold leading-9 tracking-[-0.02em] text-ink">
          {label} experiences with knowledgeable hosts
        </h2>
        <p className="mt-4 text-base leading-6 text-muted">{experienceCategoryPromo(category)}</p>
      </div>
    </section>
  );
}
