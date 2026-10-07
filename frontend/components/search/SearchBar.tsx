"use client";

import { addMonths, format, parseISO, startOfMonth } from "date-fns";
import {
  Building2,
  Calendar,
  Camera,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flower2,
  Navigation,
  Palmtree,
  Scissors,
  Search,
  Sparkles,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DateRangePicker } from "@/components/search/DateRangePicker";
import { GuestPicker, type GuestCounts } from "@/components/search/GuestPicker";
import { PillHouse } from "@/components/layout/ProductIcons";
import { filterDestinations, type Destination } from "@/lib/destinations";
import { formatGuests } from "@/lib/format";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import type { HeaderSegment } from "@/hooks/useHeaderState";
import { SERVICE_TYPES, type ServiceType } from "@/lib/mock/services";

const EMPTY_GUESTS: GuestCounts = { adults: 0, children: 0, infants: 0, pets: 0 };
const DATE_FLEX = ["Exact dates", "± 1 day", "± 2 days", "± 3 days", "± 7 days", "± 14 days"] as const;
const STAYS = [
  { id: "weekend", label: "Weekend" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
] as const;

type StayLength = (typeof STAYS)[number]["id"] | null;
type WhenMode = "dates" | "flexible";

interface Draft {
  location: string;
  nearby: boolean;
  checkIn?: string;
  checkOut?: string;
  guests: GuestCounts;
  serviceType?: ServiceType;
}

type SearchProduct = "homes" | "experiences" | "services";

interface GuestSearchValue {
  expanded: boolean;
  segment: HeaderSegment | null;
  open: (segment: HeaderSegment) => void;
  close: () => void;
  draft: Draft;
  setDraft: (draft: Draft) => void;
  whereQuery: string;
  setWhereQuery: (value: string) => void;
  whenMode: WhenMode;
  setWhenMode: (mode: WhenMode) => void;
  stay: StayLength;
  setStay: (stay: StayLength) => void;
  flexMonths: string[];
  toggleMonth: (key: string) => void;
  dateFlex: number;
  setDateFlex: (index: number) => void;
  hover: HeaderSegment | null;
  setHover: (segment: HeaderSegment | null) => void;
  commit: () => void;
  clearSegment: (segment: HeaderSegment) => void;
  whereLabel: string;
  wherePlaceholder: string;
  whenLabel: string;
  whoLabel: string;
  whereFilled: boolean;
  whenFilled: boolean;
  whoFilled: boolean;
  compactWhere: string;
  compactWhen: string;
  compactWho: string;
  searchProduct: SearchProduct;
  serviceLabel: string;
  serviceFilled: boolean;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  mobileStep: HeaderSegment;
  setMobileStep: (step: HeaderSegment) => void;
  loadDraft: () => void;
}

const GuestSearchContext = createContext<GuestSearchValue | null>(null);

function useGuestSearch(): GuestSearchValue {
  const value = useContext(GuestSearchContext);
  if (!value) throw new Error("Search UI must render inside GuestSearch");
  return value;
}

function guestTotal(guests: GuestCounts): number {
  return guests.adults + guests.children;
}

function formatCompactRange(checkIn: string, checkOut: string): string {
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Add dates";
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${format(start, "d")}–${format(end, "d MMM")}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, "d MMM")} – ${format(end, "d MMM")}`;
  }
  return `${format(start, "d MMM")} – ${format(end, "d MMM")}`;
}

function flexibleLabel(stay: StayLength, months: string[]): string {
  const names = months
    .slice()
    .sort()
    .map((key) => format(parseISO(`${key}-01`), "MMM"));
  if (!stay && names.length === 0) return "Add dates";
  if (names.length === 0) {
    if (stay === "weekend") return "Any weekend";
    if (stay === "month") return "Any month";
    return "Any week";
  }
  const word = stay === "weekend" ? "Weekend" : stay === "month" ? "Month" : "Week";
  return `${word} in ${names.join(", ")}`;
}

function fromFilters(filters: { location?: string; check_in?: string; check_out?: string; guests?: number }): Draft {
  return {
    location: filters.location ?? "",
    nearby: false,
    checkIn: filters.check_in,
    checkOut: filters.check_out,
    guests: { ...EMPTY_GUESTS, adults: filters.guests ?? 0 },
  };
}

export function GuestSearch({
  expanded,
  segment,
  onOpen,
  onClose,
  children,
}: {
  expanded: boolean;
  segment: HeaderSegment | null;
  onOpen: (segment: HeaderSegment) => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { filters } = useSearchFilters();
  const [draft, setDraft] = useState<Draft>(() => fromFilters(filters));
  const [whereQuery, setWhereQuery] = useState("");
  const [whenMode, setWhenMode] = useState<WhenMode>("dates");
  const [stay, setStay] = useState<StayLength>(null);
  const [flexMonths, setFlexMonths] = useState<string[]>([]);
  const [dateFlex, setDateFlex] = useState(0);
  const [hover, setHover] = useState<HeaderSegment | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileStep, setMobileStep] = useState<HeaderSegment>("where");

  const loadDraft = () => {
    const nextDraft = fromFilters(filters);
    setDraft(nextDraft);
    setWhereQuery(nextDraft.location);
    setWhenMode("dates");
    setStay(null);
    setFlexMonths([]);
  };

  const open = (next: HeaderSegment) => {
    if (!segment) loadDraft();
    onOpen(next);
  };

  const toggleMonth = (key: string) => {
    setFlexMonths((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const clearSegment = (target: HeaderSegment) => {
    if (target === "where") {
      setDraft({ ...draft, location: "", nearby: false });
      setWhereQuery("");
    } else if (target === "when") {
      setDraft({ ...draft, checkIn: undefined, checkOut: undefined });
      setStay(null);
      setFlexMonths([]);
      setWhenMode("dates");
    } else if (target === "service") {
      setDraft({ ...draft, serviceType: undefined });
    } else {
      setDraft({ ...draft, guests: EMPTY_GUESTS });
    }
  };

  const searchProduct: SearchProduct = pathname.startsWith("/services")
    ? "services"
    : pathname.startsWith("/experiences")
      ? "experiences"
      : "homes";

  const commit = () => {
    const guests = guestTotal(draft.guests);
    const useDates = whenMode === "dates" && Boolean(draft.checkIn && draft.checkOut);
    const location = draft.nearby ? undefined : draft.location.trim() || undefined;
    const params = new URLSearchParams();
    if (pathname === "/s") {
      if (filters.category) params.set("category", filters.category);
      if (filters.min_rating != null) params.set("min_rating", String(filters.min_rating));
      if (filters.min_price != null) params.set("min_price", String(filters.min_price));
      if (filters.max_price != null) params.set("max_price", String(filters.max_price));
      if (filters.room_type) params.set("room_type", filters.room_type);
      if (filters.min_bedrooms != null) params.set("min_bedrooms", String(filters.min_bedrooms));
      if (filters.min_beds != null) params.set("min_beds", String(filters.min_beds));
      if (filters.min_bathrooms != null) params.set("min_bathrooms", String(filters.min_bathrooms));
      if (filters.instant_book) params.set("instant_book", "true");
      if (filters.allows_pets) params.set("allows_pets", "true");
      if (filters.property_types?.length) params.set("property_types", filters.property_types.join(","));
      if (filters.amenities?.length) params.set("amenities", filters.amenities.join(","));
    }
    if (location) params.set("location", location);
    if (useDates && draft.checkIn && draft.checkOut) {
      params.set("check_in", draft.checkIn);
      params.set("check_out", draft.checkOut);
    }
    if (guests > 0) params.set("guests", String(guests));
    if (searchProduct === "experiences") {
      params.set("category", "Experiences");
    } else if (searchProduct === "services") {
      params.set("category", "Services");
    }
    const query = params.toString();
    router.push(query ? `/s?${query}` : searchProduct === "experiences" ? "/s?category=Experiences" : searchProduct === "services" ? "/s?category=Services" : "/s");
    onClose();
    setMobileOpen(false);
  };

  const flexibleActive = whenMode === "flexible" && (stay != null || flexMonths.length > 0);
  const whenLabel = segment
    ? whenMode === "flexible"
      ? flexibleLabel(stay, flexMonths)
      : draft.checkIn && draft.checkOut
        ? formatCompactRange(draft.checkIn, draft.checkOut)
        : "Add dates"
    : filters.check_in && filters.check_out
      ? formatCompactRange(filters.check_in, filters.check_out)
      : "Add dates";
  const wherePlaceholder =
    searchProduct === "experiences" ? "Search by city or landmark" : "Search destinations";
  const whereLabel = segment
    ? draft.nearby
      ? "Nearby"
      : draft.location || wherePlaceholder
    : filters.location || wherePlaceholder;
  const whoCount = segment ? guestTotal(draft.guests) : filters.guests;
  const whoLabel = formatGuests(whoCount);
  const whereFilled = segment ? Boolean(draft.location || draft.nearby) : Boolean(filters.location);
  const whenFilled = segment
    ? whenMode === "flexible"
      ? flexibleActive
      : Boolean(draft.checkIn && draft.checkOut)
    : Boolean(filters.check_in && filters.check_out);
  const whoFilled = (whoCount ?? 0) > 0;
  const serviceFilled = Boolean(draft.serviceType);
  const serviceLabel = draft.serviceType ?? "Add service";

  const value = useMemo<GuestSearchValue>(
    () => ({
      expanded,
      segment,
      open,
      close: onClose,
      draft,
      setDraft,
      whereQuery,
      setWhereQuery,
      whenMode,
      setWhenMode,
      stay,
      setStay,
      flexMonths,
      toggleMonth,
      dateFlex,
      setDateFlex,
      hover,
      setHover,
      commit,
      clearSegment,
      whereLabel,
      wherePlaceholder,
      whenLabel,
      whoLabel: whoFilled ? whoLabel : "Add guests",
      whereFilled,
      whenFilled,
      whoFilled,
      searchProduct,
      serviceLabel,
      serviceFilled,
      compactWhere: filters.location
        ? `Homes in ${filters.location.replace(/\b\w/g, (letter) => letter.toUpperCase())}`
        : "Anywhere",
      compactWhen: filters.check_in && filters.check_out ? formatCompactRange(filters.check_in, filters.check_out) : "Any week",
      compactWho: formatGuests(filters.guests),
      mobileOpen,
      setMobileOpen,
      mobileStep,
      setMobileStep,
      loadDraft,
    }),
    // open/commit close over latest filters via state setters; listed deps cover renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      expanded,
      segment,
      draft,
      whereQuery,
      whenMode,
      stay,
      flexMonths,
      dateFlex,
      hover,
      whereLabel,
      wherePlaceholder,
      whenLabel,
      whoLabel,
      whereFilled,
      whenFilled,
      whoFilled,
      filters.location,
      filters.check_in,
      filters.check_out,
      filters.guests,
      filters.category,
      filters.min_rating,
      filters.min_price,
      filters.max_price,
      filters.room_type,
      filters.min_bedrooms,
      filters.min_beds,
      filters.min_bathrooms,
      filters.instant_book,
      filters.allows_pets,
      filters.property_types,
      filters.amenities,
      mobileOpen,
      mobileStep,
      pathname,
      searchProduct,
      serviceLabel,
      serviceFilled,
    ],
  );

  return <GuestSearchContext.Provider value={value}>{children}</GuestSearchContext.Provider>;
}

function TintTile({ item }: { item: Destination }) {
  const tint =
    item.tint === "blue" ? "bg-[#EEF3FA] text-[#3B5CCC]" : item.tint === "rose" ? "bg-[#FDECEF] text-[#D23B62]" : item.tint === "peach" ? "bg-[#FFF1E6] text-[#C65A2E]" : "bg-[#EAF6EE] text-[#2E7D4F]";
  const Icon = item.icon === "nearby" ? Navigation : item.icon === "palm" ? Palmtree : Building2;
  return (
    <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${tint}`}>
      <Icon size={22} />
    </span>
  );
}

