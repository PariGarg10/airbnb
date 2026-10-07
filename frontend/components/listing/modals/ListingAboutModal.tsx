"use client";

import { Modal } from "@/components/ui/Modal";

function descriptionBlocks(text: string): { heading?: string; body: string }[] {
  const parts = text.split(/\n\n+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return [{ body: text }];
  return parts.map((part) => {
    const lines = part.split("\n");
    const first = lines[0] ?? "";
    const isHeading = lines.length > 1 && first.length < 48 && !first.endsWith(".");
    if (isHeading) {
      return { heading: first, body: lines.slice(1).join("\n") };
    }
    return { body: part };
  });
}

export function ListingAboutModal({ open, onClose, description }: { open: boolean; onClose: () => void; description: string }) {
  const blocks = descriptionBlocks(description);

  return (
    <Modal open={open} title="About this space" onClose={onClose} variant="listing" titleInBody size="lg">
      <div className="space-y-6 min-[1128px]:-mt-2">
        {blocks.map((block, index) => (
          <section key={index}>
            {block.heading ? (
              <h3 className="text-base font-semibold leading-5 text-ink min-[1128px]:text-lg min-[1128px]:leading-6">{block.heading}</h3>
            ) : null}
            <p className={`t-modal-body whitespace-pre-wrap text-ink ${block.heading ? "mt-3" : ""}`}>{block.body}</p>
          </section>
        ))}
      </div>
    </Modal>
  );
}
