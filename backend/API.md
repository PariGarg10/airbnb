# API

Base URL is the server origin. Authenticated routes read the `X-User-Id` header. A missing header is 401 `Authentication required`. An unknown id is 401 `Invalid user`. Host routes also require `is_host`, otherwise 403.

Application errors return `{"detail": "<message>"}`: 400 bad request, 403 forbidden, 404 not found, 409 conflict. Invalid query or body shapes return 422.

Money fields are integer currency units. `check_in` is inclusive and `check_out` is exclusive.

## Health

| Method | Path | Auth | Request | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | No | — | `{"status": "ok"}` |

## Users

| Method | Path | Auth | Request | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/users` | No | — | List of users: `id`, `name`, `email`, `avatar_url`, `bio`, `is_host`, `is_superhost` |
| GET | `/api/users/me` | Yes | — | The caller, same user shape |

## Listings

| Method | Path | Auth | Request | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/listings` | Optional | Query: `location`, `check_in`, `check_out`, `guests`, `min_price`, `max_price`, `property_types` (comma-separated), `room_type`, `amenities` (comma-separated ids, all must match), `category`, `min_bedrooms`, `min_beds` (≥ 1), `min_bathrooms` (≥ 0), `instant_book` (`true` keeps only listings with instant booking), `allows_pets` (`true` keeps only pet-friendly listings), `min_rating` (0–5; keeps listings whose `avg_rating` is at least this value and whose `review_count` is at least 3), `page` (default 1), `page_size` (default 20, max 50) | Paginated listing cards. A card has `id`, `title`, `city`, `country`, `property_type`, `room_type`, `price_per_night`, `avg_rating`, `review_count`, `bedrooms`, `beds`, `images` (up to 5 URLs), `lat`, `lng`, `host_is_superhost`, `is_wishlisted` (true when the caller has that listing on any wishlist). When both `check_in` and `check_out` are set, each card also has `nights` and `stay_total` (the quote total from `quote_price`, including cleaning and service fees). Without dates those two fields are null. Only active listings. `has_more` is true when another page exists |
| GET | `/api/listings/{id}` | Optional | — | Listing detail: bookable fields plus host-setup data (`booking_mode`, `show_precise_location`, `bedrooms_have_locks`, `private_bathrooms`, `dedicated_bathrooms`, `shared_bathrooms`, `bathrooms`, discount percents, safety flags, `allows_pets`, `occupants`), `location_is_approximate` (true when `show_precise_location` is false; `lat`/`lng` are then offset ~500 m), `images` (`id`, `url`, `caption`, `position`), `amenities`, `host`, `is_wishlisted`. 404 when missing, or when inactive unless the caller is that listing's host |
| GET | `/api/listings/{id}/booked-dates` | No | — | Pending and confirmed ranges with `check_out` on or after today: `check_in`, `check_out`. Expired pending requests are cleared first. 404 when the listing is missing or inactive |
| GET | `/api/listings/{id}/quote` | No | Query: `check_in`, `check_out`, `guests`, optional `coupon` | `nights`, `nightly_rate` (average pre-discount nightly rate, half-up), `nightly_breakdown`, `nights_total_original`, `nights_total` (after the listing discount), `discount` (`type`, `pct`, `amount`, `reason_text`) or null, `coupon` (`code`, `amount`) or null, `cleaning_fee`, `service_fee` (14% of discounted nights total + cleaning fee, half-up; a coupon does not change it), `taxes` (5% of nights after coupon + cleaning fee, half-up), `total`, `original_total` and `total_original` (same strikethrough total, before listing discount and coupon). 400 invalid stay or coupon, 409 dates taken by a pending or confirmed stay, 404 missing/inactive |
| GET | `/api/listings/{id}/reviews` | No | Query: `page` (default 1), `page_size` (default 6, max 50) | Paginated reviews plus `rating_distribution` with keys `"1"` through `"5"`. Each review has `id`, `rating`, `comment`, `created_at`, `author` (`name`, `avatar_url`, `created_at` — account join date). Newest first. 404 when the listing is missing or inactive |
| GET | `/api/amenities` | No | — | Catalog: `id`, `name`, `icon`, `group_name` |
| GET | `/api/categories` | No | — | Active listings grouped by category: `category`, `listing_count` |

## Bookings

