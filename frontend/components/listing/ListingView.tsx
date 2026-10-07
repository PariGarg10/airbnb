"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { addDays, differenceInCalendarDays, parseISO } from "date-fns";
import { Award, Heart, Medal, Share } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SwitchUserModal } from "@/components/auth/SwitchUserModal";
import { Gallery } from "@/components/listing/Gallery";
import { ListingGuestFavourite } from "@/components/listing/ListingGuestFavourite";
import { ListingHighlights } from "@/components/listing/ListingHighlights";
import { ListingSectionNav } from "@/components/listing/ListingSectionNav";
import { WhereYoullSleep } from "@/components/listing/WhereYoullSleep";
import { ListingLocationSection } from "@/components/listing/ListingLocationSection";
import { ListingMeetHost } from "@/components/listing/ListingMeetHost";
import { ListingReviewsSection } from "@/components/listing/ListingReviewsSection";
import { ListingThingsToKnow } from "@/components/listing/ListingThingsToKnow";
import { MoreStaysNearby } from "@/components/listing/MoreStaysNearby";
import { ReserveCard } from "@/components/listing/ReserveCard";
import { DateRangePicker, type DisabledRange } from "@/components/search/DateRangePicker";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { ListingAboutModal } from "@/components/listing/modals/ListingAboutModal";
import { ListingAmenitiesModal } from "@/components/listing/modals/ListingAmenitiesModal";
import { ListingReviewsModal } from "@/components/listing/modals/ListingReviewsModal";
import { useStayParams } from "@/hooks/useStayParams";
import { useWishlist } from "@/hooks/useWishlist";
import { amenityIcon } from "@/lib/amenityIcons";
import { listingsApi, reviewsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { GUEST_FAVOURITE_BLURB } from "@/lib/brand";
import { formatBathroomFacts, formatOccupantsNote } from "@/lib/listingFacts";
import { bookHref } from "@/lib/bookUrl";
import { formatInr, formatListingStaySubtitle, formatRating, formatStay, roomTypeLabel } from "@/lib/format";
import { isGuestFavourite } from "@/lib/isGuestFavourite";
import type { BookedRange, ListingDetail } from "@/types";

function hostingLabel(joinedYear: number): string {
  const years = Math.max(0, new Date().getFullYear() - joinedYear);
  if (years <= 0) return "New host";
  return years === 1 ? "1 year hosting" : `${years} years hosting`;
}

function nightsBetween(checkIn?: string, checkOut?: string): number {
  if (!checkIn || !checkOut) return 0;
  const nights = differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
  return nights > 0 ? nights : 0;
}

function overlapsBooked(checkIn: string, checkOut: string, booked: BookedRange[]): boolean {
  const start = parseISO(checkIn).getTime();
  const end = parseISO(checkOut).getTime();
  return booked.some((range) => start < parseISO(range.check_out).getTime() && parseISO(range.check_in).getTime() < end);
}

function disabledRanges(booked: BookedRange[]): DisabledRange[] {
  return booked.flatMap((range) => {
    const from = parseISO(range.check_in);
    const to = addDays(parseISO(range.check_out), -1);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return [];
    return [{ from, to }];
  });
}

function countPhrase(count: number, singular: string, plural: string): string {
  const label = Number.isInteger(count) ? String(count) : String(count);
  return `${label} ${count === 1 ? singular : plural}`;
}

const OPTIONAL_SAFETY = [
  { name: "Carbon monoxide alarm", icon: "circle" },
  { name: "Smoke alarm", icon: "alarm-smoke" },
] as const;

export function ListingView({ initialListing }: { initialListing: ListingDetail }) {
  const listingQuery = useQuery({
    queryKey: ["listing", initialListing.id],
    queryFn: () => listingsApi.get(initialListing.id),
    initialData: initialListing,
    staleTime: 0,
  });
  const listing = listingQuery.data;
  const { user } = useAuth();
  const { onHeart } = useWishlist();
  const { checkIn, checkOut, guests, setStay } = useStayParams();
  const [authOpen, setAuthOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<number[]>([]);
  const booked = useQuery({
    queryKey: ["booked-dates", listing.id],
    queryFn: () => listingsApi.bookedDates(listing.id),
  });
  const reviews = useInfiniteQuery({
    queryKey: ["reviews", listing.id],
    queryFn: ({ pageParam }) => reviewsApi.list(listing.id, pageParam, 6),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.has_more ? last.page + 1 : undefined),
  });
  const blocked = disabledRanges(booked.data ?? []);
  const nights = nightsBetween(checkIn, checkOut);
  const guestFavourite = isGuestFavourite(listing);
  const hasSelfCheckIn = listing.amenities.some((item) => item.name === "Self check-in");
  const amenityNames = new Set(listing.amenities.map((item) => item.name));
  const missingSafety = OPTIONAL_SAFETY.filter((item) => !amenityNames.has(item.name));
  const previewAmenities = listing.amenities.slice(0, 10);
  const desktopAmenityPreview = listing.amenities.slice(0, 6);
  const reserveAnchorRef = useRef<HTMLDivElement>(null);
  const [reserveVisible, setReserveVisible] = useState(true);

  useEffect(() => {
    const node = reserveAnchorRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setReserveVisible(entry?.isIntersecting ?? true), {
      root: null,
      threshold: 0.05,
      rootMargin: "-80px 0px 0px 0px",
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const reviewItems = reviews.data?.pages[0]?.items ?? [];
  const allReviews = reviews.data?.pages.flatMap((page) => page.items) ?? [];
  const distribution = reviews.data?.pages[0]?.rating_distribution;
  const guestCount = Math.min(listing.max_guests, Math.max(1, guests ?? 1));
  const quote = useQuery({
    queryKey: ["quote", listing.id, checkIn, checkOut, guestCount],
    queryFn: () =>
      listingsApi.quote(listing.id, { check_in: checkIn ?? "", check_out: checkOut ?? "", guests: guestCount }),
    enabled: Boolean(checkIn && checkOut),
    retry: false,
  });

  const applyDates = (nextIn?: string, nextOut?: string) => {
    if (nextIn && nextOut && overlapsBooked(nextIn, nextOut, booked.data ?? [])) {
      toast.error("These dates are already booked");
      return;
    }
    setStay({ check_in: nextIn ?? null, check_out: nextOut ?? null });
  };

  const save = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    onHeart({ id: listing.id, is_wishlisted: listing.is_wishlisted, image: listing.images[0]?.url });
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const reserveHref =
    quote.data && checkIn && checkOut
      ? bookHref(listing.id, checkIn, checkOut, { adults: guestCount, children: 0, infants: 0, pets: 0 })
      : "";

  const navPriceLine =
    quote.data && nights > 0 ? (
      quote.data.original_total > quote.data.total ? (
        <>
          <span className="text-muted line-through">{formatInr(quote.data.original_total)}</span>{" "}
          {formatInr(quote.data.total)} for {nights} {nights === 1 ? "night" : "nights"}
        </>
      ) : (
        `${formatInr(quote.data.total)} for ${nights} ${nights === 1 ? "night" : "nights"}`
      )
    ) : (
      `${formatInr(listing.price_per_night)} night`
    );

  const scrollToAvailability = () => document.getElementById("availability")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="container-airbnb pb-28 pt-6 min-[1128px]:pt-8">
      <div className="mb-4 flex items-start justify-between gap-6 min-[1128px]:mb-6">
        <h1 className="t-listing-title min-[1128px]:text-[32px] min-[1128px]:leading-9 min-[1128px]:tracking-[-0.04rem]">
          {listing.title}
        </h1>
        <div className="flex shrink-0 items-center gap-1 min-[1128px]:gap-0">
          <button
            type="button"
            onClick={() => void share()}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-base max-[1127px]:t-link min-[1128px]:px-4 min-[1128px]:py-2.5 min-[1128px]:font-semibold min-[1128px]:leading-5 min-[1128px]:text-ink min-[1128px]:underline min-[1128px]:decoration-1 min-[1128px]:underline-offset-2 min-[1128px]:hover:bg-soft"
          >
            <Share size={16} strokeWidth={2} className="min-[1128px]:no-underline" />
            Share
          </button>
          <button
            type="button"
            onClick={save}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-base max-[1127px]:t-link min-[1128px]:px-4 min-[1128px]:py-2.5 min-[1128px]:font-semibold min-[1128px]:leading-5 min-[1128px]:text-ink min-[1128px]:underline min-[1128px]:decoration-1 min-[1128px]:underline-offset-2 min-[1128px]:hover:bg-soft"
          >
            <Heart size={16} strokeWidth={2} className={listing.is_wishlisted ? "fill-rausch text-rausch min-[1128px]:no-underline" : "min-[1128px]:no-underline"} />
            Save
          </button>
        </div>
      </div>

      <Gallery images={listing.images} title={listing.title} onShare={() => void share()} onSave={save} wishlisted={listing.is_wishlisted} />

      <ListingSectionNav
        reserveVisible={reserveVisible}
        priceLine={navPriceLine}
        reserveHref={reserveHref}
        onPickDates={scrollToAvailability}
      />

      <div className="mt-8 grid gap-12 max-[1127px]:grid-cols-1 min-[1128px]:mt-10 min-[1128px]:grid-cols-[minmax(0,1fr)_var(--listing-sidebar-w)] min-[1128px]:gap-[var(--listing-main-gap)]">
        <div className="order-2 min-w-0 max-[1127px]:order-2 min-[1128px]:order-1">
          <h2 className="t-overview min-[1128px]:text-[22px] min-[1128px]:leading-[26px]">
            {roomTypeLabel(listing.room_type)} in {listing.city}, {listing.country}
          </h2>
          <p className="t-facts mt-2 min-[1128px]:mt-1">
            {countPhrase(listing.max_guests, "guest", "guests")} · {countPhrase(listing.bedrooms, "bedroom", "bedrooms")} ·{" "}
            {countPhrase(listing.beds, "bed", "beds")} · {formatBathroomFacts(listing)}
          </p>
          {formatOccupantsNote(listing.occupants) ? (
            <p className="mt-3 text-meta text-muted min-[1128px]:text-sm min-[1128px]:leading-[18px]">
              {formatOccupantsNote(listing.occupants)}
            </p>
          ) : null}

          {guestFavourite ? (
            <>
              <div className="mt-6 max-[1127px]:block min-[1128px]:hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-hairline px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Award size={28} />
                    <div>
                      <p className="font-semibold">Guest favourite</p>
                      <p className="max-w-xs text-meta text-muted">{GUEST_FAVOURITE_BLURB}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="t-rating-display">{formatRating(listing.avg_rating)}</p>
                    <p className="text-label">★★★★★</p>
                  </div>
                  <a href="#reviews" className="text-center">
                    <p className="text-lg font-semibold">{listing.review_count}</p>
                    <p className="text-label underline">Reviews</p>
                  </a>
                </div>
              </div>
              <ListingGuestFavourite rating={listing.avg_rating} reviewCount={listing.review_count} />
            </>
          ) : listing.review_count > 0 ? (
            <p className="mt-6 text-body font-semibold min-[1128px]:mt-8">
              ★ {formatRating(listing.avg_rating)} · {listing.review_count} reviews
            </p>
          ) : null}

          <Divider className="my-8 min-[1128px]:my-10" />
          <div className="flex items-center gap-4 min-[1128px]:gap-5">
            <div className="relative shrink-0">
              <Avatar
                name={listing.host.name}
                src={listing.host.avatar_url}
                size={48}
                className="min-[1128px]:!h-14 min-[1128px]:!w-14"
              />
              {listing.host.is_superhost ? (
                <span className="absolute -bottom-0.5 -right-0.5 hidden h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-ink text-white min-[1128px]:flex">
                  <Medal size={12} strokeWidth={2} />
                </span>
              ) : null}
            </div>
            <div>
              <p className="text-base font-semibold leading-5 text-ink min-[1128px]:text-[18px] min-[1128px]:leading-6">
                Hosted by {listing.host.name}
              </p>
              <p className="mt-0.5 text-meta text-muted min-[1128px]:text-sm min-[1128px]:leading-[18px]">
                {[listing.host.is_superhost ? "Superhost" : null, hostingLabel(listing.host.joined_year)].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          <div className="min-[1128px]:mt-8">
            <ListingHighlights
              selfCheckIn={hasSelfCheckIn}
              superhostName={listing.host.name}
              isSuperhost={listing.host.is_superhost}
            />
          </div>

          <Divider className="my-8 min-[1128px]:my-10" />
          <p className={`t-body whitespace-pre-wrap min-[1128px]:text-base min-[1128px]:leading-6 ${listing.description.length > 280 ? "line-clamp-6" : ""}`}>
            {listing.description}
          </p>
          {listing.description.length > 280 ? (
            <button
              type="button"
              className="mt-4 t-link max-[1127px]:mt-3 min-[1128px]:mt-6 min-[1128px]:rounded-lg min-[1128px]:bg-quaternary min-[1128px]:px-5 min-[1128px]:py-3 min-[1128px]:text-sm min-[1128px]:font-semibold min-[1128px]:leading-[18px] min-[1128px]:no-underline min-[1128px]:hover:bg-divider"
              onClick={() => setAboutOpen(true)}
            >
              Show more
            </button>
          ) : null}

          <Divider className="my-8 min-[1128px]:my-10" />
          <WhereYoullSleep bedrooms={listing.bedrooms} beds={listing.beds} images={listing.images} />
          <Divider className="my-8 hidden min-[1128px]:block min-[1128px]:my-10" />
          <section id="amenities">
            <h2 className="t-heading min-[1128px]:text-[22px] min-[1128px]:leading-[26px]">What this place offers</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 min-[1128px]:hidden">
              {previewAmenities.map((amenity) => {
                const Icon = amenityIcon(amenity.icon);
                return (
                  <p key={amenity.id} className="t-amenity flex items-center gap-3">
                    <Icon size={22} strokeWidth={1.5} />
                    {amenity.name}
                  </p>
                );
              })}
            </div>
            <div className="mt-8 hidden grid-cols-2 gap-x-8 gap-y-6 min-[1128px]:grid">
              {desktopAmenityPreview.map((amenity) => {
                const Icon = amenityIcon(amenity.icon);
                return (
                  <p key={amenity.id} className="t-amenity flex items-center gap-4">
                    <Icon size={24} strokeWidth={1.5} className="shrink-0" />
                    {amenity.name}
                  </p>
                );
              })}
              {missingSafety.map((item) => {
                const Icon = amenityIcon(item.icon);
                return (
                  <p key={item.name} className="t-amenity flex items-center gap-4 text-muted line-through decoration-muted">
                    <Icon size={24} strokeWidth={1.5} className="shrink-0 opacity-60" />
                    {item.name}
                  </p>
                );
              })}
            </div>
            {listing.amenities.length > 6 ? (
              <>
                <Button variant="outline" className="mt-6 min-[1128px]:hidden" onClick={() => setAmenitiesOpen(true)}>
                  Show all {listing.amenities.length} amenities
                </Button>
                <button
                  type="button"
                  className="mt-8 hidden rounded-lg bg-quaternary px-6 py-3.5 text-sm font-semibold leading-[18px] text-ink transition hover:bg-divider min-[1128px]:inline-flex"
                  onClick={() => setAmenitiesOpen(true)}
                >
                  Show all {listing.amenities.length} amenities
                </button>
              </>
            ) : null}
          </section>

          <Divider className="my-8 min-[1128px]:my-10" />
          <section id="availability">
            <h2 className="t-heading min-[1128px]:text-[22px] min-[1128px]:leading-[26px] min-[1128px]:tracking-[-0.0275rem]">
              {nights > 0 ? `${nights} ${nights === 1 ? "night" : "nights"} in ${listing.city}` : `Select dates in ${listing.city}`}
            </h2>
            <p className="mt-1 text-meta text-muted min-[1128px]:mt-2 min-[1128px]:text-sm min-[1128px]:leading-[18px]">
              {checkIn && checkOut ? (
                <>
                  <span className="min-[1128px]:hidden">{formatStay(checkIn, checkOut)}</span>
                  <span className="hidden min-[1128px]:inline">{formatListingStaySubtitle(checkIn, checkOut)}</span>
                </>
              ) : (
                "Add your travel dates for exact pricing"
              )}
            </p>
            <div className="mt-6 min-[1128px]:mt-8 min-[1128px]:max-w-[720px]">
              <div className="hidden min-[1128px]:block">
                <DateRangePicker
                  checkIn={checkIn}
                  checkOut={checkOut}
                  disabledRanges={blocked}
                  onChange={applyDates}
                  layout="listing-inline"
                  monthCount={2}
                />
              </div>
              <div className="min-[1128px]:hidden">
                <DateRangePicker checkIn={checkIn} checkOut={checkOut} disabledRanges={blocked} onChange={applyDates} layout="default" />
              </div>
            </div>
          </section>

          <Divider className="my-8 min-[1128px]:my-10" />
          <ListingReviewsSection
            avgRating={listing.avg_rating}
            reviewCount={listing.review_count}
            distribution={distribution}
            reviews={reviewItems}
            expandedReviews={expandedReviews}
            onToggleReview={(id) =>
              setExpandedReviews((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
            }
            onShowAll={() => setReviewsOpen(true)}
          />

          <Divider className="my-8 min-[1128px]:my-10" />
          <ListingLocationSection
            city={listing.city}
            state={listing.state}
            country={listing.country}
            lat={listing.lat}
            lng={listing.lng}
            approximate={listing.location_is_approximate}
          />

          <Divider className="my-8 min-[1128px]:my-10" />
          <ListingMeetHost host={listing.host} reviewCount={listing.review_count} avgRating={listing.avg_rating} />

          <Divider className="my-8 min-[1128px]:my-10" />
          <ListingThingsToKnow
            maxGuests={listing.max_guests}
            amenities={listing.amenities}
            hasExteriorCamera={listing.has_exterior_camera}
            hasNoiseMonitor={listing.has_noise_monitor}
            hasWeapons={listing.has_weapons}
          />

          <Divider className="my-8 min-[1128px]:my-10" />
          <MoreStaysNearby listingId={listing.id} city={listing.city} />
        </div>

        <div className="order-1 max-[1127px]:order-1 min-[1128px]:order-2 min-[1128px]:overflow-visible">
          <div ref={reserveAnchorRef} className="min-[1128px]:sticky min-[1128px]:top-[calc(var(--header-h)+var(--listing-nav-h)+16px)] min-[1128px]:overflow-visible min-[1128px]:z-20">
            <ReserveCard listing={listing} disabledRanges={blocked} onDatesChange={applyDates} />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-hairline bg-white px-4 py-3 lg:hidden">
        <div>
          <p className="font-semibold underline">{formatInr(listing.price_per_night)} night</p>
          <button type="button" className="text-body underline" onClick={() => document.getElementById("availability")?.scrollIntoView({ behavior: "smooth" })}>
            {checkIn && checkOut ? formatStay(checkIn, checkOut) : "Add dates"}
          </button>
        </div>
        {reserveHref ? (
          <Link href={reserveHref} className="search-fill t-reserve-button rounded-lg px-5 py-3">
            Reserve
          </Link>
        ) : (
          <Button onClick={() => document.getElementById("availability")?.scrollIntoView({ behavior: "smooth" })}>Check availability</Button>
        )}
      </div>

      <ListingAboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} description={listing.description} />
      <ListingAmenitiesModal open={amenitiesOpen} onClose={() => setAmenitiesOpen(false)} amenities={listing.amenities} />
      <ListingReviewsModal
        open={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        avgRating={listing.avg_rating}
        reviewCount={listing.review_count}
        distribution={distribution}
        reviews={allReviews}
        hasNextPage={Boolean(reviews.hasNextPage)}
        isFetchingNextPage={reviews.isFetchingNextPage}
        onLoadMore={() => void reviews.fetchNextPage()}
      />
      <SwitchUserModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

