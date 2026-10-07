"""Seed time-slot experiences, slots, and sample bookings."""

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.models import Experience, ExperienceBooking, ExperienceImage, ExperienceItineraryItem, ExperienceReview, ExperienceSlot, User
from app.models.enums import ExperienceBookingStatus, ExperienceCategory
from app.models.experience import generate_experience_confirmation_code
from app.services.experience_review_service import refresh_experience_rating

IST = ZoneInfo("Asia/Kolkata")
_IMAGES = [
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=70&auto=format",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70&auto=format",
    "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&q=70&auto=format",
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=70&auto=format",
    "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&q=70&auto=format",
]

_SPECS: list[dict] = [
    {
        "title": "Explore Street Shopping and try Local Food",
        "city": "Chennai",
        "region": "Tamil Nadu",
        "category": ExperienceCategory.food,
        "host": "ananya.mehta@example.com",
        "duration": 180,
        "price": 2899,
        "lat": 13.0827,
        "lng": 80.2707,
        "meeting": ("Adambakkam Police Station", "1st Street, New Colony Main Rd, Adambakkam, Chennai, TN"),
        "included": "Light bites and market tastings",
    },
    {
        "title": "Sunset kayak tour on the backwaters",
        "city": "Goa",
        "region": "Goa",
        "category": ExperienceCategory.nature,
        "host": "ananya.mehta@example.com",
        "duration": 120,
        "price": 2800,
        "lat": 15.2993,
        "lng": 74.1240,
        "meeting": ("Anjuna beach meet-up", "Near Anjuna flea market, Goa"),
    },
    {
        "title": "Old city food walk with a local chef",
        "city": "Jaipur",
        "region": "Rajasthan",
        "category": ExperienceCategory.food,
        "host": "arjun.deshmukh@example.com",
        "duration": 150,
        "price": 1900,
        "lat": 26.9124,
        "lng": 75.7873,
        "meeting": ("Hawa Mahal gate", "Tripolia Bazar, Jaipur"),
    },
    {
        "title": "Pottery workshop in an artist studio",
        "city": "Bengaluru",
        "region": "Karnataka",
        "category": ExperienceCategory.art,
        "host": "meera.iyer@example.com",
        "duration": 120,
        "price": 2200,
        "lat": 12.9716,
        "lng": 77.5946,
        "meeting": ("Indiranagar studio", "12th Main, Bengaluru"),
    },
    {
        "title": "Tea tasting in the Nilgiri hills",
        "city": "Coorg",
        "region": "Karnataka",
        "category": ExperienceCategory.nature,
        "host": "rohan.kapoor@example.com",
        "duration": 120,
        "price": 3500,
        "lat": 12.4244,
        "lng": 75.7382,
        "meeting": ("Estate gate", "Madikeri road, Coorg"),
    },
    {
        "title": "Photography walk at golden hour",
        "city": "Udaipur",
        "region": "Rajasthan",
        "category": ExperienceCategory.art,
        "host": "meera.iyer@example.com",
        "duration": 90,
        "price": 2400,
        "lat": 24.5854,
        "lng": 73.7125,
        "meeting": ("City Palace steps", "Old city, Udaipur"),
    },
    {
        "title": "Heritage lanes of Fort Kochi",
        "city": "Kochi",
        "region": "Kerala",
        "category": ExperienceCategory.history,
        "host": "ananya.mehta@example.com",
        "duration": 120,
        "price": 2100,
        "lat": 9.9312,
        "lng": 76.2673,
        "meeting": ("Chinese fishing nets", "Fort Kochi beach"),
    },
    {
        "title": "Bollywood dance for beginners",
        "city": "Mumbai",
        "region": "Maharashtra",
        "category": ExperienceCategory.art,
        "host": "meera.iyer@example.com",
        "duration": 90,
        "price": 1700,
        "lat": 19.0760,
        "lng": 72.8777,
        "meeting": ("Dance studio Bandra", "Linking Road, Mumbai"),
    },
    {
        "title": "Forest yoga and breathwork",
        "city": "Manali",
        "region": "Himachal Pradesh",
        "category": ExperienceCategory.wellness,
        "host": "rohan.kapoor@example.com",
        "duration": 90,
        "price": 3200,
        "lat": 32.2396,
        "lng": 77.1887,
        "meeting": ("Old Manali bridge", "Manali, HP"),
    },
    {
        "title": "Pink city fashion walk",
        "city": "Jaipur",
        "region": "Rajasthan",
        "category": ExperienceCategory.shopping_fashion,
        "host": "arjun.deshmukh@example.com",
        "duration": 150,
        "price": 2600,
        "lat": 26.9124,
        "lng": 75.7873,
        "meeting": ("Johari Bazaar", "Jaipur old city"),
        "private_price": 12000,
    },
    {
        "title": "French Quarter food crawl",
        "city": "Puducherry",
        "region": "Puducherry",
        "category": ExperienceCategory.food,
        "host": "ananya.mehta@example.com",
        "duration": 120,
        "price": 2300,
        "lat": 11.9416,
        "lng": 79.8083,
        "meeting": ("White Town clock", "Puducherry"),
    },
    {
        "title": "Spice market tour with a chef",
        "city": "Goa",
        "region": "Goa",
        "category": ExperienceCategory.food,
        "host": "ananya.mehta@example.com",
        "duration": 120,
        "price": 2500,
        "lat": 15.4909,
        "lng": 73.8278,
        "meeting": ("Mapusa market", "Mapusa, Goa"),
    },
]


