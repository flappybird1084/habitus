"use client";

import { useState, useMemo, useTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Archive, Search, CheckCircle2 } from "lucide-react";
import { toggleEntry } from "@/lib/actions/entries";
import { HabitCard } from "@/components/HabitCard";
import { PageHeader } from "@/components/PageHeader";
import type { HabitWithStats } from "@/lib/models";
import { todayISO } from "@/lib/models";

interface Props {
  habits: HabitWithStats[];
}

export default function HomePageClient({ habits }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [, startTransition] = useTransition();

  const [optimisticHabits, applyOptimisticToggle] = useOptimistic(
    habits,
    (state, habitId: string) => {
      const today = todayISO();
      return state.map((h) =>
        h.id !== habitId ? h : {
          ...h,
          todayEntry: {
            date: today,
            value: h.todayEntry?.value === "YES" ? "NO" as const : "YES" as const,
          },
        }
      );
    }
  );

  const activeHabits = optimisticHabits.filter((h) => !h.isArchived);
  const archivedCount = optimisticHabits.filter((h) => h.isArchived).length;

  const filtered = useMemo(
    () => activeHabits.filter((h) => h.name.toLowerCase().includes(search.toLowerCase())),
    [activeHabits, search]
  );

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const completedToday = activeHabits.filter((h) => h.todayEntry?.value === "YES").length;
  const totalHabits = activeHabits.length;
  const allDoneToday = completedToday === totalHabits && totalHabits > 0;

  const handleToggle = (habitId: string) => {
    startTransition(async () => {
      applyOptimisticToggle(habitId);
      await toggleEntry(habitId);
      router.refresh();
    });
  };

  return (
    <div className="min-h-full">
      <PageHeader
        title="My Habits"
        subtitle={todayDate}
        actions={
          <Link
            href="/habits/new"
            className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20 md:hidden"
          >
            <Plus size={16} className="text-white" strokeWidth={2.5} />
          </Link>
        }
      />

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Daily progress banner */}
        {totalHabits > 0 && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {allDoneToday
                    ? "All done for today! 🎉"
                    : `${completedToday} of ${totalHabits} completed`}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Keep the momentum going</p>
              </div>
              {allDoneToday && <CheckCircle2 className="text-emerald-500" size={28} />}
            </div>
            <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${(completedToday / totalHabits) * 100}%` }}
              />
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2 text-right font-medium">
              {Math.round((completedToday / totalHabits) * 100)}%
            </p>
          </div>
        )}

        {/* Search */}
        {totalHabits > 3 && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search habits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
        )}

        {/* Habit list */}
        {filtered.length > 0 ? (
          <div className="space-y-2 animate-fade-in">
            {filtered.map((habit) => (
              <HabitCard key={habit.id} habit={habit} onToggle={() => handleToggle(habit.id)} />
            ))}
          </div>
        ) : totalHabits === 0 ? (
          <EmptyState />
        ) : (
          <div className="card p-8 text-center">
            <p className="text-[var(--text-muted)] text-sm">No habits match your search.</p>
          </div>
        )}

        {/* Archived habits toggle */}
        {archivedCount > 0 && (
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors w-full justify-center py-2"
          >
            <Archive size={14} />
            {showArchived ? "Hide" : "Show"} {archivedCount} archived habit
            {archivedCount !== 1 ? "s" : ""}
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-10 flex flex-col items-center gap-4 animate-slide-up">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
        <CheckCircle2 size={32} className="text-emerald-500" />
      </div>
      <div className="text-center">
        <h3 className="font-bold text-[var(--text-primary)] text-lg">Start tracking habits</h3>
        <p className="text-[var(--text-muted)] text-sm mt-1 max-w-xs">
          Build positive routines and break bad ones. Add your first habit to get started.
        </p>
      </div>
      <Link
        href="/habits/new"
        className="btn-primary bg-emerald-500 hover:bg-emerald-600 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
      >
        <Plus size={16} strokeWidth={2.5} />
        Create Your First Habit
      </Link>
    </div>
  );
}
