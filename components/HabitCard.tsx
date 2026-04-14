"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Flame, TrendingUp } from "lucide-react";
import { CheckmarkButton } from "./CheckmarkButton";
import { ScoreRing } from "./ScoreRing";
import { getColor, formatFrequency } from "@/lib/models";
import type { HabitWithStats } from "@/lib/models";
import { useHabitStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface HabitCardProps {
  habit: HabitWithStats;
}

export function HabitCard({ habit }: HabitCardProps) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const toggleEntry = useHabitStore((s) => s.toggleEntry);
  const hexColor = getColor(habit.color, dark);
  const isCompleted = habit.todayEntry?.value === "YES";
  const completionPercent = Math.round(habit.completionRate * 100);

  return (
    <div
      className={cn(
        "card flex items-center gap-4 px-4 py-3.5 transition-all duration-150",
        "hover:shadow-md group"
      )}
      style={{ borderLeft: `3px solid ${hexColor}` }}
    >
      {/* Checkmark */}
      <CheckmarkButton
        completed={isCompleted}
        color={habit.color}
        dark={dark}
        onClick={() => toggleEntry(habit.id)}
      />

      {/* Info */}
      <Link href={`/habits/${habit.id}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[var(--text-primary)] text-sm truncate">
            {habit.name}
          </span>
          {habit.currentStreak > 1 && (
            <span
              className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: hexColor + "20", color: hexColor }}
            >
              <Flame size={10} strokeWidth={2.5} />
              {habit.currentStreak}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[var(--text-muted)]">
            {formatFrequency(habit.frequency, habit.targetDays)}
          </span>
          {habit.description && (
            <>
              <span className="text-[var(--border)]">·</span>
              <span className="text-xs text-[var(--text-muted)] truncate">{habit.description}</span>
            </>
          )}
        </div>

        {/* Mini progress bar */}
        <div className="mt-2 h-1 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${completionPercent}%`, backgroundColor: hexColor }}
          />
        </div>
      </Link>

      {/* Score ring */}
      <Link href={`/habits/${habit.id}`} className="shrink-0">
        <ScoreRing score={habit.score} color={habit.color} dark={dark} size={52} strokeWidth={4} />
      </Link>
    </div>
  );
}
