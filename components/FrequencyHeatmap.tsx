"use client";

import { useMemo } from "react";
import { getColor } from "@/lib/models";
import type { Entry } from "@/lib/models";

interface FrequencyHeatmapProps {
  entries: Entry[];
  color: number;
  dark?: boolean;
  firstWeekday?: number;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function FrequencyHeatmap({
  entries,
  color,
  dark = false,
  firstWeekday = 1,
}: FrequencyHeatmapProps) {
  const hexColor = getColor(color, dark);

  const dayCounts = useMemo(() => {
    const counts = new Array(7).fill(0);
    const totals = new Array(7).fill(0);
    const today = new Date();

    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const dow = d.getDay();
      totals[dow]++;
      const entry = entries.find((e) => e.date === iso);
      if (entry?.value === "YES") counts[dow]++;
    }

    return counts.map((c, i) => ({
      day: DAY_NAMES[i],
      rate: totals[i] > 0 ? c / totals[i] : 0,
      count: c,
    }));
  }, [entries]);

  // Reorder by firstWeekday
  const ordered = useMemo(() => {
    const result = [];
    for (let i = 0; i < 7; i++) {
      result.push(dayCounts[(i + firstWeekday) % 7]);
    }
    return result;
  }, [dayCounts, firstWeekday]);

  const maxRate = Math.max(...ordered.map((d) => d.rate), 0.001);

  return (
    <div className="flex flex-col gap-2">
      {ordered.map(({ day, rate, count }, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-muted)] w-8 font-medium">{day}</span>
          <div className="flex-1 h-5 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(rate / maxRate) * 100}%`,
                backgroundColor: hexColor,
                opacity: 0.3 + rate * 0.7,
              }}
            />
          </div>
          <span className="text-xs font-semibold text-[var(--text-secondary)] w-8 text-right">
            {Math.round(rate * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}
