"use client";

import { CircleUser, Heart, Menu, Search, Tag } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { SwitchUserModal } from "@/components/auth/SwitchUserModal";
import { Logo } from "@/components/layout/Logo";
import { BalloonMark, BellMark, GlobeMark, HouseMark } from "@/components/layout/ProductIcons";
import { UserMenu } from "@/components/layout/UserMenu";
import { CompactPill, ExpandedSearch, GuestSearch, MobileSearch } from "@/components/search/SearchBar";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useHeaderState, type HeaderSegment } from "@/hooks/useHeaderState";
import { useAuth } from "@/lib/auth";
import { APP_NAME } from "@/lib/brand";

const TABS = [
  { id: "all", label: "All", href: "/", icon: GlobeMark },
  { id: "homes", label: "Homes", href: "/?view=homes", icon: HouseMark },
  { id: "experiences", label: "Experiences", href: "/experiences", icon: BalloonMark },
  { id: "services", label: "Services", href: "/services", icon: BellMark },
] as const;

/**
 * Per-tab box geometry, measured on airbnb.co.in @1440 (DESIGN.md §Tabs): tab boxes are 36px tall, 35px apart,
 * the label sits `labelGap` px after the 36px icon, and the underline spans the whole box including `padL/padR`.
 * `marginL` cancels padding so the gap between visible content stays 35px.
 */
const TAB_BOX: Record<(typeof TABS)[number]["id"], { padL: number; padR: number; marginL: number; labelGap: number }> = {
  all: { padL: 0, padR: 5, marginL: 0, labelGap: 8 },
  homes: { padL: 5, padR: 0, marginL: 0, labelGap: 16 },
  experiences: { padL: 0, padR: 0, marginL: 0, labelGap: 8 },
  services: { padL: 2, padR: 0, marginL: 0, labelGap: 12 },
};

function ProductTabs({ active, onHome }: { active: string; onHome: (tab: "all" | "homes") => void }) {
  const [popId, setPopId] = useState<string | null>(null);

  useEffect(() => {
    setPopId(active);
    const timer = window.setTimeout(() => setPopId(null), 480);
    return () => window.clearTimeout(timer);
  }, [active]);

  return (
    <nav className="flex items-start gap-[var(--tab-gap)]" aria-label="Explore">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const on = active === tab.id;
        const box = TAB_BOX[tab.id];
        return (
          <Link
            key={tab.id}
            href={tab.href}
            onClick={() => {
              if (tab.id === "all" || tab.id === "homes") onHome(tab.id);
              setPopId(tab.id);
            }}
            className="group relative flex h-9 items-center text-ink"
            style={{ paddingLeft: box.padL, paddingRight: box.padR, marginLeft: box.marginL }}
          >
            <span className={`tab-icon block h-9 w-9 shrink-0 ${popId === tab.id ? "is-pop" : ""}`}>
              <Icon className="h-9 w-9" />
            </span>
            <span className={on ? "t-tab-active" : "t-tab"} style={{ marginLeft: box.labelGap }}>
              {tab.label}
            </span>
            <span aria-hidden className={`tab-underline pointer-events-none absolute inset-x-[var(--tab-underline-inset)] top-[var(--tab-underline-top)] h-[3px] rounded-[1.5px] bg-ink ${on ? "opacity-100" : "opacity-0"}`} />
          </Link>
        );
      })}
    </nav>
  );
}

