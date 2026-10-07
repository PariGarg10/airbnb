"use client";

import { Camera, MoreHorizontal, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EditPhotoModal } from "@/components/host/steps/EditPhotoModal";
import { UploadPhotosModal } from "@/components/host/steps/UploadPhotosModal";
import { StepShell } from "@/components/host/wizard/StepShell";
import { useWizard } from "@/components/host/wizard/WizardContext";
import { appendImages, draftImagesFromDraft, moveImages, patchImages, type DraftImage } from "@/lib/draftImages";
import { propertyLabel } from "@/lib/format";

const TIP_KEY = "host_photos_lead_tip";

type GalleryPhase = "arranging" | "skeleton" | "ready";

export function PhotosStep() {
  const { draft, patch } = useWizard();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<number | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<GalleryPhase>("ready");
  const [showTip, setShowTip] = useState(false);
  const dragIndex = useRef<number | null>(null);

  const place = draft.property_type ? propertyLabel(draft.property_type).toLowerCase() : "place";
  const images = draftImagesFromDraft(draft);
  const remaining = Math.max(0, 20 - images.length);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShowTip(window.localStorage.getItem(TIP_KEY) !== "1");
  }, []);

  useEffect(() => {
    if (menu === null) return;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menu]);

  const applyImages = (next: DraftImage[]) => patch(patchImages(next));

  const onUploaded = (urls: string[]) => {
    patch(appendImages(draft, urls));
    setPhase("arranging");
    window.setTimeout(() => setPhase("skeleton"), 700);
    window.setTimeout(() => setPhase("ready"), 1400);
  };

  const reorder = (from: number, to: number) => applyImages(moveImages(images, from, to));

  if (images.length === 0) {
    return (
      <>
        <StepShell
          wide
          title={`Add some photos of your ${place}`}
          subtitle="You'll need 5 photos to get started. You can add more or make changes later."
        >
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-hairline bg-soft px-6 min-[1128px]:min-h-[480px] min-[1128px]:rounded-3xl">
            <Camera size={56} strokeWidth={1.25} className="text-muted min-[1128px]:h-16 min-[1128px]:w-16" />
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-6 rounded-lg border border-hairline bg-white px-5 py-2.5 text-body font-semibold shadow-sm min-[1128px]:px-6 min-[1128px]:py-3"
            >
              Add photos
            </button>
          </div>
        </StepShell>
        <UploadPhotosModal open={open} remaining={20} onClose={() => setOpen(false)} onUploaded={onUploaded} />
      </>
    );
  }

  if (phase === "arranging") {
    return (
      <div className="mx-auto w-full max-w-[720px] px-6 py-10 min-[1128px]:max-w-[780px] min-[1128px]:py-12">
        <h1 className="t-wizard-title min-[1128px]:text-[32px]">Arranging your photos to show off your space…</h1>
        <div className="mt-8 h-[360px] rounded-2xl bg-quaternary min-[1128px]:mt-10 min-[1128px]:h-[420px] min-[1128px]:rounded-3xl" />
      </div>
    );
  }

  if (phase === "skeleton") {
    return (
      <div className="mx-auto w-full max-w-[720px] px-6 py-10 min-[1128px]:max-w-[780px] min-[1128px]:py-12">
        <div className="h-9 w-72 skeleton rounded-lg" />
        <div className="mt-2 h-5 w-40 skeleton rounded-md" />
        <div className="mt-6 aspect-[16/10] w-full skeleton rounded-2xl min-[1128px]:rounded-3xl" />
        <div className="mt-3 grid grid-cols-2 gap-3 min-[1128px]:gap-4">
          <div className="aspect-[4/3] skeleton rounded-xl min-[1128px]:rounded-2xl" />
          <div className="aspect-[4/3] skeleton rounded-xl min-[1128px]:rounded-2xl" />
        </div>
      </div>
    );
  }

  const dismissTip = () => {
    window.localStorage.setItem(TIP_KEY, "1");
    setShowTip(false);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[720px] px-6 py-10 min-[1128px]:max-w-[780px] min-[1128px]:py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="t-wizard-title min-[1128px]:text-[32px]">Ta-da! How does this look?</h1>
            <p className="mt-2 text-meta text-muted">Drag to reorder</p>
          </div>
          <button
            type="button"
            aria-label="Add photos"
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline hover:bg-soft min-[1128px]:h-11 min-[1128px]:w-11"
          >
            <Plus size={18} />
          </button>
        </div>
        {images.length < 5 ? (
          <p className="mt-4 rounded-lg bg-soft px-4 py-3 text-meta text-ink min-[1128px]:mt-5">
            Add at least <strong>{5 - images.length}</strong> more photo{5 - images.length === 1 ? "" : "s"} to continue (5 minimum).
          </p>
        ) : null}
        <div className="relative mt-6 min-[1128px]:mt-8">
          <div className="grid grid-cols-2 gap-3 min-[1128px]:gap-4">
            {images.map((image, index) => (
              <div
                key={image.url}
                draggable
                onDragStart={() => {
                  dragIndex.current = index;
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragIndex.current === null) return;
                  reorder(dragIndex.current, index);
                  dragIndex.current = null;
                }}
                className={`relative overflow-hidden rounded-xl bg-soft min-[1128px]:rounded-2xl ${
                  index === 0 ? "col-span-2 aspect-[16/10]" : "aspect-square"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="h-full w-full object-cover" />
                {index === 0 ? (
                  <span className="absolute left-3 top-3 rounded-lg bg-white px-2.5 py-1 text-label font-semibold shadow-sm min-[1128px]:left-4 min-[1128px]:top-4">
                    Cover Photo
                  </span>
                ) : null}
                <button
                  type="button"
                  aria-label="Photo actions"
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenu(menu === index ? null : index);
                  }}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm min-[1128px]:right-4 min-[1128px]:top-4"
                >
                  <MoreHorizontal size={16} />
                </button>
                {menu === index ? (
                  <div
                    className="dropdown-pop absolute right-3 top-12 z-10 w-48 overflow-hidden rounded-xl border border-hairline bg-white py-1 text-body shadow-popover min-[1128px]:right-4"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="block w-full px-3 py-2.5 text-left hover:bg-soft"
                      onClick={() => {
                        setEditIndex(index);
                        setMenu(null);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={index === 0}
                      className="block w-full px-3 py-2.5 text-left hover:bg-soft disabled:text-faint"
                      onClick={() => {
                        reorder(index, 0);
                        setMenu(null);
                      }}
                    >
                      Make cover photo
                    </button>
                    <button
                      type="button"
                      disabled={index === 0}
                      className="block w-full px-3 py-2.5 text-left hover:bg-soft disabled:text-faint"
                      onClick={() => {
                        reorder(index, index - 1);
                        setMenu(null);
                      }}
                    >
                      Move backward
                    </button>
                    <button
                      type="button"
                      disabled={index === images.length - 1}
                      className="block w-full px-3 py-2.5 text-left hover:bg-soft disabled:text-faint"
                      onClick={() => {
                        reorder(index, index + 1);
                        setMenu(null);
                      }}
                    >
                      Move forward
                    </button>
                    <button
                      type="button"
                      className="block w-full px-3 py-2.5 text-left hover:bg-soft"
                      onClick={() => {
                        applyImages(images.filter((_, item) => item !== index));
                        setMenu(null);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
            {remaining > 0 ? (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex aspect-square flex-col items-center justify-center rounded-xl border border-hairline bg-soft text-body font-medium text-muted hover:border-ink min-[1128px]:rounded-2xl"
              >
                <Plus size={28} strokeWidth={1.25} className="mb-2 text-ink" />
                Add more
              </button>
            ) : null}
          </div>
          {showTip && images.length >= 2 ? (
            <div className="absolute bottom-6 left-1/2 z-20 w-[min(100%,320px)] -translate-x-1/2 rounded-2xl border border-hairline bg-white p-4 shadow-popover min-[1128px]:bottom-8">
              <button type="button" aria-label="Dismiss tip" onClick={dismissTip} className="absolute right-3 top-3 text-muted">
                ×
              </button>
              <p className="pr-6 font-semibold text-ink">Lead with your best photos</p>
              <p className="mt-1 text-meta text-muted">Instantly sort your photos so the best ones show up first.</p>
              <button
                type="button"
                onClick={() => {
                  dismissTip();
                }}
                className="mt-3 rounded-lg border border-ink px-4 py-2 text-label font-semibold"
              >
                Arrange photos
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <UploadPhotosModal open={open} remaining={remaining} onClose={() => setOpen(false)} onUploaded={onUploaded} />
      {editIndex !== null && images[editIndex] ? (
        <EditPhotoModal
          open
          url={images[editIndex].url}
          caption={images[editIndex].caption}
          onClose={() => setEditIndex(null)}
          onSave={(caption) => {
            const next = images.map((item, idx) => (idx === editIndex ? { ...item, caption } : item));
            applyImages(next);
            setEditIndex(null);
          }}
          onDelete={() => {
            applyImages(images.filter((_, idx) => idx !== editIndex));
            setEditIndex(null);
          }}
        />
      ) : null}
    </>
  );
}
