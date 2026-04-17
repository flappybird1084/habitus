# Habitus

A personal habit tracking web app inspired by [Loop Habit Tracker (uhabits)](https://github.com/iSoron/uhabits) by Álinson Santos Xavier.

## Features

- **Habit management** — create, edit, archive, and delete habits with custom colors and icons
- **Daily check-ins** — toggle completion directly from the home page
- **Habit detail** — score ring, current/longest streaks, 6-month history grid, bar chart (week/month/year), and weekday frequency heatmap
- **Global stats** — radar chart comparing all habits, sorted by score or streak
- **Settings** — light/dark/system theme, configurable first day of week, CSV export, clear all data
- **Optimistic UI** — instant visual feedback with server-side persistence via Next.js Server Actions
- **Responsive** — sidebar navigation on desktop, bottom nav on mobile
- **No account needed** — all data stored locally in a SQLite database

## Screenshots

![Habit list](assets/Screenshot%202026-04-16%20at%206.44.14%20PM.png)
*Home — daily check-ins with progress, streaks, and scores*

![Statistics](assets/Screenshot%202026-04-16%20at%206.44.21%20PM.png)
*Statistics — global scores, streaks, and completion rate*

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| ORM | Drizzle ORM |
| Database | SQLite via `better-sqlite3` |
| Charts | Recharts |
| Icons | Lucide React |
| Themes | next-themes |

## Project Structure

```
.
├── app/
│   ├── page.tsx                  # Home: habit list + daily check-ins
│   ├── habits/
│   │   ├── new/page.tsx          # Create habit
│   │   └── [id]/
│   │       ├── page.tsx          # Habit detail
│   │       ├── HabitDetailClient.tsx
│   │       └── edit/page.tsx     # Edit habit
│   ├── stats/
│   │   ├── page.tsx              # Global stats
│   │   └── StatsClient.tsx
│   └── settings/
│       ├── page.tsx              # Settings
│       └── SettingsClient.tsx
├── components/
│   ├── HabitCard.tsx             # Home page habit row
│   ├── HomePageClient.tsx        # Home page client wrapper
│   ├── HabitForm.tsx             # Create/edit form
│   ├── CheckmarkButton.tsx       # Circular completion toggle
│   ├── ScoreRing.tsx             # SVG circular score indicator
│   ├── HistoryGrid.tsx           # GitHub-style 6-month grid
│   ├── HabitBarChart.tsx         # Recharts bar chart (week/month/year)
│   └── FrequencyHeatmap.tsx      # Weekday completion rate bars
├── lib/
│   ├── models.ts                 # Data types, palette, score/streak logic
│   ├── utils.ts                  # cn(), date formatters
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema (habits, entries, settings)
│   │   └── index.ts              # getDb() singleton, DDL migrations, seeding
│   └── actions/
│       ├── habits.ts             # getAllHabitsWithStats, addHabit, updateHabit, ...
│       ├── entries.ts            # getEntries, setEntry, toggleEntry
│       └── settings.ts          # getFirstWeekday, setFirstWeekday
├── data/                         # SQLite database (git-ignored, Docker volume)
│   └── habitus.db
├── public/                       # Static assets
├── Dockerfile
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The SQLite database is created automatically at `data/habitus.db` on first run, seeded with 5 sample habits and 60 days of history.

### Production Build

```bash
npm run build
npm start
```

## Docker

### Build and run

```bash
docker build -t habitus .
docker run -p 3000:3000 -v habitus-data:/app/data habitus
```

Open [http://localhost:3000](http://localhost:3000).

The `-v habitus-data:/app/data` flag mounts a named volume so the SQLite database persists across container restarts. Without it, all data is lost when the container stops.

### Docker Compose

```yaml
services:
  habitus:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - habitus-data:/app/data
    restart: unless-stopped

volumes:
  habitus-data:
```

```bash
docker compose up -d
```

## Database

- **Engine**: SQLite (WAL mode, `busy_timeout=5000ms`)
- **Location**: `data/habitus.db` (project root) / `/app/data/habitus.db` (Docker)
- **Migrations**: inline DDL in `lib/db/index.ts` — runs automatically on startup
- **Seeding**: 5 habits + 60 days of entries on first run if the DB is empty

### Schema

| Table | Purpose |
|---|---|
| `habits` | id, name, description, color, icon, archived, created_at |
| `entries` | habit_id, date (YYYY-MM-DD), value (0 or 1) |
| `settings` | key/value pairs (e.g. `first_weekday`) |

## Design Notes

- **Color palette**: 20 colors matching the uhabits Android app (reds → oranges → yellows → greens → teals → blues → purples → pink → browns → greys). Default: index 8 (teal `#00897B`).
- **Score algorithm**: exponential smoothing over daily entries, displayed as 0–100. Ported from the original uhabits Android app.
- **Data flow**: async Server Component pages fetch data → pass as props to `"use client"` components → mutations call Server Actions → `router.refresh()` re-fetches.
- All pages use `export const dynamic = "force-dynamic"` because SQLite cannot be called during Next.js static pre-render.

## Credits

Habit scoring algorithm, color palette, and overall design are based on [Loop Habit Tracker](https://github.com/iSoron/uhabits) by [Álinson Santos Xavier](https://github.com/iSoron), licensed under [GPL-3.0](https://github.com/iSoron/uhabits/blob/develop/LICENSE.txt).