/** Mobile (<744) tab chips: 40px pills, 28px icon in a 20px slot, 14/18/400 label, 8px apart (measured @375). */
function MobileChips({ active, onHome, expanded }: { active: string; onHome: (tab: "all" | "homes") => void; expanded: boolean }) {
  return (
    <div className={`overflow-hidden transition-[height,opacity] duration-spring-fast ease-spring-fast ${expanded ? "h-[var(--mobile-chips-h)] opacity-100" : "h-0 opacity-0"}`}>
      <nav aria-label="Explore" className="no-scrollbar flex gap-2 overflow-x-auto px-[var(--home-px)] pb-[22px] pt-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const on = active === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={on ? "page" : undefined}
              onClick={() => {
                if (tab.id === "all" || tab.id === "homes") onHome(tab.id);
              }}
              className={`mobile-chip relative flex h-10 shrink-0 items-center gap-1 border px-[14px] py-[10px] text-ink ${on ? "border-white/50" : "border-white"}`}
            >
              <span aria-hidden className={`mobile-chip-surface mobile-chip-raised ${on ? "opacity-0" : "opacity-100"}`} />
              <span aria-hidden className={`mobile-chip-surface mobile-chip-pressed ${on ? "opacity-100" : "opacity-0"}`} />
              <span className="relative block h-5 w-5 shrink-0">
                <Icon className="absolute -left-1 -top-1 h-7 w-7" />
              </span>
              <span className="t-mobile-chip relative">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** Mobile bottom bar (<744): 64px + 1px hairline, three 70.4px slots 2px apart, 24px icon over a 10/12 label (measured @375). */
function MobileNav({ pathname, isHost, onSwitchUser }: { pathname: string; isHost: boolean; onSwitchUser: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const exploring = pathname === "/" || pathname.startsWith("/experiences") || pathname.startsWith("/services");
  const slot = "mobile-nav-item flex h-11 w-[20%] flex-col items-center gap-[5px] px-0.5 pt-[3px]";
  const tone = (on: boolean) => (on ? "t-mobile-nav-active text-[var(--brand-solid)]" : "t-mobile-nav text-muted");
  const iconTone = (on: boolean) => (on ? "text-[var(--brand-solid)]" : "text-muted");

  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 mobile-nav border-t border-divider bg-white md:hidden">
      <div ref={ref} className="relative flex h-[var(--mobile-nav-h)] items-start justify-center gap-0.5 px-1 pt-2.5">
        <Link href="/" className={`${slot} text-ink`}>
          <Search size={24} strokeWidth={1.6} className={iconTone(exploring)} />
          <span className={`mobile-nav-label block w-full text-center ${tone(exploring)}`}>Explore</span>
        </Link>
        <Link href="/wishlists" className={`${slot} text-ink`}>
          <Heart size={24} strokeWidth={1.6} className={iconTone(pathname.startsWith("/wishlists"))} />
          <span className={`mobile-nav-label block w-full text-center ${tone(pathname.startsWith("/wishlists"))}`}>Wishlists</span>
        </Link>
        <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)} className={`${slot} text-ink`}>
          <CircleUser size={24} strokeWidth={1.6} className={iconTone(open || pathname.startsWith("/profile"))} />
          <span className={`mobile-nav-label block w-full text-center ${tone(open || pathname.startsWith("/profile"))}`}>{user ? "Profile" : "Log in"}</span>
        </button>
        {open ? (
          <UserMenu
            placement="above"
            isHost={isHost}
            onClose={() => setOpen(false)}
            onSwitchUser={() => {
              setOpen(false);
              onSwitchUser();
            }}
          />
        ) : null}
      </div>
    </nav>
  );
}

function HeaderFallback() {
  return (
    <div className="container-airbnb flex h-[var(--header-h)] items-center justify-between">
            <Logo wordmarkClassName="t-wordmark hidden sm:inline" />
      <Skeleton className="hidden h-12 w-80 rounded-full md:block" />
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
  );
}

