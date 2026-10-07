"use client";

import { Check, ImageIcon, Plus, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { WizardLoadingDots } from "@/components/host/wizard/WizardLoadingDots";
import { ApiError, uploadApi } from "@/lib/api";

const MAX_BYTES = 5 * 1024 * 1024;
const LOW_RES_BYTES = 50 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

type UploadStatus = "pending" | "uploading" | "done" | "error";

interface QueueItem {
  id: string;
  file: File;
  preview: string;
  status: UploadStatus;
  url?: string;
}

function allowed(file: File): boolean {
  if (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp") return true;
  return /\.(jpe?g|png|webp)$/i.test(file.name);
}

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function UploadPhotosModal({
  open,
  remaining,
  onClose,
  onUploaded,
}: {
  open: boolean;
  remaining: number;
  onClose: () => void;
  onUploaded: (urls: string[]) => void;
}) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const cancelRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !uploading) {
        queue.forEach((item) => URL.revokeObjectURL(item.preview));
        setQueue([]);
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose, uploading, queue]);

  useEffect(() => {
    if (open) return;
    setQueue((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.preview));
      return [];
    });
    cancelRef.current.clear();
  }, [open]);

  const close = () => {
    if (uploading) return;
    queue.forEach((item) => URL.revokeObjectURL(item.preview));
    setQueue([]);
    onClose();
  };

  if (!open) return null;

  const addFiles = (list: FileList | File[]) => {
    const incoming = Array.from(list);
    const accepted: File[] = [];
    incoming.forEach((file) => {
      if (!allowed(file)) {
        toast.error("Only jpg, png, and webp photos are allowed");
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error("Each photo must be 5MB or smaller");
        return;
      }
      accepted.push(file);
    });
    const room = Math.max(0, remaining - queue.length);
    if (accepted.length > room) toast.error("You can add up to 20 photos");
    const slice = accepted.slice(0, room);
    setQueue((current) => [
      ...current,
      ...slice.map((file) => ({
        id: nextId(),
        file,
        preview: URL.createObjectURL(file),
        status: "pending" as const,
      })),
    ]);
  };

  const removeItem = (id: string) => {
    if (uploading) return;
    setQueue((current) => {
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((item) => item.id !== id);
    });
  };

  const cancelItem = (id: string) => {
    cancelRef.current.add(id);
    if (!uploading) removeItem(id);
  };

  const uploadedCount = queue.filter((item) => item.status === "done").length;
  const countLabel =
    queue.length === 0 ? "No items selected" : `${queue.length} ${queue.length === 1 ? "item" : "items"} selected`;

  const upload = async () => {
    if (queue.length === 0 || uploading) return;
    setUploading(true);
    const urls: string[] = [];
    for (const item of queue) {
      if (cancelRef.current.has(item.id)) continue;
      setQueue((current) =>
        current.map((row) => (row.id === item.id ? { ...row, status: "uploading" as const } : row)),
      );
      try {
        const result = await uploadApi.upload(item.file);
        if (cancelRef.current.has(item.id)) continue;
        urls.push(result.url);
        setQueue((current) =>
          current.map((row) => (row.id === item.id ? { ...row, status: "done" as const, url: result.url } : row)),
        );
      } catch (error) {
        setQueue((current) =>
          current.map((row) => (row.id === item.id ? { ...row, status: "error" as const } : row)),
        );
        if (urls.length === 0) {
          toast.error(error instanceof ApiError ? error.detail : "Could not upload photos");
        }
      }
    }
    setUploading(false);
    if (urls.length > 0) {
      queue.forEach((item) => URL.revokeObjectURL(item.preview));
      setQueue([]);
      cancelRef.current.clear();
      onUploaded(urls);
      onClose();
    }
  };

  const retryItem = async (id: string) => {
    const item = queue.find((row) => row.id === id);
    if (!item || uploading) return;
    setUploading(true);
    setQueue((current) => current.map((row) => (row.id === id ? { ...row, status: "uploading" as const } : row)));
    try {
      const result = await uploadApi.upload(item.file);
      setQueue((current) =>
        current.map((row) => (row.id === id ? { ...row, status: "done" as const, url: result.url } : row)),
      );
    } catch (error) {
      setQueue((current) => current.map((row) => (row.id === id ? { ...row, status: "error" as const } : row)));
      toast.error(error instanceof ApiError ? error.detail : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 min-[1128px]:p-6">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-black/50" onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-high min-[1128px]:max-w-[640px]"
      >
        <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-hairline px-4 py-3 min-[1128px]:px-5">
          <button
            type="button"
            aria-label="Close"
            disabled={uploading}
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-soft disabled:opacity-40"
          >
            <X size={16} />
          </button>
          <div className="text-center">
            <h2 id={titleId} className="font-semibold">
              Upload photos
            </h2>
            <p className="text-meta text-muted">
              {uploading ? `${uploadedCount} of ${queue.length} items uploaded` : countLabel}
            </p>
          </div>
          <button
            type="button"
            aria-label="Add photos"
            disabled={uploading || queue.length >= remaining}
            onClick={() => inputRef.current?.click()}
            className="flex h-8 w-8 items-center justify-center justify-self-end rounded-full hover:bg-soft disabled:opacity-40"
          >
            <Plus size={18} />
          </button>
        </div>
        <div
          className="overflow-y-auto px-6 py-5 min-[1128px]:px-8"
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            addFiles(event.dataTransfer.files);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          {queue.length === 0 ? (
            <div
              className={`flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center min-[1128px]:min-h-80 ${
                dragging ? "border-ink bg-soft" : "border-hairline"
              }`}
            >
              <ImageIcon size={48} strokeWidth={1.25} className="text-muted" />
              <p className="mt-4 text-lg font-semibold">Drag and drop</p>
              <p className="mt-1 text-meta text-muted">or browse for photos</p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-5 rounded-lg bg-ink px-6 py-2.5 text-sm font-semibold text-white min-[1128px]:px-8 min-[1128px]:py-3"
              >
                Browse
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 min-[1128px]:gap-4">
              {queue.map((item) => (
                <div key={item.id} className="relative aspect-square overflow-hidden rounded-xl bg-soft min-[1128px]:rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.preview} alt="" className="h-full w-full object-cover" />
                  {item.file.size < LOW_RES_BYTES ? (
                    <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-rausch" aria-hidden />
                      UNDER 50KB
                    </span>
                  ) : null}
                  {item.status === "uploading" ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                      <span className="h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </div>
                  ) : null}
                  {item.status === "done" ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink">
                        <Check size={22} strokeWidth={2.5} />
                      </span>
                    </div>
                  ) : null}
                  {item.status === "error" ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 p-2">
                      <p className="text-center text-label text-white">Upload failed</p>
                      <button
                        type="button"
                        onClick={() => retryItem(item.id)}
                        className="rounded-lg bg-white px-3 py-1 text-label font-semibold text-ink"
                      >
                        Retry
                      </button>
                    </div>
                  ) : null}
                  {item.status === "pending" || item.status === "error" ? (
                    <button
                      type="button"
                      aria-label="Remove photo"
                      disabled={uploading && item.status !== "error"}
                      onClick={() => (uploading ? cancelItem(item.id) : removeItem(item.id))}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white"
                    >
                      {uploading ? <X size={14} /> : <Trash2 size={14} />}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-hairline px-6 py-4 min-[1128px]:px-8">
          <button type="button" onClick={close} disabled={uploading} className="t-link font-semibold disabled:opacity-40">
            {queue.length > 0 && !uploading ? "Done" : "Cancel"}
          </button>
          <button
            type="button"
            disabled={queue.length === 0 || uploading}
            onClick={upload}
            className="flex min-w-[120px] items-center justify-center rounded-lg bg-ink px-8 py-2.5 text-sm font-semibold text-white disabled:bg-soft disabled:text-faint min-[1128px]:min-h-12 min-[1128px]:py-3"
          >
            {uploading ? <WizardLoadingDots className="text-white" /> : "Upload"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
