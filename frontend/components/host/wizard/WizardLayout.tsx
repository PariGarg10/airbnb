"use client";



import Link from "next/link";

import { useRouter } from "next/navigation";

import { useCallback, useState } from "react";

import { toast } from "sonner";

import { WIZARD_STEPS } from "@/components/host/steps";

import { descriptionFromHighlights } from "@/components/host/wizard/highlights";

import { toListingInput } from "@/components/host/wizard/listingInput";

import { QuestionsDrawer } from "@/components/host/wizard/QuestionsDrawer";

import { WizardLoadingDots } from "@/components/host/wizard/WizardLoadingDots";

import { WizardProvider, useWizard } from "@/components/host/wizard/WizardContext";

import { addressValid } from "@/components/host/wizard/validators";

import { Belo } from "@/components/layout/Logo";

import { ApiError, hostApi } from "@/lib/api";

import { APP_NAME } from "@/lib/brand";

import { propertyLabel } from "@/lib/format";



function WizardChrome({ children }: { children: React.ReactNode }) {

  const router = useRouter();

  const { draft, patch, setStep, clear, openAddressModal } = useWizard();

  const [questionsOpen, setQuestionsOpen] = useState(false);

  const [publishing, setPublishing] = useState(false);

  const [stepBusy, setStepBusy] = useState(false);

  const closeQuestions = useCallback(() => setQuestionsOpen(false), []);

  const index = Math.min(draft.currentStep, WIZARD_STEPS.length - 1);

  const step = WIZARD_STEPS[index];

  const phaseSteps = WIZARD_STEPS.filter((item) => item.phase === step.phase);

  const indexInPhase = Math.max(0, phaseSteps.findIndex((item) => item.id === step.id));

  const fraction = (indexInPhase + 1) / phaseSteps.length;

  const valid = step.isValid(draft);

  const addressNeedsModal = step.id === "address" && !addressValid(draft);



  const jumpToInvalid = () => {

    const invalid = WIZARD_STEPS.findIndex((item) => !item.isValid(draft));

    if (invalid !== -1) setStep(invalid);

  };



  const next = async () => {

    if (addressNeedsModal) {

      openAddressModal();

      return;

    }

    if (!valid || publishing || stepBusy) return;

    if (step.id === "highlights" && draft.description.trim().length === 0) {

      const place = draft.property_type ? propertyLabel(draft.property_type) : "place";

      const text = descriptionFromHighlights(draft.highlights, place);

      if (text) patch({ description: text });

    }

    if (index < WIZARD_STEPS.length - 1) {

      setStepBusy(true);

      window.setTimeout(() => {

        setStep(index + 1);

        setStepBusy(false);

      }, 200);

      return;

    }

    const invalid = WIZARD_STEPS.findIndex((item) => !item.isValid(draft));

    if (invalid !== -1) {

      setStep(invalid);

      return;

    }

    setPublishing(true);

    try {

      const created = await hostApi.createListing(toListingInput(draft));

      toast.success("Your listing is live!");

      clear();

      router.push(`/listings/${created.id}`);

    } catch (error) {

      const detail = error instanceof ApiError ? error.detail : "Could not publish listing";

      toast.error(detail);

      if (error instanceof ApiError && (error.status === 400 || error.status === 422)) jumpToInvalid();

    } finally {

      setPublishing(false);

    }

  };



  const saveExit = () => {

    router.push("/host/listings");

  };



  return (

    <div className="min-h-screen bg-white">

      <header className="flex h-[var(--header-h)] items-center justify-between px-6 min-[1128px]:px-12">

        <Link href="/" aria-label={`${APP_NAME} home`} className="text-rausch">

          <Belo className="h-8 w-8" />

        </Link>

        <div className="flex items-center gap-2 min-[1128px]:gap-3">

          <button

            type="button"

            className="rounded-full px-4 py-2.5 text-sm font-semibold leading-[18px] text-ink hover:bg-soft min-[1128px]:border min-[1128px]:border-hairline"

            onClick={() => setQuestionsOpen(true)}

          >

            Questions?

          </button>

          <button

            type="button"

            className="rounded-full border border-hairline px-4 py-2.5 text-sm font-semibold leading-[18px] text-ink hover:bg-soft"

            onClick={saveExit}

          >

            Save & exit

          </button>

        </div>

      </header>

      <main className="pb-28">

        <div key={draft.currentStep} className="wizard-step-panel">

          {children}

        </div>

      </main>

      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-transparent bg-white min-[1128px]:border-hairline">

        <div className="grid grid-cols-3 gap-2 px-6 min-[1128px]:gap-3 min-[1128px]:px-12">

          {[1, 2, 3].map((phase) => {

            const width = phase < step.phase ? 1 : phase > step.phase ? 0 : fraction;

            return (

              <div key={phase} className="h-1 overflow-hidden rounded-full bg-hairline min-[1128px]:h-[3px]">

                <div className="h-full bg-ink transition-[width] duration-200 ease-out" style={{ width: `${width * 100}%` }} />

              </div>

            );

          })}

        </div>

        <div className="flex items-center justify-between px-6 py-4 min-[1128px]:px-12 min-[1128px]:py-5">

          <button

            type="button"

            className="t-link underline decoration-1 underline-offset-2 disabled:invisible"

            disabled={index === 0}

            onClick={() => setStep(index - 1)}

          >

            Back

          </button>

          <button

            type="button"

            disabled={publishing || stepBusy || (!addressNeedsModal && !valid)}

            onClick={next}

            className="flex min-w-[104px] items-center justify-center rounded-lg bg-ink px-8 py-3 text-base font-semibold text-white disabled:opacity-40 min-[1128px]:min-h-12 min-[1128px]:min-w-[120px] min-[1128px]:rounded-xl min-[1128px]:px-10"

          >

            {publishing ? (

              "Publishing…"

            ) : stepBusy ? (

              <WizardLoadingDots className="text-white" />

            ) : step.id === "review" ? (

              "Publish"

            ) : (

              "Next"

            )}

          </button>

        </div>

      </footer>

      <QuestionsDrawer open={questionsOpen} onClose={closeQuestions} />

    </div>

  );

}



export function WizardLayout({ children }: { children: React.ReactNode }) {

  return (

    <WizardProvider>

      <WizardChrome>{children}</WizardChrome>

    </WizardProvider>

  );

}


