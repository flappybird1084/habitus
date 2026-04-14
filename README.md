# Habitus

A web-based habit tracking app built with Next.js 14, inspired by [Loop Habit Tracker (uhabits)](https://github.com/iSoron/uhabits) by Álinson Santos Xavier.

## Features

- Track daily YES/NO or numerical habits
- Flexible frequency scheduling (daily, N×/week, specific days)
- Score rings using exponential smoothing (ported from uhabits)
- Streaks, completion rates, and 18-week history grid
- Bar charts and weekday frequency heatmaps
- Global stats with radar chart
- Light / dark / system theme
- CSV export
- All data stored locally — no account needed

## Stack

- [Next.js 14](https://nextjs.org/) App Router
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/) (localStorage persistence)
- [Recharts](https://recharts.org/)
- [next-themes](https://github.com/pacocoursey/next-themes)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Credits

Habit scoring algorithm, color palette, and overall design are based on [Loop Habit Tracker](https://github.com/iSoron/uhabits) by [Álinson Santos Xavier](https://github.com/iSoron), licensed under [GPL-3.0](https://github.com/iSoron/uhabits/blob/develop/LICENSE.txt).
