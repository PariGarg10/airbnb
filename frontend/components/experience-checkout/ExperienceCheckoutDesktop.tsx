"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SwitchUserModal } from "@/components/auth/SwitchUserModal";
import { CheckoutHeader } from "@/components/checkout/CheckoutHeader";
import { SecurePaymentModal } from "@/components/checkout/SecurePaymentModal";
import { ExperienceSummaryCard } from "@/components/experience-checkout/ExperienceSummaryCard";
import { StepCard, StepDone } from "@/components/experience-checkout/StepCard";
import { SelectTimeModal } from "@/components/experience/SelectTimeModal";
import { Counter } from "@/components/ui/Counter";
import { Modal } from "@/components/ui/Modal";
import { ApiError, experienceBookingsApi, experiencesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { BookingPaymentPayload } from "@/types/booking";
import type { ExperienceSlot } from "@/types/experience";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

type PaymentView = "form" | "getting-ready" | "reviewing";

export function ExperienceCheckoutDesktop({ experienceId }: { experienceId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  const slotId = Number(searchParams.get("slot"));
  const adults = Math.max(1, Number(searchParams.get("adults")) || 1);

  const [authOpen, setAuthOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [paymentPayload, setPaymentPayload] = useState<BookingPaymentPayload | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentView, setPaymentView] = useState<PaymentView>("form");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [waitNote, setWaitNote] = useState(false);
  const [slotConflict, setSlotConflict] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [guestDraft, setGuestDraft] = useState(adults);
  const [resolvedSlot, setResolvedSlot] = useState<ExperienceSlot | null>(null);

  const experienceQuery = useQuery({
    queryKey: ["experience", experienceId],
    queryFn: () => experiencesApi.get(experienceId),
  });

  const quoteQuery = useQuery({
    queryKey: ["experience-quote", slotId, adults],
    queryFn: () => experiencesApi.quote({ slot_id: slotId, adults }),
    enabled: Number.isInteger(slotId) && slotId > 0,
  });

  useEffect(() => {
    if (!Number.isInteger(slotId) || slotId < 1) return;
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 60);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    experiencesApi.slots(experienceId, { from: fmt(start), to: fmt(end), guests: adults }).then((groups) => {
      for (const g of groups) {
        const hit = g.slots.find((s) => s.id === slotId);
        if (hit) {
          setResolvedSlot(hit);
          return;
        }
      }
    });
  }, [experienceId, slotId, adults]);

  useEffect(() => {
    if (!authLoading && user && activeStep === 1) setActiveStep(2);
  }, [authLoading, user, activeStep]);

  useEffect(() => {
    setGuestDraft(adults);
  }, [adults]);

  const experience = experienceQuery.data;
  if (experienceQuery.error instanceof ApiError && experienceQuery.error.status === 404) notFound();
  if (!Number.isInteger(slotId) || slotId < 1) notFound();

  const slot = resolvedSlot;
  const quote = quoteQuery.data;

  const paymentLabel = useMemo(() => {
    if (!paymentPayload) return null;
    if (paymentPayload.payment_method_type === "card" && paymentPayload.card_brand && paymentPayload.card_last4) {
      return `${paymentPayload.card_brand} •••• ${paymentPayload.card_last4}`;
    }
    if (paymentPayload.payment_method_type === "upi") return "UPI";
    return "Net banking";
  }, [paymentPayload]);

  const bookMutation = useMutation({
    mutationFn: async (payment: BookingPaymentPayload) => {
      const started = Date.now();
      setPaymentProcessing(true);
      setPaymentView("getting-ready");
      setWaitNote(false);
      await sleep(600);
      setPaymentView("reviewing");
      const waitTimer = window.setTimeout(() => setWaitNote(true), 2000);
      try {
        const booking = await Promise.all([
          experienceBookingsApi.create({
            slot_id: slotId,
            adults,
            payment_method_type: payment.payment_method_type,
            card_brand: payment.card_brand,
            card_last4: payment.card_last4,
          }),
          sleep(Math.max(0, 1500 - (Date.now() - started))),
        ]).then(([result]) => result);
        return booking;
      } finally {
        window.clearTimeout(waitTimer);
      }
    },
    onSuccess: async (booking) => {
      await queryClient.invalidateQueries({ queryKey: ["trips"] });
      setPaymentOpen(false);
      setPaymentProcessing(false);
      setPaymentView("form");
      router.push(`/trips/experiences/${booking.id}?confirmed=1`);
    },
    onError: (error) => {
      setPaymentProcessing(false);
      setPaymentView("form");
      setWaitNote(false);
      if (error instanceof ApiError && error.status === 409) {
        setPaymentOpen(false);
        setSlotConflict(true);
        setTimeOpen(true);
        return;
      }
      toast.error("Something went wrong. Your card wasn't charged.");
    },
  });

  const onPaySaved = useCallback(
    (payload: BookingPaymentPayload) => {
      setPaymentPayload(payload);
      setPaymentOpen(false);
      setActiveStep(3);
    },
    [],
  );

  const confirmPay = () => {
    if (!paymentPayload || !quote) return;
    setPaymentOpen(true);
    setPaymentView("form");
    bookMutation.mutate(paymentPayload);
  };

  const applyGuests = () => {
    setGuestsOpen(false);
    router.replace(`/experiences/${experienceId}/book?slot=${slotId}&adults=${guestDraft}`);
  };

  const backHref = `/experiences/${experienceId}`;

  return (
    <>
      <CheckoutHeader />
      {slotConflict ? (
        <div className="border-b border-divider bg-[var(--bg-error)] px-6 py-3 text-center text-body text-error">
          This time is no longer available — choose another slot.
        </div>
      ) : null}
      <main className="mx-auto max-w-[1200px] px-6 pb-16 pt-8 min-[1440px]:px-10">
        <div className="grid grid-cols-[656px_464px] gap-20">
          <div className="space-y-4">
            <div className="mb-8 flex items-center gap-4">
              <Link
                href={backHref}
                aria-label="Back"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F7F7] text-ink hover:bg-quaternary-hover"
              >
                <ChevronLeft size={20} strokeWidth={2} />
              </Link>
              <h1 className="text-[32px] font-semibold leading-9 text-ink">Confirm and pay</h1>
            </div>

            {user ? (
              <div className="rounded-[var(--r-12)] border border-[#DDDDDD] bg-white p-6">
                <StepDone label={`1. Logged in as ${user.name}`} />
              </div>
            ) : (
              <StepCard
                active={activeStep === 1}
                title="1. Log in or sign up"
                action={
                  <button type="button" onClick={() => setAuthOpen(true)} className="search-fill rounded-lg px-5 py-2.5 text-sm font-semibold text-white">
                    Continue
                  </button>
                }
              />
            )}

            <StepCard
              active={activeStep === 2}
              title={paymentPayload ? "2. Payment method" : "2. Add a payment method"}
              action={
                paymentPayload ? (
                  <button type="button" className="text-sm font-semibold underline" onClick={() => setPaymentOpen(true)}>
                    Change
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!user}
                    onClick={() => {
                      setActiveStep(2);
                      setPaymentOpen(true);
                    }}
                    className="search-fill rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Add
                  </button>
                )
              }
            >
              {paymentPayload && paymentLabel ? <p className="text-sm text-ink">{paymentLabel}</p> : null}
            </StepCard>

            <StepCard
              active={activeStep === 3}
              title="3. Review your request"
            >
              {paymentPayload ? (
                <>
                  <p className="text-sm text-muted">You&apos;ll be charged {quote ? `₹${quote.total.toLocaleString("en-IN")}` : ""} when you confirm.</p>
                  <button
                    type="button"
                    onClick={confirmPay}
                    className="search-fill mt-4 w-full rounded-lg py-3.5 text-base font-semibold text-white"
                  >
                    Confirm and pay
                  </button>
                </>
              ) : (
                <p className="text-sm text-muted">Add a payment method to continue.</p>
              )}
            </StepCard>
          </div>

          <aside className="sticky top-24 self-start">
            {experience && slot ? (
              <ExperienceSummaryCard
                experience={experience}
                slot={slot}
                adults={adults}
                quote={quote}
                quoteLoading={quoteQuery.isFetching}
                onChangeGuests={() => setGuestsOpen(true)}
              />
            ) : (
              <div className="h-96 animate-pulse rounded-[var(--r-12)] bg-soft" />
            )}
          </aside>
        </div>
      </main>

      <SwitchUserModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {experience && quote ? (
        <SecurePaymentModal
          open={paymentOpen}
          onClose={() => {
            if (paymentProcessing) return;
            setPaymentOpen(false);
            setPaymentView("form");
          }}
          listingTitle={experience.title}
          amount={quote.total}
          processing={paymentProcessing}
          view={paymentView}
          waitNote={waitNote}
          onPay={onPaySaved}
        />
      ) : null}

      <SelectTimeModal
        open={timeOpen}
        onClose={() => setTimeOpen(false)}
        experienceId={experienceId}
        maxGuests={experience?.max_guests_per_slot ?? 10}
        minGuestAge={experience?.guest_requirements}
        onNext={(id, nextAdults) => {
          setTimeOpen(false);
          setSlotConflict(false);
          router.replace(`/experiences/${experienceId}/book?slot=${id}&adults=${nextAdults}`);
        }}
      />

      <Modal open={guestsOpen} title="Guests" onClose={() => setGuestsOpen(false)} size="md">
        <div className="flex items-center justify-between px-6 py-6">
          <div>
            <p className="font-semibold text-ink">Adults</p>
            <p className="text-sm text-muted">Age {experience?.guest_requirements ?? 13}+</p>
          </div>
          <Counter
            value={guestDraft}
            min={1}
            max={experience?.max_guests_per_slot ?? 10}
            onChange={setGuestDraft}
            variant="line"
          />
        </div>
        <div className="border-t border-hairline px-6 py-4">
          <button type="button" onClick={applyGuests} className="w-full rounded-lg bg-ink py-3 font-semibold text-white">
            Update
          </button>
        </div>
      </Modal>
    </>
  );
}
