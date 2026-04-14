"use client";

import { useState, useMemo, useTransition, useOptimistic, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Archive, Search, CheckCircle2, ArrowUpDown } from "lucide-react";
import { toggleEntry } from "@/lib/actions/entries";
import { HabitCard } from "@/components/HabitCard";
import { PageHeader } from "@/components/PageHeader";
import type { HabitWithStats } from "@/lib/models";
import { todayISO } from "@/lib/models";

type SortKey = "name-asc" | "name-desc" | "last-filled-desc" | "last-filled-asc";

const SORT_LABELS: Record<SortKey, string> = {
  "name-asc": "Name A→Z",
  "name-desc": "Name Z→A",
  "last-filled-desc": "Recently filled",
  "last-filled-asc": "Least recently filled",
};

interface Props {
  habits: HabitWithStats[];
}

export default function HomePageClient({ habits }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("last-filled-desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSortMenu) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSortMenu]);

  // Refresh data at midnight so today's entries reset
  useEffect(() => {
    const scheduleMidnightRefresh = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const msUntilMidnight = midnight.getTime() - now.getTime();

      const id = setTimeout(() => {
        router.refresh();
        scheduleMidnightRefresh(); // reschedule for next midnight
      }, msUntilMidnight);

      return id;
    };

    const id = scheduleMidnightRefresh();
    return () => clearTimeout(id);
  }, [router]);
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    // Filter + rank by match tier (1 = name, 2 = description, 3 = question)
    const ranked = activeHabits
      .map((h) => {
        if (!q) return { habit: h, tier: 0 };
        if (h.name.toLowerCase().includes(q)) return { habit: h, tier: 1 };
        if (h.description.toLowerCase().includes(q)) return { habit: h, tier: 2 };
        if (h.question.toLowerCase().includes(q)) return { habit: h, tier: 3 };
        return null;
      })
      .filter((x): x is { habit: HabitWithStats; tier: number } => x !== null);

    // Sort: when searching, tier comes first; otherwise apply chosen sort
    ranked.sort((a, b) => {
      if (q && a.tier !== b.tier) return a.tier - b.tier;

      const ha = a.habit, hb = b.habit;

      switch (sortKey) {
        case "name-asc":  return ha.name.localeCompare(hb.name);
        case "name-desc": return hb.name.localeCompare(ha.name);

        case "last-filled-desc": {
          // Newest date first; null → end; tie → name A→Z
          const da = ha.lastFilledDate, db = hb.lastFilledDate;
          if (da === db) return ha.name.localeCompare(hb.name);
          if (!da) return 1;
          if (!db) return -1;
          return da > db ? -1 : 1;
        }

        case "last-filled-asc": {
          // Oldest date first; null → end; tie → name Z→A
          const da = ha.lastFilledDate, db = hb.lastFilledDate;
          if (da === db) return hb.name.localeCompare(ha.name);
          if (!da) return 1;
          if (!db) return -1;
          return da < db ? -1 : 1;
        }

        default: return 0;
      }
    });

    return ranked.map((x) => x.habit);
  }, [activeHabits, search, sortKey]);

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

        {/* Search + Sort */}
        {totalHabits > 0 && (
          <div className="flex gap-2 items-center">
            {totalHabits > 3 && (
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search name, description, or question…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-9"
                />
              </div>
            )}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                className="flex items-center gap-1.5 px-3 h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors whitespace-nowrap"
              >
                <ArrowUpDown size={13} />
                {SORT_LABELS[sortKey]}
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[180px] rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg overflow-hidden">
                  {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setSortKey(key); setShowSortMenu(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[var(--border)] ${
                        sortKey === key ? "text-[var(--text-primary)] font-semibold" : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
