"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { SwitchUserModal } from "@/components/auth/SwitchUserModal";
import { Logo } from "@/components/layout/Logo";
import { UserMenu } from "@/components/layout/UserMenu";
import { Avatar } from "@/components/ui/Avatar";
import { GlideUnderline } from "@/components/ui/Glide";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/auth";
import { APP_NAME } from "@/lib/brand";

const NAV = [
  { href: "/host", label: "Today" },
  { href: "/host/calendar", label: "Calendar" },
  { href: "/host/listings", label: "Listings" },
  { href: "/host/messages", label: "Messages" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/host") return pathname === "/host";
  if (href === "/host/listings") return pathname.startsWith("/host/listings") && !pathname.startsWith("/host/listings/new");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HostHeader() {
  const pathname = usePathname();
  const { user, isHost, isLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeSwitch = useCallback(() => setSwitchOpen(false), []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-white">
      <div className="grid h-[var(--header-h)] grid-cols-[auto_1fr_auto] items-stretch gap-3 px-6">
        <Link href="/" aria-label={`${APP_NAME} home`} className="flex items-center">
          <Logo />
        </Link>
        <GlideUnderline
          active={NAV.find((item) => isActive(pathname, item.href))?.href ?? "/host"}
          className="flex h-full items-stretch justify-center gap-8 overflow-x-auto"
        >
          <nav className="contents" aria-label="Hosting">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-glide={item.href}
                  className={`relative z-10 flex shrink-0 items-center text-body transition-colors duration-200 ${active ? "font-semibold text-ink" : "text-muted"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </GlideUnderline>
        <div className="flex items-center justify-end gap-2">
          <Link href="/" className="t-hosting hidden rounded-full px-3 py-2 hover:bg-soft sm:inline">
            Switch to travelling
          </Link>
          {isLoading ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : (
            <Link href="/profile" aria-label="Profile">
              <Avatar name={user?.name ?? "Guest"} src={user?.avatar_url} size={32} />
            </Link>
          )}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Main menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-soft"
            >
              <Menu size={18} />
            </button>
            {menuOpen ? (
              <UserMenu
                isHost={isHost}
                onClose={() => setMenuOpen(false)}
                onSwitchUser={() => {
                  setMenuOpen(false);
                  setSwitchOpen(true);
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
      <SwitchUserModal open={switchOpen} onClose={closeSwitch} />
    </header>
  );
}
