"use client";

import { useMemo } from "react";
import { getColor, getDayOfWeek } from "@/lib/models";
import type { Entry } from "@/lib/models";
import { cn } from "@/lib/utils";

interface HistoryGridProps {
  entries: Entry[];
  color: number;
  weeks?: number;
  dark?: boolean;
  onCellClick?: (date: string) => void;
  firstWeekday?: number; // 0=Sun, 1=Mon
  targetDays?: boolean[];
}

export function HistoryGrid({
  entries,
  color,
  weeks = 18,
  dark = false,
  onCellClick,
  firstWeekday = 1,
  targetDays,
}: HistoryGridProps) {
  const hexColor = getColor(color, dark);

  const grid = useMemo(() => {
    const today = new Date();
    const cells: Array<{ date: string; value: Entry["value"] | null; isToday: boolean; isFuture: boolean; isOffDay: boolean }> = [];

    // Find the start of the grid (go back 'weeks' weeks from today's week start)
    const dayOfWeek = (today.getDay() - firstWeekday + 7) % 7;
    const gridEnd = new Date(today);
    const gridStart = new Date(today);
    gridStart.setDate(gridStart.getDate() - dayOfWeek - (weeks - 1) * 7);

    const entryMap = new Map(entries.map((e) => [e.date, e.value]));
    const todayISO = today.toISOString().split("T")[0];

    let current = new Date(gridStart);
    while (current <= gridEnd) {
      const dateISO = current.toISOString().split("T")[0];
      const isFuture = dateISO > todayISO;
      const val = entryMap.get(dateISO) ?? null;
      const isOffDay = !!(targetDays && !targetDays[getDayOfWeek(dateISO)] && val !== "YES");
      cells.push({
        date: dateISO,
        value: val,
        isToday: dateISO === todayISO,
        isFuture,
        isOffDay,
      });
      current.setDate(current.getDate() + 1);
    }

    // Pad to full grid
    while (cells.length % 7 !== 0) {
      cells.push({ date: "", value: null, isToday: false, isFuture: true, isOffDay: false });
    }

    return cells;
  }, [entries, weeks, firstWeekday, targetDays]);

  const dayLabels = useMemo(() => {
    const days = ["S", "M", "T", "W", "T", "F", "S"];
    const result = [];
    for (let i = 0; i < 7; i++) {
      result.push(days[(i + firstWeekday) % 7]);
    }
    return result;
  }, [firstWeekday]);

  const getCellColor = (cell: typeof grid[0]) => {
    if (!cell.date || cell.isFuture) return "transparent";
    if (cell.value === "YES") return hexColor;
    if (cell.value === "SKIP") return hexColor + "30";
    if (cell.isOffDay) return hexColor + "15";
    return undefined;
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        {/* Day labels */}
        <div className="flex mb-1 ml-0">
          <div className="w-6" /> {/* spacer */}
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="w-6 text-center text-[9px] font-medium text-[var(--text-muted)]"
            >
              {i % 2 === 0 ? label : ""}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${Math.ceil(grid.length / 7)}, 1.5rem)`,
            gridTemplateRows: "repeat(7, 1.5rem)",
            gridAutoFlow: "column",
            gap: "2px",
          }}
        >
          {grid.map((cell, i) => (
            <button
              key={i}
              onClick={() => cell.date && !cell.isFuture && onCellClick?.(cell.date)}
              disabled={!cell.date || cell.isFuture}
              title={cell.date || undefined}
              className={cn(
                "w-6 h-6 rounded-md transition-all duration-150",
                cell.date && !cell.isFuture && "hover:opacity-75 active:scale-90",
                cell.isToday && "ring-2 ring-offset-1 ring-[var(--border)]",
              )}
              style={{
                backgroundColor: getCellColor(cell) ?? (cell.date && !cell.isFuture
                  ? dark ? "#2a2a2a" : "#e5e7eb"
                  : "transparent"),
              }}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3">
          <span className="text-[10px] text-[var(--text-muted)]">Less</span>
          {[0, 0.3, 0.6, 1].map((opacity, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: opacity === 0
                  ? dark ? "#2a2a2a" : "#e5e7eb"
                  : hexColor + (opacity === 1 ? "" : Math.round(opacity * 255).toString(16).padStart(2, "0")),
              }}
            />
          ))}
          <span className="text-[10px] text-[var(--text-muted)]">More</span>
        </div>
      </div>
    </div>
  );
}
