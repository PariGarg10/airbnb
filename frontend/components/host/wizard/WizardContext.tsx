"use client";

import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import { useListingDraft, type ListingDraft } from "@/hooks/useListingDraft";

interface WizardContextValue {
  draft: ListingDraft;
  patch: (next: Partial<ListingDraft>) => void;
  setStep: (step: number) => void;
  clear: () => void;
  registerAddressOpener: (opener: (() => void) | null) => void;
  openAddressModal: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({
  children,
  storageKey,
  initial,
}: {
  children: React.ReactNode;
  storageKey?: string | null;
  initial?: Partial<ListingDraft>;
}) {
  const draftApi = useListingDraft({ storageKey, initial });
  const opener = useRef<(() => void) | null>(null);
  const registerAddressOpener = useCallback((next: (() => void) | null) => {
    opener.current = next;
  }, []);
  const openAddressModal = useCallback(() => {
    opener.current?.();
  }, []);
  const value = useMemo<WizardContextValue>(
    () => ({ ...draftApi, registerAddressOpener, openAddressModal }),
    [draftApi, openAddressModal, registerAddressOpener],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard(): WizardContextValue {
  const value = useContext(WizardContext);
  if (!value) throw new Error("useWizard must be used within WizardProvider");
  return value;
}
