import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExperienceView } from "@/components/experience/ExperienceView";
import { ApiError, experiencesApi } from "@/lib/api";

interface ExperiencePageProps {
  params: { id: string };
}

export default async function ExperiencePage({ params }: ExperiencePageProps) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) notFound();

  let experience;
  try {
    experience = await experiencesApi.get(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) experience = null;
    else throw error;
  }
  if (!experience) notFound();

  return (
    <Suspense fallback={null}>
      <ExperienceView initialExperience={experience} />
    </Suspense>
  );
}