function HeaderBody() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const homesView = pathname === "/" && searchParams.get("view") === "homes";
  const experienceDetail = /^\/experiences\/\d+/.test(pathname);
  const tall =
    !experienceDetail && (pathname === "/" || pathname === "/experiences" || pathname.startsWith("/services"));
  const { user, isHost, isLoading } = useAuth();
  const { expanded, scrolled, segment, open, close } = useHeaderState(tall);
  const [homeTab, setHomeTab] = useState<"all" | "homes">(() => (homesView ? "homes" : "all"));
  const [menuOpen, setMenuOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [overlayTop, setOverlayTop] = useState(200);
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeSwitch = useCallback(() => setSwitchOpen(false), []);

  const gutter = tall ? "px-[var(--home-px)]" : "container-airbnb";
  const activeTab = pathname.startsWith("/experiences")
    ? "experiences"
    : pathname.startsWith("/services")
      ? "services"
      : homesView
        ? "homes"
        : pathname === "/"
          ? homeTab
          : "all";

  useEffect(() => {
    setHomeTab(homesView ? "homes" : "all");
  }, [homesView]);

  useEffect(() => {
    setMenuOpen(false);
    close();
  }, [pathname, close]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const apply = () => setOverlayTop(header.offsetHeight);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(header);
    return () => observer.disconnect();
  }, [expanded]);

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

  const activate = (next: HeaderSegment) => {
    if (next === "where" || next === "when" || next === "who" || next === "service") open(next);
  };

  return (
    <GuestSearch expanded={expanded} segment={segment} onOpen={activate} onClose={close}>
      <header
        id="site-header"
        ref={headerRef}
        className={`sticky top-0 z-50 box-border border-b ${tall ? "border-transparent md:border-divider" : "border-divider"} transition-[height] duration-spring-fast ease-spring-fast ${expanded ? "md:h-[var(--header-expanded-h)]" : tall ? "md:h-[calc(var(--header-h)+1px)]" : ""}`}
        style={{ background: "var(--header-gradient)" }}
      >
        <div className={`${gutter} relative h-[var(--header-h)] items-center justify-between gap-3 ${tall ? "hidden md:flex" : "flex"}`}>
          <Link
            href="/"
            aria-label={`${APP_NAME} home`}
            className="logo-link relative z-10 flex h-20 shrink-0 items-center text-rausch"
            onClick={() => setHomeTab("all")}
          >
            <Logo wordmarkClassName="t-wordmark hidden min-[900px]:inline" />
          </Link>

          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 hidden h-[var(--header-h)] md:block">
            <div className={`header-tabs-layer absolute inset-0 flex items-center justify-center ${expanded ? "" : "is-collapsed"}`}>
              <div className={expanded ? "pointer-events-auto" : "pointer-events-none"}>
                <ProductTabs active={activeTab} onHome={setHomeTab} />
              </div>
            </div>
            <div className={`header-pill-layer absolute inset-0 flex items-center justify-center ${expanded ? "is-expanded" : ""}`}>
              <div className={expanded ? "pointer-events-none" : "pointer-events-auto"}>
                <CompactPill expanded={expanded} />
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            {isHost ? (
              <Link href="/host" className="header-host t-hosting hidden whitespace-nowrap min-[860px]:inline-flex">
                Switch to hosting
              </Link>
            ) : (
              <button type="button" className="header-host t-hosting hidden whitespace-nowrap min-[860px]:inline-flex" onClick={() => setSwitchOpen(true)}>
                Switch to hosting
              </button>
            )}
            {isLoading ? (
              <Skeleton className="h-10 w-10 rounded-full" />
            ) : (
              <Link href="/profile" aria-label="Profile" className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full">
                <Avatar name={user?.name ?? "Guest"} src={user?.avatar_url} size={40} />
              </Link>
            )}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-label="Main menu"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((open) => !open)}
                className="header-menu flex h-10 w-10 items-center justify-center rounded-[50%] bg-softer hover:bg-divider"
              >
                <Menu size={16} />
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

        <div className={`hidden transition-[height] duration-spring-fast ease-spring-fast md:block ${expanded ? "h-[calc(var(--header-expanded-h)-var(--header-h)-1px)] overflow-visible" : "h-0 overflow-hidden"}`}>
          <div className={`${gutter} relative h-full`}>
            <div className={`absolute left-1/2 top-[calc(54px-var(--header-h)/2)] w-[min(850px,100%)] -translate-x-1/2 ${expanded ? "" : "pointer-events-none"}`}>
              <div className={`header-bar-layer ${expanded ? "" : "is-collapsed"}`}>
                <ExpandedSearch />
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden">
          <div className={`${gutter} ${tall ? "pt-3" : "pb-3"}`}>
            <MobileSearch tall={tall} />
          </div>
          {tall ? <MobileChips active={activeTab} onHome={setHomeTab} expanded={expanded} /> : null}
        </div>

        {pathname === "/" && !homesView && !segment ? (
          <div className="pointer-events-none absolute left-1/2 top-full z-30 hidden -translate-x-1/2 translate-y-3 md:block">
            <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-ink shadow-pill xl:px-4 xl:py-2 xl:text-body">
              <Tag size={16} className="text-rausch" />
              Prices include all fees
            </div>
          </div>
        ) : null}
      </header>
      {segment && scrolled ? (
        <button
          type="button"
          aria-label="Close search"
          className="search-overlay fixed inset-x-0 bottom-0 z-40 bg-black/25"
          style={{ top: overlayTop }}
          onClick={close}
        />
      ) : null}
      {tall || ["/wishlists", "/trips", "/messages", "/profile"].some((prefix) => pathname.startsWith(prefix)) ? (
        <MobileNav pathname={pathname} isHost={isHost} onSwitchUser={() => setSwitchOpen(true)} />
      ) : null}
      <SwitchUserModal open={switchOpen} onClose={closeSwitch} />
    </GuestSearch>
  );
}

export function Header() {
  return (
    <Suspense fallback={<HeaderFallback />}>
      <HeaderBody />
    </Suspense>
  );
}
