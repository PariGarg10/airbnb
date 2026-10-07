"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import { ArrowLeft, Eye, Settings } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrivalGuide } from "@/components/host/editor/ArrivalGuide";
import { cloneDraft, sectionIsDirty, sectionSnapshot } from "@/components/host/editor/draftSnapshot";
import { EditorCard } from "@/components/host/editor/EditorCard";
import { EditorUiProvider } from "@/components/host/editor/editorUi";
import { PreferencesView } from "@/components/host/editor/PreferencesView";
import { RemoveListingModal } from "@/components/host/editor/RemoveListingModal";
import { SectionPanel } from "@/components/host/editor/SectionPanel";
import { sectionsFor, type EditorContext } from "@/components/host/editor/sectionConfig";
import { toListingInput } from "@/components/host/wizard/listingInput";
import { useWizard } from "@/components/host/wizard/WizardContext";
import { Button } from "@/components/ui/Button";
import { GlidePill } from "@/components/ui/Glide";
import { Modal } from "@/components/ui/Modal";
import { ApiError, hostApi, listingsApi } from "@/lib/api";

type TabName = "space" | "arrival";

type UrlNav = {
  kind?: "url";
  section?: string;
  tab?: TabName;
  view?: "preferences" | null;
  openPanel?: boolean;
  openRemove?: boolean;
};

type Nav = UrlNav | { kind: "leave"; href: string };