def seed_experiences(db: Session, users: dict[str, User], guests: list[User]) -> tuple[int, int, int]:
    experiences: list[Experience] = []
    for index, spec in enumerate(_SPECS):
        host = users[spec["host"]]
        meeting_name, meeting_addr = spec["meeting"]
        exp = Experience(
            host_id=host.id,
            title=spec["title"],
            city=spec["city"],
            region=spec["region"],
            category=spec["category"],
            description=(
                f"{spec['title']} with {host.name}. "
                "Small groups, local stories, and hands-on time with a trusted host."
            ),
            duration_minutes=spec["duration"],
            language="English",
            max_guests_per_slot=5,
            price_per_guest=spec["price"],
            private_price=spec.get("private_price"),
            whats_included=spec.get("included", "Guided experience with your host"),
            guest_requirements=13,
            activity_level="Light",
            accessibility_note="Message your host for details.",
            meeting_point_name=meeting_name,
            meeting_point_address=meeting_addr,
            lat=spec["lat"],
            lng=spec["lng"],
        )
        for position, url in enumerate(_IMAGES[: 3 + index % 3]):
            exp.images.append(ExperienceImage(url=url, position=position))
        for position, (title, desc) in enumerate(
            [
                ("Meet your host", "Gather at the meeting point and get oriented."),
                ("Main activity", "The core of the experience with time to explore."),
                ("Wrap up", "Photos, recommendations, and farewell."),
            ]
        ):
            exp.itinerary.append(
                ExperienceItineraryItem(
                    position=position,
                    title=title,
                    description=desc,
                    image_url=_IMAGES[position % len(_IMAGES)],
                )
            )
        db.add(exp)
        experiences.append(exp)
    db.flush()

    slot_count = 0
    today_ist = datetime.now(IST).date()
    for exp_index, exp in enumerate(experiences):
        for day_offset in range(30):
            day = today_ist + timedelta(days=day_offset + 1)
            times = [(11, 0), (14, 0)] if day_offset % 2 == exp_index % 2 else [(11, 0)]
            for hour, minute in times:
                start = datetime(day.year, day.month, day.day, hour, minute, tzinfo=IST).astimezone(timezone.utc)
                end = start + timedelta(minutes=exp.duration_minutes)
                slot = ExperienceSlot(
                    experience_id=exp.id,
                    start_at=start,
                    end_at=end,
                    capacity=exp.max_guests_per_slot,
                    booked_count=0,
                )
                db.add(slot)
                slot_count += 1
    db.flush()

    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    booking_count = 0
    review_count = 0
    if not guests:
        return len(experiences), slot_count, 0

    slots = list(
        db.scalars(
            select(ExperienceSlot)
            .options(selectinload(ExperienceSlot.experience))
            .order_by(ExperienceSlot.start_at)
            .limit(6)
        )
    )
    exp_by_id = {exp.id: exp for exp in experiences}

    for slot in slots[:2]:
        guest = guests[booking_count % len(guests)]
        price = exp_by_id[slot.experience_id].price_per_guest
        booking = ExperienceBooking(
            slot_id=slot.id,
            guest_id=guest.id,
            adults=1,
            status=ExperienceBookingStatus.confirmed,
            price_per_guest_snapshot=price,
            total_snapshot=price,
            confirmation_code=generate_experience_confirmation_code(),
        )
        slot.booked_count += 1
        db.add(booking)
        booking_count += 1
    db.flush()

    for slot in slots[2:4]:
        guest = guests[0]
        exp = exp_by_id[slot.experience_id]
        past_start = datetime.now(timezone.utc) - timedelta(days=3)
        slot.start_at = past_start
        slot.end_at = past_start + timedelta(minutes=exp.duration_minutes)
        booking = ExperienceBooking(
            slot_id=slot.id,
            guest_id=guest.id,
            adults=2,
            status=ExperienceBookingStatus.confirmed,
            price_per_guest_snapshot=exp.price_per_guest,
            total_snapshot=exp.price_per_guest * 2,
            confirmation_code=generate_experience_confirmation_code(),
        )
        slot.booked_count = 2
        db.add(booking)
        db.flush()
        db.add(
            ExperienceReview(
                booking_id=booking.id,
                experience_id=exp.id,
                author_id=guest.id,
                rating=5,
                comment="Wonderful experience — would book again.",
            )
        )
        refresh_experience_rating(db, exp.id)
        review_count += 1
        booking_count += 1

    return len(experiences), slot_count, booking_count