function WherePanel() {
  const { draft, setDraft, whereQuery, open } = useGuestSearch();
  const items = filterDestinations(whereQuery || draft.location);
  return (
    <div className="w-[min(425px,calc(100vw-3rem))] px-2 pb-6 pt-8">
      <p className="t-dropdown-heading mb-1 px-6">Suggested destinations</p>
      <div className="no-scrollbar max-h-[480px] overflow-y-auto pb-4">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setDraft({ ...draft, location: item.query, nearby: item.id === "nearby" });
              open("when");
            }}
            className="mx-4 flex items-center gap-4 rounded-xl p-2 text-left hover:bg-row-hover"
          >
            <TintTile item={item} />
            <span>
              <span className="t-dropdown-dest-title block">{item.title}</span>
              <span className="t-dropdown-dest-subtitle block">{item.subtitle}</span>
            </span>
          </button>
        ))}
        {items.length === 0 ? <p className="px-8 py-6 text-meta text-muted">No matches</p> : null}
      </div>
    </div>
  );
}

function FlexiblePanel() {
  const { stay, setStay, flexMonths, toggleMonth } = useGuestSearch();
  const scroller = useRef<HTMLDivElement>(null);
  const months = useMemo(() => Array.from({ length: 12 }, (_, index) => addMonths(startOfMonth(new Date()), index)), []);

  return (
    <>
      <p className="t-when-section-title">How long would you like to stay?</p>
      <div className="mt-4 flex justify-center gap-3">
        {STAYS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStay(stay === item.id ? null : item.id)}
            className={`when-stay-chip ${stay === item.id ? "when-stay-chip-active" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="t-when-section-title mb-4 mt-10">When do you want to go?</p>
      <div className="relative">
        <button
          type="button"
          aria-label="Previous months"
          onClick={() => scroller.current?.scrollBy({ left: -260, behavior: "smooth" })}
          className="when-month-nav when-month-nav-prev"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
        <div ref={scroller} className="no-scrollbar mx-10 flex gap-3 overflow-x-auto pb-1">
          {months.map((month) => {
            const key = format(month, "yyyy-MM");
            const selected = flexMonths.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleMonth(key)}
                className={`when-month-tile ${selected ? "when-month-tile-active" : ""}`}
              >
                <Calendar size={28} strokeWidth={1.75} />
                <span className="text-body font-medium text-ink">{format(month, "MMMM")}</span>
                <span className="text-label text-muted">{format(month, "yyyy")}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-label="Next months"
          onClick={() => scroller.current?.scrollBy({ left: 260, behavior: "smooth" })}
          className="when-month-nav when-month-nav-next"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </>
  );
}

function WhenPanel() {
  const { draft, setDraft, whenMode, setWhenMode, dateFlex, setDateFlex } = useGuestSearch();
  return (
    <div className="when-panel w-fit max-w-[min(var(--when-panel-w),calc(100vw-3rem))] px-8 py-8">
      <div className="mb-8 flex justify-center">
        <div className="when-mode-toggle" role="tablist" aria-label="When search mode">
          {(["dates", "flexible"] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={whenMode === id}
              onClick={() => setWhenMode(id)}
              className={`when-mode-tab capitalize ${whenMode === id ? "when-mode-tab-active" : ""}`}
            >
              {id}
            </button>
          ))}
        </div>
      </div>
      {whenMode === "dates" ? (
        <>
          <DateRangePicker
            layout="search"
            monthCount={2}
            checkIn={draft.checkIn}
            checkOut={draft.checkOut}
            onChange={(checkIn, checkOut) => setDraft({ ...draft, checkIn, checkOut })}
          />
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {DATE_FLEX.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setDateFlex(index)}
                className={`when-flex-chip ${dateFlex === index ? "when-flex-chip-active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <FlexiblePanel />
      )}
    </div>
  );
}

