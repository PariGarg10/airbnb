"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SwitchUserModal } from "@/components/auth/SwitchUserModal";
import { ChangeDatesModal } from "@/components/checkout/ChangeDatesModal";
import { ChangeGuestsModal } from "@/components/checkout/ChangeGuestsModal";
import { CheckoutHeader } from "@/components/checkout/CheckoutHeader";
import { CouponModal } from "@/components/checkout/CouponModal";
import { MessageToHost } from "@/components/checkout/MessageToHost";
import { PolicyModal } from "@/components/checkout/PolicyModal";
import { PriceBreakdownModal } from "@/components/checkout/PriceBreakdownModal";
import { SecurePaymentModal } from "@/components/checkout/SecurePaymentModal";
import { TermsModal } from "@/components/checkout/TermsModal";
import { TripSummaryCard } from "@/components/checkout/TripSummaryCard";
import { Divider } from "@/components/ui/Divider";
import { useCheckoutParams } from "@/hooks/useCheckoutParams";
import { useCheckoutQuote } from "@/hooks/useCheckoutQuote";
import { ApiError, bookingsApi, listingsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toCheckoutQuote } from "@/lib/checkoutQuote";
import { clearCheckoutMessage, loadCheckoutMessage, saveCheckoutMessage } from "@/lib/checkoutMessageStorage";
import type { BookingPaymentPayload } from "@/types/booking";

interface CheckoutDesktopProps {
  listingId: number;
}

