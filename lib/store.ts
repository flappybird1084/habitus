"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Habit,
  Entry,
  HabitWithStats,
  todayISO,
  computeScore,
  computeStreaks,
  getPast30Days,
} from "./models";

interface HabitStore {
  habits: Habit[];
  entries: Record<string, Entry[]>; // habitId -> entries
  theme: "light" | "dark" | "system";
  firstWeekday: number; // 0=Sun, 1=Mon

  // Actions
  addHabit: (habit: Omit<Habit, "id" | "createdAt" | "uuid" | "position">) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  archiveHabit: (id: string) => void;
  reorderHabits: (ids: string[]) => void;
  toggleEntry: (habitId: string, date?: string) => void;
  setEntry: (habitId: string, date: string, value: Entry["value"], notes?: string) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setFirstWeekday: (day: number) => void;

  // Computed
  getHabitWithStats: (id: string) => HabitWithStats | null;
  getAllHabitsWithStats: () => HabitWithStats[];
  getEntries: (habitId: string) => Entry[];
  getEntry: (habitId: string, date: string) => Entry | null;
}

const SAMPLE_HABITS: Habit[] = [
  {
    id: "1",
    name: "Morning Exercise",
    description: "30 minutes of exercise every morning",
    question: "Did you exercise this morning?",
    type: "YES_NO",
    color: 7,
    frequency: { numerator: 1, denominator: 1 },
    targetValue: 0,
    targetType: "AT_LEAST",
    unit: "",
    isArchived: false,
    position: 0,
    createdAt: "2024-01-01",
    uuid: "uuid-1",
  },
  {
    id: "2",
    name: "Read",
    description: "Read at least 20 pages",
    question: "Did you read today?",
    type: "YES_NO",
    color: 11,
    frequency: { numerator: 1, denominator: 1 },
    targetValue: 0,
    targetType: "AT_LEAST",
    unit: "",
    isArchived: false,
    position: 1,
    createdAt: "2024-01-01",
    uuid: "uuid-2",
  },
  {
    id: "3",
    name: "Meditation",
    description: "10 minutes of mindfulness",
    question: "Did you meditate today?",
    type: "YES_NO",
    color: 8,
    frequency: { numerator: 1, denominator: 1 },
    targetValue: 0,
    targetType: "AT_LEAST",
    unit: "",
    isArchived: false,
    position: 2,
    createdAt: "2024-01-01",
    uuid: "uuid-3",
  },
  {
    id: "4",
    name: "Water Intake",
    description: "Drink 8 glasses of water",
    question: "How many glasses did you drink?",
    type: "NUMERICAL",
    color: 9,
    frequency: { numerator: 1, denominator: 1 },
    targetValue: 8,
    targetType: "AT_LEAST",
    unit: "glasses",
    isArchived: false,
    position: 3,
    createdAt: "2024-01-01",
    uuid: "uuid-4",
  },
  {
    id: "5",
    name: "No Social Media",
    description: "Avoid social media during work hours",
    question: "Did you avoid social media?",
    type: "YES_NO",
    color: 0,
    frequency: { numerator: 5, denominator: 7 },
    targetValue: 0,
    targetType: "AT_LEAST",
    unit: "",
    isArchived: false,
    position: 4,
    createdAt: "2024-01-01",
    uuid: "uuid-5",
  },
];

// Generate sample entries for the last 60 days
function generateSampleEntries(): Record<string, Entry[]> {
  const entries: Record<string, Entry[]> = {};
  const today = new Date();

  SAMPLE_HABITS.forEach((habit) => {
    entries[habit.id] = [];
    for (let i = 1; i <= 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const date = d.toISOString().split("T")[0];
      const rand = Math.random();
      let value: Entry["value"] = "NO";

      if (habit.id === "1" && rand > 0.25) value = "YES";
      else if (habit.id === "2" && rand > 0.35) value = "YES";
      else if (habit.id === "3" && rand > 0.3) value = "YES";
      else if (habit.id === "4" && rand > 0.2) value = "YES";
      else if (habit.id === "5" && rand > 0.4) value = "YES";

      entries[habit.id].push({ date, value });
    }
  });

  return entries;
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: SAMPLE_HABITS,
      entries: generateSampleEntries(),
      theme: "system",
      firstWeekday: 1, // Monday

      addHabit: (habitData) => {
        const id = Date.now().toString();
        const habit: Habit = {
          ...habitData,
          id,
          createdAt: todayISO(),
          uuid: id,
          position: get().habits.length,
        };
        set((state) => ({ habits: [...state.habits, habit] }));
      },

      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
        }));
      },

      deleteHabit: (id) => {
        set((state) => {
          const { [id]: _, ...restEntries } = state.entries;
          return {
            habits: state.habits.filter((h) => h.id !== id),
            entries: restEntries,
          };
        });
      },

      archiveHabit: (id) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, isArchived: !h.isArchived } : h
          ),
        }));
      },

      reorderHabits: (ids) => {
        set((state) => ({
          habits: ids
            .map((id, position) => {
              const habit = state.habits.find((h) => h.id === id);
              return habit ? { ...habit, position } : null;
            })
            .filter(Boolean) as Habit[],
        }));
      },

      toggleEntry: (habitId, date = todayISO()) => {
        const state = get();
        const existing = state.entries[habitId]?.find((e) => e.date === date);
        const newValue: Entry["value"] = existing?.value === "YES" ? "NO" : "YES";
        get().setEntry(habitId, date, newValue);
      },

      setEntry: (habitId, date, value, notes = "") => {
        set((state) => {
          const habitEntries = state.entries[habitId] || [];
          const idx = habitEntries.findIndex((e) => e.date === date);
          let newEntries: Entry[];
          if (idx >= 0) {
            newEntries = [...habitEntries];
            newEntries[idx] = { date, value, notes };
          } else {
            newEntries = [...habitEntries, { date, value, notes }];
          }
          return {
            entries: { ...state.entries, [habitId]: newEntries },
          };
        });
      },

      setTheme: (theme) => set({ theme }),
      setFirstWeekday: (day) => set({ firstWeekday: day }),

      getEntries: (habitId) => get().entries[habitId] || [],

      getEntry: (habitId, date) => {
        return get().entries[habitId]?.find((e) => e.date === date) || null;
      },

      getHabitWithStats: (id) => {
        const state = get();
        const habit = state.habits.find((h) => h.id === id);
        if (!habit) return null;

        const entries = state.entries[id] || [];
        const today = todayISO();
        const todayEntry = entries.find((e) => e.date === today) || null;
        const score = computeScore(entries, habit.frequency, habit.targetDays);
        const { current, longest } = computeStreaks(entries, habit.frequency, habit.targetDays);
        const past30 = getPast30Days();
        const completed30 = past30.filter((d) =>
          entries.some((e) => e.date === d && e.value === "YES")
        ).length;

        return {
          ...habit,
          todayEntry,
          currentStreak: current,
          longestStreak: longest,
          score,
          completionRate: completed30 / 30,
          totalCount: entries.filter((e) => e.value === "YES").length,
        };
      },

      getAllHabitsWithStats: () => {
        const state = get();
        return state.habits
          .filter((h) => !h.isArchived)
          .sort((a, b) => a.position - b.position)
          .map((h) => state.getHabitWithStats(h.id)!)
          .filter(Boolean);
      },
    }),
    {
      name: "habitus-storage",
      version: 1,
    }
  )
);
