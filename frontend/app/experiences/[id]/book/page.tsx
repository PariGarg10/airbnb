import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExperienceCheckoutDesktop } from "@/components/experience-checkout/ExperienceCheckoutDesktop";

interface ExperienceBookPageProps {
  params: { id: string };
}

export default function ExperienceBookPage({ params }: ExperienceBookPageProps) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) notFound();

  return (
    <Suspense fallback={null}>
      <div className="hidden min-[1128px]:block">
        <ExperienceCheckoutDesktop experienceId={id} />
      </div>
      <div className="max-[1127px]:px-6 max-[1127px]:py-16">
        <p className="text-muted">Open this page on a desktop browser to complete checkout.</p>
      </div>
    </Suspense>
  );
}