type PaymentView = "form" | "getting-ready" | "reviewing";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function CheckoutDesktop({ listingId }: CheckoutDesktopProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const { checkIn, checkOut, coupon, guests, guestCount, setCheckout, listingBackQuery } = useCheckoutParams();
  const [authOpen, setAuthOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [datesBanner, setDatesBanner] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentView, setPaymentView] = useState<PaymentView>("form");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [waitNote, setWaitNote] = useState(false);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const messageHydrated = useRef(false);

  const listingQuery = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => listingsApi.get(listingId),
  });
  const bookedQuery = useQuery({
    queryKey: ["booked-dates", listingId],
    queryFn: () => listingsApi.bookedDates(listingId),
  });

  const quoteQuery = useCheckoutQuote({
    listingId,
    checkIn: checkIn ?? "",
    checkOut: checkOut ?? "",
    guests: guestCount,
    coupon,
  });

  useEffect(() => {
    if (!authLoading && !user) setAuthOpen(true);
  }, [authLoading, user]);

  useEffect(() => {
    if (messageHydrated.current) return;
    messageHydrated.current = true;
    const saved = loadCheckoutMessage(listingId);
    if (saved) setMessage(saved);
  }, [listingId]);

  useEffect(() => {
    if (!messageHydrated.current) return;
    saveCheckoutMessage(listingId, message);
  }, [listingId, message]);

  useEffect(() => {
    if (!paymentProcessing) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [paymentProcessing]);

  const listing = listingQuery.data;
  if (listingQuery.error instanceof ApiError && listingQuery.error.status === 404) notFound();

  const quoteError = quoteQuery.error instanceof ApiError ? quoteQuery.error : null;
  const datesUnavailable = quoteError?.status === 409;
  const quote = quoteQuery.data ? toCheckoutQuote(quoteQuery.data) : undefined;
  const ownListing = Boolean(user && listing && user.id === listing.host.id);

  const isRequestFlow = listing ? !listing.instant_book : true;
  const title = isRequestFlow ? "Request to book" : "Confirm and pay";
  const backHref = `/listings/${listingId}${listingBackQuery ? `?${listingBackQuery}` : ""}`;

  const runPayment = useMutation({
    mutationFn: async (payment: BookingPaymentPayload) => {
      if (!checkIn || !checkOut || !listing) throw new Error("missing stay");
      const started = Date.now();
      setPaymentProcessing(true);
      setPaymentView("getting-ready");
      setWaitNote(false);
      await sleep(600);
      setPaymentView("reviewing");
      const waitTimer = window.setTimeout(() => setWaitNote(true), 2000);
      try {
        const booking = await Promise.all([
          bookingsApi.create({
            listing_id: listingId,
            check_in: checkIn,
            check_out: checkOut,
            adults: guests.adults,
            children: guests.children,
            infants: guests.infants,
            pets: guests.pets,
            message_to_host: isRequestFlow ? message.trim() : undefined,
            coupon_code: coupon,
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
      clearCheckoutMessage(listingId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["booked-dates", listingId] }),
        queryClient.invalidateQueries({ queryKey: ["quote"] }),
        queryClient.invalidateQueries({ queryKey: ["trips"] }),
      ]);
      setPaymentOpen(false);
      setPaymentProcessing(false);
      setPaymentView("form");
      if (booking.status === "pending") router.push(`/trips/${booking.id}?requested=1`);
      else router.push(`/trips/${booking.id}?confirmed=1`);
    },
    onError: (error) => {
      setPaymentProcessing(false);
      setPaymentView("form");
      setWaitNote(false);
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setPaymentOpen(false);
          setDatesBanner(true);
          setDatesOpen(true);
          void queryClient.invalidateQueries({ queryKey: ["quote", listingId] });
          void queryClient.invalidateQueries({ queryKey: ["booked-dates", listingId] });
          return;
        }
        if (error.status === 400) {
          toast.error(error.detail);
          return;
        }
      }
      toast.error("Something went wrong. Your card wasn’t charged.");
    },
  });

  const handleMainClick = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (ownListing) return;
    if (datesUnavailable || !quote || !checkIn || !checkOut) return;
    if (isRequestFlow && !message.trim()) {
      setMessageError("Add a message to the host before you continue.");
      messageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      messageRef.current?.focus();
      return;
    }
    setMessageError(null);
    setPaymentOpen(true);
    setPaymentView("form");
  };

  const onPay = useCallback(
    (payload: BookingPaymentPayload) => {
      runPayment.mutate(payload);
    },
    [runPayment],
  );

  return (
    <>
      <CheckoutHeader />
      {datesBanner ? (
        <div className="border-b border-divider bg-[var(--bg-error)] px-6 py-3 text-center text-body text-error">
          Those dates are no longer available
        </div>
      ) : null}
      <main className="mx-auto max-w-[1200px] px-6 pb-16 pt-8 min-[1440px]:px-10">
        <div className="grid grid-cols-[656px_464px] gap-20">
          <div>
            <div className="flex items-center gap-4">
              <Link
                href={backHref}
                aria-label="Back to listing"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-soft text-ink hover:bg-quaternary-hover"
              >
                <ChevronLeft size={20} strokeWidth={2} />
              </Link>
              <h1 className="text-page font-semibold text-ink">{title}</h1>
            </div>

            {ownListing ? (
              <p className="mt-8 rounded-xl border border-hairline bg-soft px-4 py-3 text-body font-medium text-ink">
                You can&apos;t book your own listing
              </p>
            ) : null}

            {isRequestFlow && listing && !ownListing ? (
              <div className="mt-8">
                <MessageToHost
                  ref={messageRef}
                  host={listing.host}
                  value={message}
                  onChange={setMessage}
                  error={messageError ?? undefined}
                />
              </div>
            ) : null}

            {!ownListing ? (
              <>
                <section className={isRequestFlow ? "mt-10" : "mt-8"}>
                  <h2 className="text-section font-semibold text-ink">Proceed to payment</h2>
                  <p className="mt-2 text-body text-muted">You&apos;ll be directed to a secure payment page to complete payment.</p>
                  <p className="mt-4 text-body text-muted">
                    {isRequestFlow
                      ? "The host has 24 hours to accept your request. You’ll pay now, but get a full refund if the booking isn’t confirmed."
                      : "Your booking will be confirmed immediately after payment."}
                  </p>
                </section>

                <Divider className="my-8" />

                <p className="text-body text-ink">
                  By selecting the button, I agree to the{" "}
                  <button type="button" className="underline underline-offset-4" onClick={() => setTermsOpen(true)}>
                    booking terms
                  </button>
                  .
                </p>

                <button
                  type="button"
                  onClick={handleMainClick}
                  className="search-fill mt-6 flex h-14 w-full items-center justify-center rounded-lg text-[18px] font-semibold text-white disabled:opacity-50"
                  disabled={datesUnavailable || (quoteQuery.isFetching && !quote) || ownListing}
                >
                  {title}
                </button>
              </>
            ) : null}
          </div>

          <aside className="sticky top-24 self-start">
            {listing ? (
              <TripSummaryCard
                listing={listing}
                quote={quote}
                quoteLoading={quoteQuery.isFetching}
                datesUnavailable={datesUnavailable}
                checkIn={checkIn}
                checkOut={checkOut}
                guests={guests}
                onChangeDates={() => setDatesOpen(true)}
                onChangeGuests={() => setGuestsOpen(true)}
                onManageCoupons={() => setCouponOpen(true)}
                onPriceBreakdown={() => setBreakdownOpen(true)}
                onPolicy={() => setPolicyOpen(true)}
              />
            ) : (
              <div className="h-96 animate-pulse rounded-3xl bg-soft" />
            )}
          </aside>
        </div>
      </main>

      {listing && checkIn && checkOut && quote ? (
        <SecurePaymentModal
          open={paymentOpen}
          onClose={() => {
            if (paymentProcessing) return;
            setPaymentOpen(false);
            setPaymentView("form");
          }}
          listingTitle={listing.title}
          amount={quote.total}
          processing={paymentProcessing}
          view={paymentView}
          waitNote={waitNote}
          onPay={onPay}
        />
      ) : null}

      {listing && checkIn && checkOut ? (
        <>
          <ChangeDatesModal
            open={datesOpen}
            onClose={() => setDatesOpen(false)}
            checkIn={checkIn}
            checkOut={checkOut}
            booked={bookedQuery.data ?? []}
            onSave={(nextIn, nextOut) => {
              setDatesBanner(false);
              setCheckout({ check_in: nextIn, check_out: nextOut });
            }}
          />
          <ChangeGuestsModal
            open={guestsOpen}
            onClose={() => setGuestsOpen(false)}
            value={guests}
            maxGuests={listing.max_guests}
            allowsPets={listing.allows_pets}
            onSave={(next) =>
              setCheckout({
                adults: next.adults,
                children: next.children,
                infants: next.infants,
                pets: next.pets,
              })
            }
          />
          {quote ? (
            <PriceBreakdownModal
              open={breakdownOpen}
              onClose={() => setBreakdownOpen(false)}
              quote={quote}
              checkIn={checkIn}
              checkOut={checkOut}
            />
          ) : null}
          <CouponModal
            open={couponOpen}
            onClose={() => setCouponOpen(false)}
            listingId={listingId}
            checkIn={checkIn}
            checkOut={checkOut}
            appliedCode={coupon}
            onApply={(code) => setCheckout({ coupon: code })}
            onRemove={() => setCheckout({ coupon: null })}
          />
        </>
      ) : null}

      <PolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} />
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
      <SwitchUserModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
