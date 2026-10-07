# OpenStay frontend

Next.js 14 App Router client for [OpenStay](../README.md).

**Setup, demo users, env vars, and evaluator walkthrough:** see the [root README](../README.md).

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL to the API origin
npm run dev                    # http://localhost:3000 — run only one instance
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run dev:clean` | Delete `.next` then start dev (use if the cache is corrupted) |
| `npm run build` | Production build (output in `.next-build` while dev may be running) |
| `npm run lint` | ESLint |
| `npm run audit` | Playwright visual audit (optional) |

API contract: [../backend/API.md](../backend/API.md).
