"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Edit3, Trash2, Archive, Flame, Award, TrendingUp, Calendar, BarChart2, Activity,
} from "lucide-react";
import { toggleEntry } from "@/lib/actions/entries";
import { deleteHabit, archiveHabit } from "@/lib/actions/habits";
import { getColor, formatFrequency, getPastDays } from "@/lib/models";
import type { HabitWithStats, Entry } from "@/lib/models";
import { PageHeader } from "@/components/PageHeader";
import { CheckmarkButton } from "@/components/CheckmarkButton";
import { ScoreRing } from "@/components/ScoreRing";
import { HistoryGrid } from "@/components/HistoryGrid";
import { HabitBarChart } from "@/components/HabitBarChart";
import { FrequencyHeatmap } from "@/components/FrequencyHeatmap";
import { StatCard } from "@/components/StatCard";
import { cn, formatDate, formatShortDate, formatPercent } from "@/lib/utils";

type ChartView = "week" | "month" | "year";

interface Props {
  habit: HabitWithStats;
  entries: Entry[];
  firstWeekday: number;
}

export function HabitDetailClient({ habit, entries, firstWeekday }: Props) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const [chartView, setChartView] = useState<ChartView>("month");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hexColor = getColor(habit.color, dark);
  const isCompleted = habit.todayEntry?.value === "YES";

  const last30 = getPastDays(30);
  const completedDays = last30.filter((d) =>
    entries.some((e) => e.date === d && e.value === "YES")
  ).length;

  const handleToggle = (date?: string) => {
    startTransition(async () => {
      await toggleEntry(habit.id, date);
      router.refresh();
    });
  };

  const handleArchive = () => {
    startTransition(async () => {
      await archiveHabit(habit.id);
      router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteHabit(habit.id);
      router.push("/");
    });
  };

  return (
    <div className="min-h-full">
      <PageHeader
        title={habit.name}
        backHref="/"
        actions={
          <div className="flex items-center gap-1">
            <button
              onClick={handleArchive}
              disabled={isPending}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[var(--card-hover)] transition-colors"
              title={habit.isArchived ? "Unarchive" : "Archive"}
            >
              <Archive size={16} className="text-[var(--text-muted)]" />
            </button>
            <Link
              href={`/habits/${habit.id}/edit`}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[var(--card-hover)] transition-colors"
            >
              <Edit3 size={16} className="text-[var(--text-muted)]" />
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={16} className="text-red-400" />
            </button>
          </div>
        }
      />

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4 animate-fade-in">
        {/* Hero card */}
        <div className="card p-5" style={{ borderTop: `3px solid ${hexColor}` }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{habit.name}</h2>
              {habit.description && (
                <p className="text-sm text-[var(--text-muted)] mt-1">{habit.description}</p>
              )}
              {habit.question && (
                <p className="text-sm text-[var(--text-secondary)] mt-2 italic">
                  &ldquo;{habit.question}&rdquo;
                </p>
              )}
              <div className="flex items-center gap-3 mt-3">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: hexColor + "20", color: hexColor }}
                >
                  {formatFrequency(habit.frequency, habit.targetDays)}
                </span>
                {habit.type === "NUMERICAL" && (
                  <span className="text-xs text-[var(--text-muted)]">
                    Goal: {habit.targetValue} {habit.unit}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ScoreRing score={habit.score} color={habit.color} dark={dark} size={72} strokeWidth={5} />
              <CheckmarkButton
                completed={isCompleted}
                color={habit.color}
                dark={dark}
                size="sm"
                onClick={() => handleToggle()}
              />
              <span className="text-[10px] text-[var(--text-muted)]">Today</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Current Streak" value={habit.currentStreak} subtitle="days" color={hexColor} icon={<Flame size={14} />} />
          <StatCard label="Best Streak" value={habit.longestStreak} subtitle="days" icon={<Award size={14} />} />
          <StatCard label="Total" value={habit.totalCount} subtitle="times" icon={<Activity size={14} />} />
        </div>

        {/* 30-day overview */}
        <div className="card p-4">
          <h3 className="section-title mb-3">30-Day Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-bold" style={{ color: hexColor }}>{completedDays}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">completed days</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{formatPercent(habit.completionRate)}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">completion rate</p>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: formatPercent(habit.completionRate), backgroundColor: hexColor }}
            />
          </div>
        </div>

        {/* History grid */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title flex items-center gap-2"><Calendar size={12} />History</h3>
          </div>
          <HistoryGrid
            entries={entries}
            color={habit.color}
            dark={dark}
            firstWeekday={firstWeekday}
            targetDays={habit.targetDays}
            onCellClick={(date) => handleToggle(date)}
          />
        </div>

        {/* Bar chart */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title flex items-center gap-2"><BarChart2 size={12} />Progress</h3>
            <div className="flex gap-1 bg-[var(--border)] rounded-lg p-0.5">
              {(["week", "month", "year"] as ChartView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setChartView(v)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 capitalize",
                    chartView === v
                      ? "bg-[var(--card)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <HabitBarChart entries={entries} color={habit.color} dark={dark} view={chartView} />
        </div>

        {/* Frequency heatmap */}
        <div className="card p-4">
          <h3 className="section-title mb-3 flex items-center gap-2"><TrendingUp size={12} />Best Days</h3>
          <FrequencyHeatmap entries={entries} color={habit.color} dark={dark} firstWeekday={firstWeekday} />
        </div>

        {/* Score */}
        <div className="card p-4">
          <h3 className="section-title mb-2">Score</h3>
          <div className="flex items-center gap-4">
            <ScoreRing score={habit.score} color={habit.color} dark={dark} size={80} strokeWidth={6} />
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                Your habit strength score is based on consistency over time.
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Scores improve gradually when you check in regularly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card p-6 w-full max-w-sm animate-bounce-in">
            <h3 className="font-bold text-[var(--text-primary)] text-lg">Delete habit?</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              This will permanently delete &ldquo;{habit.name}&rdquo; and all its history. This action cannot be undone.
            </p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 px-4 py-2 rounded-xl font-semibold text-sm bg-red-500 hover:bg-red-600 text-white transition-all duration-150 active:scale-95 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
