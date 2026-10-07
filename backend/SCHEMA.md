# Database schema

Money columns are integers (whole INR). `check_in` is inclusive and `check_out` is exclusive. Listing delete is `RESTRICT` when bookings exist; images, amenity links, occupants, reviews, and wishlist rows cascade.

SQLite `create_all` does not alter tables that already exist. After a schema change, rebuild from the `backend` directory with `python -m app.seed --reset`.

```mermaid
erDiagram
    users ||--o| host_profiles : "residential address"
    users ||--o{ listings : hosts
    users ||--o{ bookings : "books as guest"
    users ||--o{ reviews : writes
    users ||--o{ wishlists : owns
    wishlists ||--o{ wishlist_items : contains
    listings ||--o{ listing_images : has
    listings ||--o{ listing_occupants : "who else"
    listings ||--o{ listing_amenities : tags
    amenities ||--o{ listing_amenities : "used by"
    listings ||--o{ bookings : receives
    listings ||--o{ reviews : receives
    listings ||--o{ wishlist_items : "saved on"
    bookings ||--o| reviews : "one per stay"
    bookings ||--o{ booking_companions : shares
    coupons |o--o{ bookings : "code copied, not an FK"

    users {
        int id PK
        string name
        string email UK
        string avatar_url
        string bio
        boolean is_host
        boolean is_superhost
        datetime created_at
    }

    host_profiles {
        int user_id PK
        string country
        string flat
        string street
        string landmark
        string district
        string city
        string state
        string pin_code
        boolean is_business
        datetime updated_at
    }

    listings {
        int id PK
        int host_id FK
        string title
        string description
        string property_type
        string room_type
        string category
        string address
        string city
        string state
        string country
        float lat
        float lng
        int price_per_night
        int cleaning_fee
        int max_guests
        int bedrooms
        int beds
        float bathrooms
        float private_bathrooms
        float dedicated_bathrooms
        float shared_bathrooms
        string booking_mode
        boolean instant_book
        boolean show_precise_location
        boolean bedrooms_have_locks
        int weekend_adjustment_pct
        int discount_new_listing_pct
        int discount_last_minute_pct
        int discount_weekly_pct
        int discount_monthly_pct
        boolean has_exterior_camera
        boolean has_noise_monitor
        boolean has_weapons
        boolean allows_pets
        float avg_rating
        int review_count
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    listing_images {
        int id PK
        int listing_id FK
        string url
        string caption
        int position
    }

    listing_occupants {
        int listing_id PK
        string occupant_type PK
    }

    amenities {
        int id PK
        string name UK
        string icon
        string group_name
    }

    listing_amenities {
        int listing_id PK
        int amenity_id PK
    }

    bookings {
        int id PK
        int listing_id FK
        int guest_id FK
        date check_in
        date check_out
        int num_guests
        int adults
        int children
        int infants
        int pets
        string message_to_host
        int nights
        int nightly_rate
        int cleaning_fee
        int service_fee
        string discount_type
        int discount_amount
        int taxes
        string coupon_code
        int coupon_amount
        int original_total
        int total_price
        string confirmation_code UK
        string payment_method_type
        string card_brand
        string card_last4
        datetime paid_at
        string cancel_reason
        datetime cancelled_at
        int refund_amount
        string cancelled_by
        string status
        datetime created_at
    }

    booking_companions {
        int id PK
        int booking_id FK
        string name
        string email
    }

    coupons {
        int id PK
        string code UK
        int percent_off
        int max_uses
        int uses
        datetime expires_at
        boolean active
    }

    reviews {
        int id PK
        int booking_id UK
        int listing_id FK
        int author_id FK
        int rating
        string comment
        datetime created_at
    }

    wishlists {
        int id PK
        int user_id FK
        string name
        datetime created_at
    }

    wishlist_items {
        int wishlist_id PK
        int listing_id PK
        datetime created_at
    }

    users ||--o{ experiences : hosts
    experiences ||--o{ experience_images : has
    experiences ||--o{ experience_itinerary_items : has
    experiences ||--o{ experience_slots : has
    experience_slots ||--o{ experience_bookings : receives
    users ||--o{ experience_bookings : books
    experience_bookings ||--o| experience_reviews : "one per booking"
    experiences ||--o{ experience_reviews : receives

    experiences {
        int id PK
        int host_id FK
        string title
        string city
        string region
        string category
        string description
        int duration_minutes
        int max_guests_per_slot
        int price_per_guest
        int private_price
        int cancellation_hours
        float avg_rating
        int review_count
        boolean is_active
    }

    experience_slots {
        int id PK
        int experience_id FK
        datetime start_at
        datetime end_at
        int capacity
        int booked_count
        boolean is_cancelled
    }

    experience_bookings {
        int id PK
        int slot_id FK
        int guest_id FK
        int adults
        string status
        int price_per_guest_snapshot
        int total_snapshot
        string confirmation_code UK
        datetime created_at
    }

    experience_reviews {
        int id PK
        int booking_id UK
        int experience_id FK
        int author_id FK
        int rating
        string comment
    }
```

Pricing for quotes and bookings is computed only in `pricing_service.quote_price` (weekend rates, single best listing discount, coupon, service fee, GST). Taxes are 5% of the nightly total after the listing discount and coupon, plus the cleaning fee, rounded half-up. The service fee stays 14% of the nightly total after the listing discount plus the cleaning fee, and a coupon does not change it. Pending and confirmed bookings block dates. A pending request expires 24 hours after `created_at`. Card numbers are not stored. `bathrooms` on a listing is the sum of the three bathroom columns, maintained on host create/update.
