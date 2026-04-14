"use client";

import { useTheme } from "next-themes";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { getColor } from "@/lib/models";
import type { HabitWithStats } from "@/lib/models";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { ScoreRing } from "@/components/ScoreRing";
import { Flame, TrendingUp, Target, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatPercent } from "@/lib/utils";

interface Props {
  habits: HabitWithStats[];
}

export function StatsClient({ habits }: Props) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  if (habits.length === 0) {
    return (
      <div className="min-h-full">
        <PageHeader title="Statistics" />
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
              <BarChart2Icon className="text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-secondary)] font-medium">No habits yet</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Add habits to see your statistics</p>
            <Link
              href="/habits/new"
              className="inline-block mt-4 btn-primary bg-emerald-500 hover:bg-emerald-600"
            >
              Add a habit
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalCompleted = habits.reduce((sum, h) => sum + h.totalCount, 0);
  const avgScore = habits.reduce((sum, h) => sum + h.score, 0) / habits.length;
  const maxStreak = Math.max(...habits.map((h) => h.longestStreak), 0);
  const avgCompletion = habits.reduce((sum, h) => sum + h.completionRate, 0) / habits.length;
  const completedToday = habits.filter((h) => h.todayEntry?.value === "YES").length;

  const radarData = habits.map((h) => ({
    habit: h.name.length > 10 ? h.name.substring(0, 10) + "…" : h.name,
    score: Math.round(h.score * 100),
    completion: Math.round(h.completionRate * 100),
  }));

  const byScore = [...habits].sort((a, b) => b.score - a.score);
  const byStreak = [...habits].sort((a, b) => b.currentStreak - a.currentStreak);

  return (
    <div className="min-h-full">
      <PageHeader title="Statistics" subtitle="Your overall performance" />

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4 animate-fade-in">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Today"
            value={`${completedToday}/${habits.length}`}
            subtitle="habits"
            icon={<CheckCircle2 size={14} />}
          />
          <StatCard
            label="Avg. Score"
            value={Math.round(avgScore * 100)}
            icon={<TrendingUp size={14} />}
          />
          <StatCard
            label="Total Done"
            value={totalCompleted}
            subtitle="times"
            icon={<Target size={14} />}
          />
          <StatCard
            label="Best Streak"
            value={maxStreak}
            subtitle="days"
            icon={<Flame size={14} />}
          />
        </div>

        <div className="card p-4">
          <h3 className="section-title mb-3">Average Completion Rate (30 days)</h3>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-[var(--text-primary)]">
              {formatPercent(avgCompletion)}
            </div>
            <div className="flex-1 h-3 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: formatPercent(avgCompletion) }}
              />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="section-title mb-3">Habit Scores</h3>
          <div className="space-y-3">
            {byScore.map((habit, i) => {
              const hexColor = getColor(habit.color, dark);
              return (
                <Link
                  key={habit.id}
                  href={`/habits/${habit.id}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <span className="text-xs font-bold text-[var(--text-muted)] w-4">{i + 1}</span>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: hexColor }} />
                  <span className="text-sm font-medium text-[var(--text-primary)] flex-1 truncate">
                    {habit.name}
                  </span>
                  <ScoreRing score={habit.score} color={habit.color} dark={dark} size={40} strokeWidth={3} showLabel={false} />
                  <span className="text-sm font-bold w-10 text-right" style={{ color: hexColor }}>
                    {Math.round(habit.score * 100)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="section-title mb-3">Current Streaks</h3>
          <div className="space-y-2">
            {byStreak.map((habit) => {
              const hexColor = getColor(habit.color, dark);
              return (
                <Link
                  key={habit.id}
                  href={`/habits/${habit.id}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: hexColor }} />
                  <span className="text-sm font-medium text-[var(--text-primary)] flex-1 truncate">
                    {habit.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <Flame size={14} style={{ color: hexColor }} />
                    <span className="text-sm font-bold" style={{ color: hexColor }}>
                      {habit.currentStreak}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">days</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {habits.length >= 3 && (
          <div className="card p-4">
            <h3 className="section-title mb-3">Score Overview</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="habit" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                <Radar name="Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function BarChart2Icon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}
