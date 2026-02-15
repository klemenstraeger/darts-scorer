# Darts Scorer

Professional darts scoring and tournament management app. Free, open-source, and installable as a PWA.

**[darts-scorer.app](https://darts-scorer.app)**

## Features

- **Game Scoring** — 501, 301, and other X01 variants with double-out or single-out finish rules. Supports 1–4 players per game with multi-leg and multi-set matches.
- **Interactive Dartboard** — SVG dartboard for tap-to-score input alongside a numpad for quick manual entry.
- **Tournament System** — Create and manage tournaments with knockout, round-robin league, group stage, and hybrid formats.
- **AI Opponents** — Play against bot players with 4 difficulty levels, powered by a realistic throw engine with checkout logic.
- **Statistics** — 15+ metrics including averages, checkout percentages, scoring breakdowns, trends over time, and dart heatmaps (via Unovis charts).
- **Live Spectating** — Share your game screen in real-time via WebRTC peer-to-peer broadcasting.
- **Player Management** — Create player profiles with custom avatars, track history across games and tournaments.
- **PWA** — Installable on any device, works offline with service worker caching.
- **Dark Mode** — Dark theme by default with light mode toggle.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Nuxt 4](https://nuxt.com) (Vue 3, SPA mode) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| UI Components | [shadcn-vue](https://www.shadcn-vue.com) (Reka UI primitives) |
| Auth | [Supabase Auth](https://supabase.com/auth) (email + magic link) |
| Database | PostgreSQL via [Supabase](https://supabase.com) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| State | [Pinia](https://pinia.vuejs.org) + localStorage |
| Charts | [Unovis](https://unovis.dev) |
| PWA | [@vite-pwa/nuxt](https://vite-pwa-org.netlify.app) |
| Testing | [Vitest](https://vitest.dev) |
| Deployment | Docker / Vercel |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 22+
- [pnpm](https://pnpm.io)
- A [Supabase](https://supabase.com) project (free tier works)

### Setup

```bash
# Clone the repository
git clone https://github.com/klemenstraeger/darts-scorer.git
cd darts-scorer

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
SUPABASE_URL="https://[ref].supabase.co"
SUPABASE_KEY="sb_publishable_..."
SUPABASE_SECRET_KEY="sb_secret_..."
```

### Database

```bash
# Push schema to your Supabase database
pnpm db:push
```

### Development

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Scripts

| Command | Description |
|---------|------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build locally |
| `pnpm test` | Run tests in watch mode |
| `pnpm test:run` | Run tests once |
| `pnpm db:generate` | Generate database migrations |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm db:push` | Push schema directly to database |
| `pnpm db:studio` | Open Drizzle Studio (database GUI) |

## Project Structure

```
├── app/
│   ├── components/     # Vue components (UI, tournament, spectate)
│   ├── composables/    # Vue composables (useGameState, useProfile, etc.)
│   ├── layouts/        # App layouts
│   ├── middleware/      # Route middleware (auth, profile guard)
│   ├── pages/          # File-based routing
│   ├── stores/         # Pinia stores
│   └── utils/          # Client utilities
├── server/
│   ├── api/            # API routes (game save, sync, players, tournaments)
│   ├── db/             # Database schema and connection
│   └── utils/          # Server utilities (auth, game saving)
├── shared/             # Shared code (game engine, models, events, bot AI)
├── public/             # Static assets (icons, robots.txt)
├── plans/              # Feature development plans
└── tests/              # Test files
```

## License

MIT
