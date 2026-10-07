"use client";

import { Hourglass } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  cardBrandLabel,
  cardLast4,
  cvvValid,
  detectCardBrand,
  digitsOnly,
  expiryValid,
  formatCardNumber,
  luhnValid,
  type CardBrand,
} from "@/lib/cardValidation";
import { formatInr } from "@/lib/format";
import type { BookingPaymentPayload, PaymentMethodType } from "@/types/booking";

const COUNTRIES = ["India", "United States", "United Kingdom", "Canada", "Australia", "Singapore", "United Arab Emirates"];
const BANKS = ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra Bank", "Punjab National Bank"];

type Tab = PaymentMethodType;
type View = "form" | "getting-ready" | "reviewing";

export interface SecurePaymentModalProps {
  open: boolean;
  onClose: () => void;
  listingTitle: string;
  amount: number;
  processing: boolean;
  view: View;
  waitNote: boolean;
  onPay: (payload: BookingPaymentPayload) => void;
}

function BrandMark({ brand }: { brand: CardBrand }) {
  const label = cardBrandLabel(brand);
  return (
    <span className="rounded border border-hairline px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
      {label}
    </span>
  );
}

export function SecurePaymentModal({
  open,
  onClose,
  listingTitle,
  amount,
  processing,
  view,
  waitNote,
  onPay,
}: SecurePaymentModalProps) {
  const [tab, setTab] = useState<Tab>("card");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("India");
  const [upi, setUpi] = useState("");
  const [bank, setBank] = useState(BANKS[0]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempt, setSubmitAttempt] = useState(false);
  const titleId = useId();
  const brand = detectCardBrand(number);

  useEffect(() => {
    if (!open) {
      setTab("card");
      setNumber("");
      setExpiry("");
      setCvv("");
      setPostcode("");
      setUpi("");
      setTouched({});
      setSubmitAttempt(false);
    }
  }, [open]);

  const showErr = (key: string) => touched[key] || submitAttempt;

  const cardErrors = () => {
    const e: Record<string, string> = {};
    const d = digitsOnly(number);
    if (!luhnValid(d)) e.number = "Enter a valid card number";
    if (!expiryValid(expiry)) e.expiry = "Use MM/YY";
    if (!cvvValid(cvv, brand)) e.cvv = brand === "amex" ? "Enter 4 digits" : "Enter 3 or 4 digits";
    if (!/^[A-Za-z0-9 -]{3,10}$/.test(postcode.trim())) e.postcode = "Enter a valid postcode";
    if (!country) e.country = "Choose a country";
    return e;
  };

  const upiError = () => {
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(upi.trim())) return null;
    return "Enter a valid UPI ID (name@bank)";
  };

  const payLabel = `Pay ${formatInr(amount)}`;

  const handlePay = () => {
    setSubmitAttempt(true);
    if (tab === "card") {
      const errors = cardErrors();
      if (Object.keys(errors).length > 0) return;
      onPay({
        payment_method_type: "card",
        card_brand: cardBrandLabel(brand),
        card_last4: cardLast4(number),
      });
      return;
    }
    if (tab === "upi") {
      if (upiError()) return;
      onPay({ payment_method_type: "upi" });
      return;
    }
    if (!bank) return;
    onPay({ payment_method_type: "netbanking" });
  };

  const locked = processing || view !== "form";

  return (
    <Modal
      open={open}
      title=""
      onClose={locked ? () => {} : onClose}
      size="lg"
      hideHeader
      zIndex={70}
    >
      <div className="px-2 pb-2 pt-4">
        {view === "form" ? (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-divider pb-4">
              <div>
                <p className="text-[22px] font-semibold leading-[26px] text-ink">Pay {formatInr(amount)}</p>
                <p className="mt-1 line-clamp-2 text-body text-muted">{listingTitle}</p>
              </div>
              {!locked ? (
                <button type="button" aria-label="Close" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-soft">
                  ×
                </button>
              ) : null}
            </div>

            <div className="mt-4 flex gap-2 border-b border-divider">
              {(["card", "upi", "netbanking"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={`border-b-2 px-3 pb-3 text-sm font-semibold capitalize ${
                    tab === item ? "border-ink text-ink" : "border-transparent text-muted"
                  }`}
                >
                  {item === "netbanking" ? "Net banking" : item === "upi" ? "UPI" : "Card"}
                </button>
              ))}
            </div>

            {tab === "card" ? (
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-label font-semibold text-muted">Card number</span>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-faint px-3 py-3 focus-within:border-ink focus-within:ring-2 focus-within:ring-ink">
                    <input
                      inputMode="numeric"
                      autoComplete="cc-number"
                      value={formatCardNumber(number)}
                      onBlur={() => setTouched((t) => ({ ...t, number: true }))}
                      onChange={(e) => setNumber(digitsOnly(e.target.value).slice(0, brand === "amex" ? 15 : 16))}
                      className="min-w-0 flex-1 bg-transparent text-body outline-none"
                      placeholder="1234 5678 9012 3456"
                    />
                    <BrandMark brand={brand} />
                  </div>
                  {showErr("number") && cardErrors().number ? (
                    <p className="mt-1 text-label text-error">{cardErrors().number}</p>
                  ) : null}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-label font-semibold text-muted">Expiration</span>
                    <input
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/YY"
                      value={expiry}
                      onBlur={() => setTouched((t) => ({ ...t, expiry: true }))}
                      onChange={(e) => {
                        const next = digitsOnly(e.target.value).slice(0, 4);
                        setExpiry(next.length <= 2 ? next : `${next.slice(0, 2)}/${next.slice(2)}`);
                      }}
                      className="mt-1 w-full rounded-xl border border-faint px-3 py-3 text-body outline-none focus:border-ink focus:ring-2 focus:ring-ink"
                    />
                    {showErr("expiry") && cardErrors().expiry ? (
                      <p className="mt-1 text-label text-error">{cardErrors().expiry}</p>
                    ) : null}
                  </label>
                  <label className="block">
                    <span className="text-label font-semibold text-muted">CVV</span>
                    <input
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      value={cvv}
                      onBlur={() => setTouched((t) => ({ ...t, cvv: true }))}
                      onChange={(e) => setCvv(digitsOnly(e.target.value).slice(0, brand === "amex" ? 4 : 4))}
                      className="mt-1 w-full rounded-xl border border-faint px-3 py-3 text-body outline-none focus:border-ink focus:ring-2 focus:ring-ink"
                    />
                    {showErr("cvv") && cardErrors().cvv ? (
                      <p className="mt-1 text-label text-error">{cardErrors().cvv}</p>
                    ) : null}
                  </label>
                </div>
                <label className="block">
                  <span className="text-label font-semibold text-muted">Postcode</span>
                  <input
                    value={postcode}
                    onBlur={() => setTouched((t) => ({ ...t, postcode: true }))}
                    onChange={(e) => setPostcode(e.target.value.slice(0, 10))}
                    className="mt-1 w-full rounded-xl border border-faint px-3 py-3 text-body outline-none focus:border-ink focus:ring-2 focus:ring-ink"
                  />
                  {showErr("postcode") && cardErrors().postcode ? (
                    <p className="mt-1 text-label text-error">{cardErrors().postcode}</p>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-label font-semibold text-muted">Country</span>
                  <select
                    value={country}
                    onBlur={() => setTouched((t) => ({ ...t, country: true }))}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-faint px-3 py-3 text-body outline-none focus:border-ink"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            {tab === "upi" ? (
              <div className="mt-4">
                <label className="block">
                  <span className="text-label font-semibold text-muted">UPI ID</span>
                  <input
                    value={upi}
                    onBlur={() => setTouched((t) => ({ ...t, upi: true }))}
                    onChange={(e) => setUpi(e.target.value)}
                    placeholder="yourname@bank"
                    className="mt-1 w-full rounded-xl border border-faint px-3 py-3 text-body outline-none focus:border-ink focus:ring-2 focus:ring-ink"
                  />
                  {showErr("upi") && upiError() ? <p className="mt-1 text-label text-error">{upiError()}</p> : null}
                </label>
              </div>
            ) : null}

            {tab === "netbanking" ? (
              <div className="mt-4">
                <label className="block">
                  <span className="text-label font-semibold text-muted">Bank</span>
                  <select
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-faint px-3 py-3 text-body outline-none focus:border-ink"
                  >
                    {BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            <p className="mt-4 text-meta text-muted">Payments are simulated — no real charge</p>
            <Button className="mt-4 w-full bg-ink py-3.5 text-white hover:bg-inverse-hover" onClick={handlePay}>
              {payLabel}
            </Button>
          </>
        ) : null}

        {view === "getting-ready" ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex gap-1" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2 w-2 animate-pulse rounded-full bg-[#008a05]" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
            <p id={titleId} className="mt-6 text-[22px] font-semibold leading-[26px] text-ink">
              Just a moment, we&apos;re getting your trip ready
            </p>
          </div>
        ) : null}

        {view === "reviewing" ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-12 text-center">
            <p className="text-[22px] font-semibold leading-[26px] text-ink">Reviewing payment details</p>
            <div className="relative mt-8 flex h-20 w-20 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full animate-spin" viewBox="0 0 80 80" aria-hidden>
                <circle cx="40" cy="40" r="34" fill="none" stroke="#ffdfe8" strokeWidth="4" />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="80 140"
                />
              </svg>
              <Hourglass size={28} className="relative text-ink" strokeWidth={1.75} />
            </div>
            {waitNote ? (
              <p className="mt-8 max-w-sm text-body text-muted">
                This may take a minute. Please don&apos;t close or refresh.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
