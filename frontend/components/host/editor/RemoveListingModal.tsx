"use client";

import { useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { ApiError, hostApi } from "@/lib/api";
import { APP_NAME } from "@/lib/brand";

const GROUPS = [
  {
    id: "able",
    title: "I'm no longer able to host.",
    items: [
      "I don't currently have a property to list.",
      "Legally, I'm no longer able to host.",
      "My neighbours have made it hard for me to host.",
      "Hosting no longer fits my lifestyle.",
      "Another reason",
    ],
  },
  {
    id: "ready",
    title: "I'm not ready to host right now.",
    items: [
      "I only host occasionally.",
      "I've created my listing but need to get my property ready to host guests.",
      "I'm renovating my place or making improvements.",
      "Another reason",
    ],
  },
  {
    id: "expected",
    title: `I expected more from ${APP_NAME}.`,
    items: [
      `I was hoping for better customer support from ${APP_NAME} as a host.`,
      `I no longer trust ${APP_NAME} to treat hosts fairly.`,
      `I wanted more supportive resources from ${APP_NAME}.`,
      `I think ${APP_NAME} can improve its policies.`,
      "Another reason",
    ],
  },
  {
    id: "money",
    title: "I was hoping to make more money.",
    items: [
      "Managing the property was more work than I anticipated.",
      "Dealing with taxes was too much work.",
      "The local registration process was too much work.",
      "I hoped to get more bookings.",
      "I expected to make more money.",
      "Another reason",
    ],
  },
  {
    id: "guests",
    title: "I expected things to go more smoothly with guests.",
    items: [
      "Guests didn't follow my house rules.",
      "Guests stole or damaged my property.",
      "Guests cancelled their reservations too often.",
      "Guests were rude or demanding.",
      "Guests left unfair reviews.",
      "Another reason",
    ],
  },
  {
    id: "duplicate",
    title: "This is a duplicate listing.",
    items: ["This is a duplicate listing."],
  },
];

export function RemoveListingModal({
  listingId,
  open,
  onClose,
}: {
  listingId: number;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"reasons" | "confirm">("reasons");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ able: true });
  const [checked, setChecked] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setStep("reasons");
    setOpenGroups({ able: true });
    setChecked([]);
    setPending(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const toggle = (id: string) => setOpenGroups((current) => ({ ...current, [id]: !current[id] }));
  const toggleItem = (item: string, groupId: string) => {
    const key = `${groupId}:${item}`;
    setChecked((current) => (current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key]));
  };

  const confirm = async () => {
    setPending(true);
    try {
      const result = await hostApi.deleteListing(listingId);
      toast.success(
        result.deleted === "hard" ? "Listing removed" : "Listing deactivated because it has bookings",
      );
      await queryClient.invalidateQueries({ queryKey: ["host-listings"] });
      await queryClient.invalidateQueries({ queryKey: ["listings"] });
      router.push("/host/listings");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not remove this listing");
      setPending(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-listing-title"
        className="relative flex max-h-[90vh] w-full max-w-[640px] flex-col rounded-t-3xl bg-white shadow-[0_8px_28px_rgba(0,0,0,0.28)] sm:rounded-3xl"
      >
        {step === "reasons" ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-8">
              <h2 id="remove-listing-title" className="t-subheading">
                {"Let us know why you've changed your mind about hosting"}
              </h2>
              <p className="mt-2 text-meta text-muted">Choose all that apply</p>
              <div className="mt-6">
                {GROUPS.map((group) => {
                  const expanded = Boolean(openGroups[group.id]);
                  return (
                    <div key={group.id} className="border-b border-hairline">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-4 py-4 text-left font-medium"
                        aria-expanded={expanded}
                        onClick={() => toggle(group.id)}
                      >
                        {group.title}
                        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      {expanded ? (
                        <div className="pb-3">
                          {group.items.map((item) => {
                            const key = `${group.id}:${item}`;
                            return (
                              <label key={key} className="flex items-start gap-3 py-2.5">
                                <input
                                  type="checkbox"
                                  checked={checked.includes(key)}
                                  onChange={() => toggleItem(item, group.id)}
                                  className="mt-0.5 h-5 w-5 rounded-sm border-hairline accent-ink"
                                />
                                <span>{item}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-between border-t border-hairline px-6 py-4">
              <button type="button" onClick={onClose} className="t-link underline-offset-2">
                Cancel
              </button>
              <button
                type="button"
                disabled={checked.length === 0}
                onClick={() => setStep("confirm")}
                className={clsx(
                  "rounded-lg px-6 py-3 text-body font-semibold",
                  checked.length === 0 ? "cursor-not-allowed bg-soft text-muted" : "bg-ink text-white",
                )}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="px-6 py-8">
            <h2 id="remove-listing-title" className="t-subheading">
              Remove this listing?
            </h2>
            <p className="mt-3 text-meta text-muted">
              If this listing has bookings, it will be deactivated instead so guests keep their trip history.
            </p>
            <div className="mt-8 flex items-center justify-between">
              <button type="button" onClick={() => setStep("reasons")} className="t-link underline-offset-2">
                Back
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={confirm}
                className="search-fill t-button rounded-lg px-5 py-3 text-white disabled:opacity-60"
              >
                {pending ? "Removing…" : "Remove listing"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