export function EditorLayout({
  listingId,
  hostName,
  joinedYear,
  avatarUrl,
}: {
  listingId: number;
  hostName: string;
  joinedYear: number;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const { draft, patch } = useWizard();
  const amenities = useQuery({ queryKey: ["amenities"], queryFn: listingsApi.amenities });

  const view = params.get("view") === "preferences" ? "preferences" : null;
  const tab: TabName = params.get("tab") === "arrival" ? "arrival" : "space";
  const list = sectionsFor(view ? "preferences" : tab);
  const current = list.find((section) => section.id === params.get("section")) ?? list[0];

  const [saved, setSaved] = useState(() => cloneDraft(draft));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ask, setAsk] = useState<Nav | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const dirty = current.editable && sectionIsDirty(draft, saved, current.fields);
  const closeDiscard = useCallback(() => setAsk(null), []);
  const closeRemove = useCallback(() => setRemoveOpen(false), []);
  const ui = useMemo(
    () => ({ openRemove: () => setRemoveOpen(true), hostName, joinedYear, avatarUrl }),
    [hostName, joinedYear, avatarUrl],
  );
  const ctx: EditorContext = useMemo(
    () => ({
      draft,
      amenities: amenities.data ?? [],
      hostName,
      joinedYear,
      avatarUrl,
    }),
    [draft, amenities.data, hostName, joinedYear, avatarUrl],
  );

  const apply = useCallback(
    (next: Nav) => {
      if (next.kind === "leave") {
        router.push(next.href);
        return;
      }
      const nextView = next.view === undefined ? view : next.view;
      const nextTab = next.tab ?? tab;
      const fallback = nextView ? "residential-address" : nextTab === "arrival" ? "checkin" : "photos";
      const nextSection = next.section ?? fallback;
      const query = new URLSearchParams();
      if (nextView) query.set("view", "preferences");
      if (nextTab === "arrival") query.set("tab", "arrival");
      query.set("section", nextSection);
      setMobileOpen(Boolean(next.openPanel));
      if (next.openRemove) setRemoveOpen(true);
      router.push(`${pathname}?${query.toString()}`, { scroll: false });
    },
    [pathname, router, tab, view],
  );

  const requestNav = (next: Nav) => {
    if (next.kind !== "leave") {
      const nextView = next.view === undefined ? view : next.view;
      const nextTab = next.tab ?? tab;
      const nextSection = next.section ?? current.id;
      if (nextView === view && nextTab === tab && nextSection === current.id) {
        if (next.openPanel) setMobileOpen(true);
        if (next.openRemove) setRemoveOpen(true);
        return;
      }
    }
    if (dirty) {
      setAsk(next);
      return;
    }
    apply(next);
  };

  const confirmDiscard = () => {
    if (!ask) return;
    if (current.fields?.length) patch(sectionSnapshot(saved, current.fields));
    const pending = ask;
    setAsk(null);
    setError(null);
    apply(pending);
  };

  const save = async () => {
    if (!current.editable) return;
    const message = current.validate?.(draft) ?? null;
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    try {
      await hostApi.updateListing(listingId, toListingInput(draft));
      setSaved(cloneDraft(draft));
      setError(null);
      toast.success("Saved");
      await queryClient.invalidateQueries({ queryKey: ["listing", listingId] });
      await queryClient.invalidateQueries({ queryKey: ["host-listings"] });
      await queryClient.invalidateQueries({ queryKey: ["listings"] });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 422)) setError(err.detail);
      else toast.error(err instanceof ApiError ? err.detail : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const Panel = current.Editor;
  const spaceCards = sectionsFor("space");
  const arrivalCards = sectionsFor("arrival");

  return (
    <EditorUiProvider value={ui}>
      <div className="flex h-[calc(100dvh-5rem)] overflow-hidden bg-white">
        <aside
          className={clsx(
            "relative h-full w-full shrink-0 flex-col border-r border-hairline md:flex md:w-[420px]",
            mobileOpen ? "hidden md:flex" : "flex",
          )}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 pb-28">
            {view ? (
              <PreferencesView
                selectedId={current.id}
                onBack={() =>
                  requestNav({
                    view: null,
                    section: tab === "arrival" ? "checkin" : "photos",
                    openPanel: false,
                  })
                }
                onSelect={(id) =>
                  requestNav({
                    view: "preferences",
                    section: id,
                    openPanel: true,
                    openRemove: id === "remove",
                  })
                }
              />
            ) : (
              <>
                <button
                  type="button"
                  aria-label="Back to listings"
                  onClick={() => requestNav({ kind: "leave", href: "/host/listings" })}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-soft"
                >
                  <ArrowLeft size={18} />
                </button>
                <h1 className="t-page-title mt-4">Listing editor</h1>
                <div className="mt-5 flex items-center gap-3">
                  <GlidePill active={tab} className="flex flex-1 rounded-full bg-soft p-1">
                    <button
                      type="button"
                      data-glide="space"
                      onClick={() => {
                        if (tab === "space") return;
                        requestNav({ tab: "space", view: null, section: "photos", openPanel: false });
                      }}
                      className="relative z-10 flex-1 rounded-full px-3 py-2 text-body font-medium text-ink"
                    >
                      Your space
                    </button>
                    <button
                      type="button"
                      data-glide="arrival"
                      onClick={() => {
                        if (tab === "arrival") return;
                        requestNav({ tab: "arrival", view: null, section: "checkin", openPanel: false });
                      }}
                      className="relative z-10 flex-1 rounded-full px-3 py-2 text-body font-medium text-ink"
                    >
                      Arrival guide
                    </button>
                  </GlidePill>
                  <button
                    type="button"
                    aria-label="Edit preferences"
                    onClick={() => requestNav({ view: "preferences", section: "languages", openPanel: false })}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-soft"
                  >
                    <Settings size={18} />
                  </button>
                </div>
                {tab === "arrival" ? (
                  <ArrivalGuide
                    cards={arrivalCards.map((section) => ({
                      id: section.id,
                      title: section.title,
                      summary: section.summary(ctx),
                      split: section.split,
                      selected: section.id === current.id,
                      onSelect: () => requestNav({ section: section.id, openPanel: true }),
                    }))}
                  />
                ) : (
                  <div className="mt-6 space-y-4">
                    {spaceCards.map((section) => (
                      <EditorCard
                        key={section.id}
                        title={section.title}
                        summary={section.summary(ctx)}
                        selected={section.id === current.id}
                        onClick={() => requestNav({ section: section.id, openPanel: true })}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          {view ? null : (
            <a
              href={`/listings/${listingId}`}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-6 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 t-button text-white shadow-pill"
            >
              <Eye size={16} />
              View
            </a>
          )}
        </aside>

        <section className={clsx("min-w-0 flex-1 flex-col", mobileOpen ? "fixed inset-0 z-40 flex bg-white md:static" : "hidden md:flex")}>
          <SectionPanel
            title={current.title}
            error={error}
            editable={current.editable}
            dirty={dirty}
            saving={saving}
            onSave={save}
            onMobileBack={() => setMobileOpen(false)}
          >
            <Panel />
          </SectionPanel>
        </section>
      </div>

      <Modal open={ask !== null} title="Discard changes?" onClose={closeDiscard}>
        <p className="text-meta text-muted">Your unsaved edits in this section will be lost.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={closeDiscard}>
            Keep editing
          </Button>
          <Button className="!bg-ink !bg-none" onClick={confirmDiscard}>
            Discard
          </Button>
        </div>
      </Modal>
      <RemoveListingModal listingId={listingId} open={removeOpen} onClose={closeRemove} />
    </EditorUiProvider>
  );
}