| Method | Path | Auth | Request | Response |
| --- | --- | --- | --- | --- |
| POST | `/api/bookings` | Yes | `listing_id`, `check_in`, `check_out`, and either `num_guests` or `adults` (optional `children`, `infants` ≤ 5, `pets` ≤ 5). Optional `message_to_host`, `coupon_code`, `payment_method_type` (`card` \| `upi` \| `netbanking`), `card_brand`, `card_last4` (4 digits). Never send a card number | 201 booking detail. Price fields, taxes, and coupon are a snapshot. `instant` listings are `confirmed`. `approve_first_5` is `pending` until the listing has 5 confirmed bookings, then `confirmed`. A pending request requires `message_to_host`. Capacity is adults + children ≤ `max_guests` (infants do not count). Pets only when `allows_pets`. 400 invalid stay, pets, or coupon, 403 own listing, 404 missing or inactive listing, 409 overlapping pending or confirmed stay |
| GET | `/api/bookings/me` | Yes | — | `upcoming` (confirmed, checkout after today, check-in ascending), `pending` (check-in ascending), `past` (confirmed, checkout on or before today, descending), `cancelled` (cancelled, declined, or expired, descending). Each item is a booking summary plus `listing` (`id`, `title`, `city`, `country`, `cover_image`, `host_name`, `host_avatar`, `lat`, `lng`). Stale pending requests expire on this read |
| GET | `/api/bookings/{id}` | Yes | — | Full detail: guest breakdown, `message_to_host`, price snapshot lines, `confirmation_code`, `status`, `can_cancel`, `can_review`, `cancellation_policy_text`, check-in `15:00`, checkout `11:00`, host `{name, avatar, joined_year}`, companions. The listing address is included only when `confirmed`; otherwise the city only. Guest or listing host. 403 otherwise, 404 when missing |
| GET | `/api/bookings/{id}/cancellation-preview` | Yes | — | `refund_amount`, `non_refundable_amount`, `lines` (`label`, `amount`), `policy_text`. Full refund at least 24 hours before check-in at 15:00 (taxes and service fee included). Otherwise, before check-in, 50% of the nightly total plus tax on that part, and the cleaning fee. A pending request is a full refund. Guest only, and only while the stay can still be cancelled. 400 otherwise, 403 for anyone else |
| POST | `/api/bookings/{id}/cancel` | Yes | `reason`: `plans_changed` \| `found_another_place` \| `travel_restrictions` \| `host_asked` \| `personal_emergency` \| `other` | The booking, now `cancelled`, with `refund_amount`, `cancel_reason`, `cancelled_at`, and `cancelled_by` = `guest`. Only the guest, only while pending or confirmed, and only before the check-in date. 400 otherwise, 403 for anyone else |
| POST | `/api/bookings/{id}/companions` | Yes | `companions`: list of `{name, email}` | The booking's companions. Guest only. The total cannot exceed adults + children − 1. 400 over the limit or when the booking is no longer open, 403 for anyone else |
| POST | `/api/bookings/{id}/review` | Yes | `rating` (1–5), `comment` (10–1000 characters) | 201 review: `id`, `rating`, `comment`, `created_at`, `author` (`name`, `avatar_url`, `created_at`). Only the guest (403), only a confirmed stay whose checkout is today or earlier (400), and only once (409). The same transaction recomputes that listing's `avg_rating` (one decimal, half-up) and `review_count` from the reviews table |

## Host

Every host route uses `require_host`.

