"use client";

import { Archive, House, Luggage, MessageSquare, Search, Send, Settings, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";

const FOLDERS = [
  { id: "all", label: "All", icon: MessageSquare },
  { id: "hosting", label: "Hosting", icon: House },
  { id: "travelling", label: "Travelling", icon: Luggage },
  { id: "support", label: "Support", icon: Send },
] as const;

const SETTINGS = [
  { label: "Manage quick replies", icon: MessageSquare },
  { label: "Suggested replies", icon: Sparkles },
  { label: "Archived", icon: Archive },
  { label: "Give feedback", icon: Send },
];

export function MessagesView() {
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState<(typeof FOLDERS)[number]["id"]>("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const filtersOn = searching || unread || folder !== "all" || query.trim().length > 0;
  const folderLabel = FOLDERS.find((item) => item.id === folder)?.label ?? "All";

  const clear = () => {
    setSearching(false);
    setQuery("");
    setFolder("all");
    setUnread(false);
    setMenuOpen(false);
  };

  return (
    <div className="grid min-h-[70vh] md:grid-cols-[380px_minmax(0,1fr)]">
      <section className="border-hairline px-6 py-6 md:border-r">
        {searching ? (
          <div className="flex items-center gap-3">
            <label className="flex flex-1 items-center gap-2 rounded-full border border-hairline px-4 py-2">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search all messages"
                className="w-full bg-transparent text-body outline-none"
                autoFocus
              />
            </label>
            <button type="button" className="text-body font-semibold" onClick={clear}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h1 className="t-page-title">Messages</h1>
            <div className="flex gap-1">
              <button type="button" aria-label="Search messages" onClick={() => setSearching(true)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-soft">
                <Search size={16} />
              </button>
              <button type="button" aria-label="Messaging settings" onClick={() => setSettingsOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-soft">
                <Settings size={16} />
              </button>
            </div>
          </div>
        )}
        <div className="relative mt-4 flex gap-2">
          <button type="button" onClick={() => setMenuOpen((open) => !open)} className="inline-flex items-center gap-1 rounded-full bg-ink px-4 py-2 t-button text-white">
            {folderLabel}
            <span aria-hidden="true">{menuOpen ? "⌃" : "⌄"}</span>
          </button>
          <button
            type="button"
            onClick={() => setUnread((value) => !value)}
            className={`rounded-full border px-4 py-2 text-body font-semibold ${unread ? "border-ink bg-soft" : "border-hairline"}`}
          >
            Unread
          </button>
          {menuOpen ? (
            <div className="dropdown-pop absolute left-0 top-12 z-20 w-52 rounded-xl border border-hairline bg-white py-2 shadow-popover">
              {FOLDERS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-body hover:bg-soft"
                    onClick={() => {
                      setFolder(item.id);
                      setMenuOpen(false);
                    }}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <div className="px-4 py-16 text-center">
          <MessageSquare className="mx-auto" size={28} />
          {filtersOn ? (
            <>
              <p className="mt-4 text-lg font-semibold">We couldn&apos;t find any messages</p>
              <p className="mt-1 text-meta text-muted">Try removing or adjusting your filters.</p>
              <button type="button" onClick={clear} className="mt-4 rounded-xl border border-ink px-4 py-2 text-body font-semibold">
                Clear all filters
              </button>
            </>
          ) : (
            <>
              <p className="mt-4 font-semibold">You don&apos;t have any messages</p>
              <p className="mt-1 text-meta text-muted">When you receive a new message, it will appear here.</p>
            </>
          )}
        </div>
      </section>
      <div className="hidden md:block" />
      <Modal open={settingsOpen} title="Messaging settings" onClose={() => setSettingsOpen(false)}>
        <div className="space-y-1">
          {SETTINGS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left text-body hover:bg-soft"
                onClick={() => toast("Coming soon")}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
