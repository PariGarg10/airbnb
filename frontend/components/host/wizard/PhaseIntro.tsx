import type { ReactNode } from "react";

export function PhaseIntro({
  step,
  title,
  body,
  illustration,
}: {
  step: number;
  title: string;
  body: string;
  illustration: ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-[55vh] w-full max-w-5xl items-center gap-10 px-6 py-12 min-[1128px]:min-h-[62vh] min-[1128px]:grid-cols-2 min-[1128px]:gap-16 min-[1128px]:px-12 min-[1128px]:py-16">
      <div>
        <p className="t-step-label min-[1128px]:text-base">Step {step}</p>
        <h1 className="t-wizard-title mt-3 min-[1128px]:mt-4 min-[1128px]:text-[48px] min-[1128px]:leading-[52px]">{title}</h1>
        <p className="t-wizard-subtitle mt-4 max-w-md min-[1128px]:mt-5 min-[1128px]:max-w-lg">{body}</p>
      </div>
      <div className="flex justify-center min-[1128px]:justify-end">{illustration}</div>
    </div>
  );
}