| Method | Path | Auth | Request | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/host/profile` | Host | — | Residential address on file (`country`, `flat`, `street`, `landmark`, `district`, `city`, `state`, `pin_code`, `is_business`, `updated_at`). Never returned on public listing APIs. 404 when not set |
| PUT | `/api/host/profile` | Host | Same fields as GET (required: `country`, `street`, `city`, `pin_code`) | Upsert profile. Required before the host's first listing can be published |
| GET | `/api/host/listings` | Host | — | The caller's active and inactive listings: `id`, `title`, `city`, `country`, `cover_image`, `price`, `avg_rating`, `is_active`, `total_bookings`, `upcoming_bookings` (confirmed stays with check-in after today) |
| POST | `/api/host/listings` | Host | Listing body below | 201 listing detail. 409 when host profile is missing and this would be the first published listing |
| PUT | `/api/host/listings/{id}` | Host | Same listing body. Replaces images (position follows list order) and amenities | Listing detail. 404 missing, 403 not the owner |
| DELETE | `/api/host/listings/{id}` | Host | — | `{"deleted": "soft"}` when any booking exists (`is_active` becomes false). `{"deleted": "hard"}` when it has no bookings and the row is removed. 404 missing, 403 not the owner |
| PATCH | `/api/host/listings/{id}/status` | Host | `{"is_active": true\|false}` | The host listing row. 409 when activating the first listing without a host profile. 404 missing, 403 not the owner |
| GET | `/api/host/bookings` | Host | Query: `status` = `upcoming` \| `current` \| `completed` \| `cancelled` \| `pending` | Bookings on the caller's listings. `current` means check-in on or before today and checkout after today. `cancelled` also includes declined and expired. `pending` is check-in ascending. Each item has `id`, `guest` (`name`, `avatar_url`), `listing` (`id`, `title`, `cover_image`), `check_in`, `check_out`, `guests`, `total_price`, `status`, `message_to_host`, `created_at` |
| POST | `/api/host/bookings/{id}/accept` | Host | — | Confirms a pending request on the caller's listing. 400 when it is not pending or has expired, 403 when the caller does not own it, 404 when missing |
| POST | `/api/host/bookings/{id}/decline` | Host | — | Declines a pending request. Records a full `refund_amount` and `cancelled_by` = `host`. Same errors as accept |
| GET | `/api/host/stats` | Host | — | `total_listings`, `active_listings`, `upcoming_bookings`, `earnings_this_month` (sum of `total_price` for confirmed bookings whose check-in is in the current month) |

Listing body: `title` (5–50), `description` (20–2000), `property_type`, `room_type`, `category`, `address`, `city`, `state` (optional), `country`, `lat`, `lng`, `price_per_night` (> 0), `cleaning_fee` (>= 0), `max_guests` (>= 1), `bedrooms` (>= 0), `beds` (>= 1), `private_bathrooms`, `dedicated_bathrooms`, `shared_bathrooms` (each >= 0, steps of 0.5; sum becomes `bathrooms`), `images` (1–20 objects `{url, caption?}`), `amenity_ids`, optional `booking_mode` (`instant` \| `approve_first_5`), `show_precise_location`, `bedrooms_have_locks`, `weekend_adjustment_pct` (0–99), discount percents (0–99), safety booleans, `allows_pets`, `occupants` (unique list of `me` \| `family` \| `other_guests` \| `flatmates`). 400 on invalid amenities or bathroom rules.

Bookings snapshot `discount_type`, `discount_amount`, `taxes`, `coupon_code`, `coupon_amount`, and `original_total` from the quote at booking time. `confirmation_code` is `HM` plus 8 uppercase letters or digits and is unique. Payments are mocked: only `payment_method_type`, `card_brand`, and `card_last4` are stored.

## Coupons

| Method | Path | Auth | Request | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/coupons/validate` | No | Query: `code`, `listing_id`, `check_in`, `check_out` | `{valid, amount, message}`. `amount` is the rupee discount on the nightly total after the listing discount. Unknown, inactive, expired, or used-up codes return `valid: false` and message `This coupon isn't valid`. 400 invalid stay, 404 missing or inactive listing |

Seed codes: `WELCOME10` (10%) and `FESTIVE15` (15%). A coupon is applied when `coupon_code` is sent to `POST /api/bookings` or `coupon` is sent to the quote. That increments `uses` only when the booking is created.

## Wishlists

SQLite `create_all` does not alter tables that already exist. After this schema change, rebuild from the `backend` directory with `python -m app.seed --reset` (drops every table, creates the current schema, and loads seed data, including a Favourites wishlist for each guest).

A listing can be saved on more than one of a user's wishlists. `is_wishlisted` on listing cards is true when it is on any of them.

| Method | Path | Auth | Request | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/wishlists` | Yes | — | The caller's wishlists, newest first. Each has `id`, `name`, `count` (active listings), `cover_images` (up to 4 cover URLs, newest save first), and `listing_ids` (those active listing ids) |
| POST | `/api/wishlists` | Yes | `name` (1–50 characters, trimmed), optional `listing_id` | 201 the created summary. When `listing_id` is set, that active listing is saved in the same request. 404 when that listing is missing or inactive (nothing is created). 409 when this user already has that name |
| GET | `/api/wishlists/saved-ids` | Yes | — | `{"listing_ids": [...]}`: distinct listing ids saved on any of the caller's wishlists |
| GET | `/api/wishlists/{id}` | Yes | — | Listing cards for the wishlist's active listings, newest save first. `is_wishlisted` is true. 404 when missing, 403 when the caller does not own it |
| PATCH | `/api/wishlists/{id}` | Yes | `{"name": "..."}` (1–50 characters, trimmed) | The updated summary. 409 on a duplicate name, 404 when missing, 403 when the caller does not own it |
| DELETE | `/api/wishlists/{id}` | Yes | — | 204. Saved rows are removed with the wishlist. 404 when missing, 403 when the caller does not own it |
| POST | `/api/wishlists/{id}/items/{listing_id}` | Yes | — | 204. Saving a listing that is already on the list is a no-op. 404 when the wishlist is missing or the listing is missing or inactive, 403 when the caller does not own the wishlist |
| DELETE | `/api/wishlists/{id}/items/{listing_id}` | Yes | — | 204. Removing a listing that is not on the list is a no-op. 404 when the wishlist or the listing is missing, 403 when the caller does not own the wishlist |

## Uploads

| Method | Path | Auth | Request | Response |
| --- | --- | --- | --- | --- |
| POST | `/api/uploads` | Yes | Multipart field `file`. jpeg, png, or webp, at most 5MB | `{"url": "<absolute URL>"}` built from the request origin and `/static/uploads/<uuid>.<ext>`. 400 for any other type or a larger file |

Files are served from `/static/uploads`.