function WhoPanel() {
  const { draft, setDraft } = useGuestSearch();
  const { filters } = useSearchFilters();
  return (
    <div className="w-[min(342px,calc(100vw-3rem))] px-2 pb-6 pt-6">
      <GuestPicker
        value={draft.guests}
        onChange={(guests) => setDraft({ ...draft, guests })}
        petsHint={filters.allows_pets ? "Allows pets" : undefined}
      />
    </div>
  );
}

const SERVICE_TYPE_ICONS: Record<ServiceType, typeof Camera> = {
  Photography: Camera,
  Chefs: ChefHat,
  Massage: Sparkles,
  "Prepared meals": UtensilsCrossed,
  Training: Dumbbell,
  "Make-up": Sparkles,
  Hair: Scissors,
  "Spa treatments": Flower2,
  Catering: UtensilsCrossed,
};

function ServiceTypePanel() {
  const { draft, setDraft, close } = useGuestSearch();
  return (
    <div className="w-[min(850px,calc(100vw-3rem))] px-6 py-8">
      <div className="grid grid-cols-3 gap-3">
        {SERVICE_TYPES.map((type) => {
          const Icon = SERVICE_TYPE_ICONS[type];
          const active = draft.serviceType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => {
                setDraft({ ...draft, serviceType: type });
                close();
              }}
              className={`flex items-center gap-3 rounded-full border px-5 py-3.5 text-left text-sm font-semibold leading-[18px] transition ${
                active ? "border-ink bg-white shadow-pill" : "border-hairline bg-white hover:border-ink"
              }`}
            >
              <Icon size={20} strokeWidth={1.5} aria-hidden />
              {type}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClearButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-divider text-ink"
    >
      <X size={14} />
    </button>
  );
}

export function ExpandedSearch() {
  const search = useGuestSearch();
  const { segment, hover, setHover, open, close, draft, setDraft, whereQuery, setWhereQuery, clearSegment, commit, searchProduct, serviceLabel, serviceFilled } = search;
  const thirdSegment: HeaderSegment = searchProduct === "services" ? "service" : "who";
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!segment) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-guest-search]")) return;
      // Close on click, not mousedown. Closing earlier collapses the bar before
      // the click lands, so Homes (and the logo) reopen the search field instead.
      close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("click", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [close, segment]);

  const active = (id: HeaderSegment) => segment === id;
  const dividerHidden = (left: HeaderSegment, right: HeaderSegment) =>
    hover === left || hover === right || segment === left || segment === right;

  return (
    <div ref={rootRef} data-guest-search className="relative hidden w-full md:block">
      <div
        className={`search-bar relative h-[var(--search-bar-h)] w-full rounded-[var(--r-search-bar)] ${segment ? "bg-divider" : "bg-white"}`}
        onMouseLeave={() => setHover(null)}
      >
        <div aria-hidden className={`search-bar-outline ${segment ? "opacity-0" : ""}`} style={{ gridColumn: "1 / -1", gridRow: 1 }} />
        <div
          role="button"
          tabIndex={0}
          onMouseEnter={() => setHover("where")}
          onClick={() => open("where")}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === "Enter" || event.key === " ") open("where");
          }}
          className={`search-seg search-seg-where relative z-10 flex min-w-0 cursor-pointer items-center overflow-hidden rounded-[var(--r-search-segment)] px-8 text-left ${active("where") ? "bg-white shadow-pill" : "hover:bg-divider"}`}
        >
          <span className="min-w-0 flex-1">
            <span className="t-search-label block pb-0.5">Where</span>
            {active("where") ? (
              <input
                autoFocus
                value={whereQuery}
                onChange={(event) => {
                  setWhereQuery(event.target.value);
                  setDraft({ ...draft, location: event.target.value, nearby: false });
                }}
                placeholder={search.wherePlaceholder}
                className="t-search-value-filled w-full bg-transparent outline-none"
              />
            ) : (
              <span className={`block truncate ${search.whereFilled ? "t-search-value-filled" : "t-search-value"}`}>{search.whereLabel}</span>
            )}
          </span>
          {active("where") && search.whereFilled ? <ClearButton label="Clear where" onClick={() => clearSegment("where")} /> : null}
        </div>
        <span className={`search-divider ${dividerHidden("where", "when") ? "opacity-0" : ""}`} />
        <div
          role="button"
          tabIndex={0}
          onMouseEnter={() => setHover("when")}
          onClick={() => open("when")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") open("when");
          }}
          className={`search-seg search-seg-when relative z-10 flex min-w-0 cursor-pointer items-center overflow-hidden rounded-[var(--r-search-segment)] px-6 text-left ${active("when") ? "bg-white shadow-pill" : "hover:bg-divider"}`}
        >
          <span className="min-w-0 flex-1">
            <span className="t-search-label block pb-0.5">When</span>
            <span className={`block truncate ${search.whenFilled ? "t-search-value-filled" : "t-search-value"}`}>
              {search.whenFilled ? search.whenLabel : "Add dates"}
            </span>
          </span>
          {active("when") && search.whenFilled ? <ClearButton label="Clear dates" onClick={() => clearSegment("when")} /> : null}
        </div>
        <span className={`search-divider ${dividerHidden("when", thirdSegment) ? "opacity-0" : ""}`} />
        <div
          role="button"
          tabIndex={0}
          onMouseEnter={() => setHover(thirdSegment)}
          onClick={() => open(thirdSegment)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") open(thirdSegment);
          }}
          className={`search-seg search-seg-who relative z-10 flex min-w-0 cursor-pointer items-center overflow-hidden rounded-[var(--r-search-segment)] pl-6 pr-[var(--search-who-pr)] text-left ${active(thirdSegment) ? "bg-white shadow-pill" : "hover:bg-divider"}`}
        >
          <span className="min-w-0 flex-1">
            <span className="t-search-label block pb-0.5">{searchProduct === "services" ? "Type of service" : "Who"}</span>
            <span
              className={`block whitespace-nowrap ${
                searchProduct === "services"
                  ? serviceFilled
                    ? "t-search-value-filled"
                    : "t-search-value"
                  : search.whoFilled
                    ? "t-search-value-filled"
                    : "t-search-value"
              }`}
            >
              {searchProduct === "services" ? serviceLabel : search.whoLabel}
            </span>
          </span>
          {active(thirdSegment) && (searchProduct === "services" ? serviceFilled : search.whoFilled) ? (
            <ClearButton
              label={searchProduct === "services" ? "Clear service type" : "Clear guests"}
              onClick={() => clearSegment(thirdSegment)}
            />
          ) : null}
        </div>
        <button
          type="button"
          aria-label={segment ? undefined : "Search"}
          onClick={commit}
          className={`search-submit absolute right-[var(--search-bar-inset)] top-[calc((var(--search-bar-h)-var(--search-btn))/2)] z-20 inline-flex h-[var(--search-btn)] shrink-0 items-center justify-center overflow-hidden rounded-[var(--r-btn-round)] text-white transition-[width,padding,gap] duration-spring-fast ease-spring-fast ${segment ? "w-[var(--search-btn-expanded)] gap-2 px-4" : "w-[var(--search-btn)] p-0"}`}
        >
          <Search size={16} strokeWidth={2.5} className="block shrink-0" aria-hidden />
          {segment ? (
            <span className="t-search-button min-w-0 overflow-hidden whitespace-nowrap">Search</span>
          ) : null}
        </button>
      </div>
      {segment ? (
        <div
          className={`absolute z-20 ${
            segment === "where"
              ? "left-0 top-[calc(100%+12px)]"
              : segment === "who" || segment === "service"
                ? segment === "service"
                  ? "right-0 top-[calc(100%+12px)]"
                  : "right-[47px] top-[calc(100%+28px)]"
                : "left-1/2 top-[calc(100%+12px)] -translate-x-1/2"
          }`}
        >
          <div data-guest-search className="search-panel overflow-hidden rounded-[32px] bg-white shadow-popover">
          {segment === "where" ? <WherePanel /> : null}
          {segment === "when" ? <WhenPanel /> : null}
          {segment === "who" ? <WhoPanel /> : null}
          {segment === "service" ? <ServiceTypePanel /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CompactPill({ expanded = false }: { expanded?: boolean }) {
  const { open, compactWhere, compactWhen, compactWho } = useGuestSearch();
  return (
    <div data-guest-search data-expanded={expanded ? "true" : "false"} className="compact-pill relative flex h-[var(--compact-pill-h)] w-max max-w-[calc(100vw-8rem)] items-center">
      <span aria-hidden className="compact-pill-surface" />
      <div className="compact-pill-row relative flex items-center">
        <button type="button" onClick={() => open("where")} className="compact-seg -m-px flex h-12 items-center rounded-[var(--r-compact-seg-l)] border border-transparent">
          <PillHouse className="ml-2 h-8 w-8 shrink-0" />
          <span className="t-compact-pill max-w-[168px] truncate pr-4">{compactWhere}</span>
        </button>
        <span className="h-6 w-px bg-hairline" />
        <button type="button" onClick={() => open("when")} className="compact-seg -m-px h-12 rounded-[var(--r-compact-seg)] border border-transparent">
          <span className="t-compact-pill block max-w-[120px] truncate px-4">{compactWhen}</span>
        </button>
        <span className="h-6 w-px bg-hairline" />
        <button type="button" onClick={() => open("who")} className="compact-seg -m-px h-12 rounded-[var(--r-compact-seg-r)] border border-transparent">
          <span className="t-compact-pill block truncate px-4">{compactWho}</span>
        </button>
      </div>
      <div className="compact-pill-go relative h-full w-[39px] py-[7px] pr-[7px]">
        <button
          type="button"
          aria-label="Search"
          onClick={() => open("where")}
          className="search-submit inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-btn-round)] p-0 text-white"
        >
          <Search size={12} strokeWidth={3} className="block shrink-0" />
        </button>
      </div>
    </div>
  );
}

export function MobileSearch({ tall = false }: { tall?: boolean }) {
  const search = useGuestSearch();
  const { filters } = useSearchFilters();
  const hasSearch = search.compactWhere !== "Anywhere" || search.compactWhen !== "Any week" || search.compactWho !== "Add guests";
  const { draft, setDraft, setMobileOpen, mobileOpen, mobileStep, setMobileStep, commit, loadDraft } = search;
  const openSheet = () => {
    loadDraft();
    setMobileStep("where");
    setMobileOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className={`mobile-search-pill flex w-full items-center justify-center border border-hairline bg-white px-[19px] py-[10px] md:hidden ${tall ? "h-14" : "h-12"}`}
      >
        <span className="t-compact flex min-w-0 items-center gap-1">
          <Search size={16} className="shrink-0" />
          <span className="truncate">
            {hasSearch ? `${search.compactWhere} · ${search.compactWhen} · ${search.compactWho}` : "Start your search"}
          </span>
        </span>
      </button>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden">
          <div className="flex items-center justify-between border-b border-divider px-4 py-3">
            <button type="button" aria-label="Close" onClick={() => setMobileOpen(false)} className="rounded-full p-2 hover:bg-soft">
              <X size={18} />
            </button>
            <p className="t-modal-title">Search</p>
            <span className="w-8" />
          </div>
          <div className="flex gap-2 px-4 pt-4">
            {(
              [
                ["where", "Where"],
                ["when", "When"],
                ["who", "Who"],
              ] as const
            ).map(([step, label]) => (
              <button
                key={step}
                type="button"
                onClick={() => setMobileStep(step)}
                className={`rounded-full px-4 py-2 text-body ${mobileStep === step ? "bg-ink text-white" : "bg-soft text-ink"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-6">
            {mobileStep === "where" ? (
              <div>
                <input
                  value={draft.location}
                  onChange={(event) => setDraft({ ...draft, location: event.target.value, nearby: false })}
                  placeholder="Search destinations"
                  className="w-full rounded-xl border border-hairline px-4 py-3 text-body outline-none focus:border-ink"
                />
                <p className="t-dropdown-heading mb-1 mt-4 px-3">Suggested destinations</p>
                <div>
                  {filterDestinations(draft.location).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setDraft({ ...draft, location: item.query, nearby: item.id === "nearby" });
                        setMobileStep("when");
                      }}
                      className="mx-2 flex items-center gap-4 rounded-xl p-2 text-left hover:bg-row-hover"
                    >
                      <TintTile item={item} />
                      <span>
                        <span className="t-dropdown-dest-title block">{item.title}</span>
                        <span className="t-dropdown-dest-subtitle block">{item.subtitle}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {mobileStep === "when" ? (
              <DateRangePicker checkIn={draft.checkIn} checkOut={draft.checkOut} onChange={(checkIn, checkOut) => setDraft({ ...draft, checkIn, checkOut })} />
            ) : null}
            {mobileStep === "who" ? (
              <GuestPicker
                value={draft.guests}
                onChange={(guests) => setDraft({ ...draft, guests })}
                petsHint={filters.allows_pets ? "Allows pets" : undefined}
              />
            ) : null}
          </div>
          <div className="flex items-center justify-between border-t border-divider px-4 py-4">
            <button
              type="button"
              className="t-link"
              onClick={() => setDraft({ location: "", nearby: false, guests: EMPTY_GUESTS })}
            >
              Clear all
            </button>
            <button type="button" onClick={commit} className="search-fill t-button rounded-lg px-6 py-3 text-white">
              Search
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
