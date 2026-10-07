# OpenStay

An Airbnb-style stays marketplace built for the SDE assignment. **OpenStay** is a full-stack demo: guests search and book homes, manage trips and wishlists, and hosts publish listings with a multi-step setup flow. The UI is measured against Airbnb’s layout and interaction patterns; branding, copy, icons, and photos are original (see [DESIGN.md](./DESIGN.md)).

| Layer | Stack |
| --- | --- |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2.0, Pydantic v2, SQLite |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack Query, Leaflet |

---

## For evaluators — quick start

You need **two terminals**: API on port **8000**, web app on port **3000**.

### 1. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env        # Windows — use `cp` on macOS/Linux
python -m app.seed --reset    # fresh DB + demo data (recommended first run)
uvicorn app.main:app --reload --port 8000
```

Check: [http://localhost:8000/api/health](http://localhost:8000/api/health) → `{"status":"ok"}`  
Interactive API: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend

```bash
cd frontend
npm install
copy .env.example .env.local   # Windows — use `cp` on macOS/Linux
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Important:** Run **only one** `npm run dev` at a time. Multiple instances corrupt `.next` and cause 500 errors (e.g. missing `middleware-manifest.json`). If that happens, stop all Node processes for this project, delete `frontend/.next`, then run `npm run dev` again—or use `npm run dev:clean`.

### 3. Production build (optional)

```bash
cd frontend
npm run build
```

Production builds write to `.next-build` so they do not clash with a running dev server (see `frontend/scripts/build.mjs`).

---

## Demo accounts

Auth is **mocked**: the frontend stores a user id in `localStorage` and sends **`X-User-Id`** on API calls. No passwords.

Use **Main menu → Switch user** in the app, or pick a user from `GET /api/users`.

| Role | Example users | What to try |
| --- | --- | --- |
| **Guest** | Sofia Alvarez, Liam Okafor, Priya Nair, Kenji Watanabe | Search (`/s`), listing detail, book flow (`/book/[id]`), trips, wishlists (heart → save to list) |
| **Host** | Ananya Mehta, Rohan Kapoor, … | Host hub (`/host`), listings, calendar, accept/decline requests |

Seed data includes listings across India and abroad, sample bookings, reviews, coupons (`WELCOME10`, `FESTIVE15`), and a **Favourites** wishlist per guest.

---

## Feature map (where to click)

| Area | Routes / notes |
| --- | --- |
| **Home** | `/` (All), `/?view=homes`, `/experiences`, `/services` (catalog mock) |
| **Search** | `/s` — filters, infinite scroll, split map on desktop |
| **Listing** | `/listings/[id]` — gallery, map, reviews, booking widget |
| **Checkout** | `/book/[listingId]` — dates, guests, coupon, mock payment |
| **Trips** | `/trips`, `/trips/[id]`, cancel flow |
| **Wishlists** | `/wishlists`, `/wishlists/[id]` — save via heart (log in as guest) |
| **Host** | `/host`, listing wizard, edit, bookings |
| **Help / legal** | `/help/*`, `/legal/terms`, `/legal/privacy` |

Maps use **MapTiler** when `NEXT_PUBLIC_MAPTILER_KEY` is set; otherwise **OpenStreetMap** (no key). Set the key in Vercel for production if you want the pale basemap.

---

## Environment variables

| File | Variable | Purpose |
| --- | --- | --- |
| `backend/.env` | `DATA_DIR` | SQLite DB and uploads directory (`.` locally) |
| | `FRONTEND_URL` | CORS primary origin (e.g. `http://localhost:3000`) |
| | `ALLOWED_ORIGINS` | Extra CORS origins (comma-separated) |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` | Backend origin, no trailing slash (e.g. `http://localhost:8000`) |
| | `NEXT_PUBLIC_MAPTILER_KEY` | Optional MapTiler key; OSM fallback if empty |

Examples: [backend/.env.example](./backend/.env.example), [frontend/.env.example](./frontend/.env.example).

---

## Tests

From `backend` with the venv active:

```bash
pytest
```

Covers listings, bookings, wishlists, host flows, pricing, and related API behaviour.

---

## Repository layout

```
Airbnb/
├── backend/
│   ├── app/              # FastAPI app, models, services, seed
│   ├── tests/
│   ├── API.md            # REST reference for evaluators
│   └── SCHEMA.md         # Database notes
├── frontend/
│   ├── app/              # Next.js routes
│   ├── components/
│   ├── lib/
│   └── scripts/          # build.mjs, visual audit
├── DESIGN.md             # Visual / token spec (Airbnb parity)
└── README.md             # this file
```

---

## Deployment notes

Typical setup: **frontend on Vercel**, **API on Railway** (or similar).

- Backend start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (see `backend/railway.json`).
- Set `NEXT_PUBLIC_API_URL` to the public API URL.
- Set `FRONTEND_URL` (and preview URLs in `ALLOWED_ORIGINS` if needed).
- Use a persistent volume for `DATA_DIR` in production so SQLite and uploads survive redeploys.

---

## Documentation

- [backend/API.md](./backend/API.md) — endpoints, auth header, query params, error shapes  
- [backend/SCHEMA.md](./backend/SCHEMA.md) — schema and reset instructions  
- [DESIGN.md](./DESIGN.md) — UI measurement rules and design tokens  

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Port 3000 / 3001 in use | Stop extra `npm run dev` processes; keep one server on 3000 |
| `middleware-manifest.json` / EPERM on `.next` | Kill all Next dev processes, delete `frontend/.next`, run `npm run dev:clean` |
| Empty wishlists after saving | Log in via Switch user; complete save modal or use single-list auto-save |
| API 401 | Ensure a guest/host is selected so `X-User-Id` is sent |
| Stale or broken DB after schema changes | `python -m app.seed --reset` from `backend` |

---

## License / assignment

Built as an educational SDE assignment. Not affiliated with Airbnb. Do not use Airbnb trademarks or assets in derivative work.
