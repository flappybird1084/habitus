"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, ChevronRight, Trash2, Download } from "lucide-react";
import { useHabitStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { useState } from "react";

const WEEKDAY_OPTIONS = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Saturday", value: 6 },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const firstWeekday = useHabitStore((s) => s.firstWeekday);
  const setFirstWeekday = useHabitStore((s) => s.setFirstWeekday);
  const habits = useHabitStore((s) => s.habits);
  const entries = useHabitStore((s) => s.entries);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExportCSV = () => {
    const rows = ["Habit,Date,Value"];
    habits.forEach((habit) => {
      const habitEntries = entries[habit.id] || [];
      habitEntries.forEach((entry) => {
        rows.push(`"${habit.name}",${entry.date},${entry.value}`);
      });
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "habits.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="min-h-full">
      <PageHeader title="Settings" />

      <div className="max-w-lg mx-auto px-4 py-4 space-y-6 animate-fade-in">
        {/* Appearance */}
        <section>
          <h2 className="section-title mb-3">Appearance</h2>
          <div className="card divide-y divide-[var(--border)]">
            <div className="p-4">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Theme</p>
              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={cn(
                      "flex flex-col items-center gap-2 py-3 px-2 rounded-xl border transition-all duration-150",
                      theme === value
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-[var(--border)] hover:bg-[var(--card-hover)]"
                    )}
                  >
                    <Icon
                      size={18}
                      className={cn(
                        theme === value
                          ? "text-emerald-500"
                          : "text-[var(--text-muted)]"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium",
                        theme === value
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-[var(--text-secondary)]"
                      )}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Calendar */}
        <section>
          <h2 className="section-title mb-3">Calendar</h2>
          <div className="card divide-y divide-[var(--border)]">
            <div className="p-4">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-3">
                First day of week
              </p>
              <div className="grid grid-cols-3 gap-2">
                {WEEKDAY_OPTIONS.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setFirstWeekday(value)}
                    className={cn(
                      "py-2 px-3 rounded-xl border text-sm font-medium transition-all duration-150",
                      firstWeekday === value
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--card-hover)]"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Data */}
        <section>
          <h2 className="section-title mb-3">Data</h2>
          <div className="card divide-y divide-[var(--border)]">
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center justify-between p-4 hover:bg-[var(--card-hover)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Download size={15} className="text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Export CSV</p>
                  <p className="text-xs text-[var(--text-muted)]">Download all habit data</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-[var(--text-muted)]" />
            </button>

            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-[var(--card-hover)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Trash2 size={15} className="text-red-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-red-400">Clear All Data</p>
                  <p className="text-xs text-[var(--text-muted)]">Remove all habits and history</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-[var(--text-muted)]" />
            </button>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="section-title mb-3">About</h2>
          <div className="card p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">App</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">Habitus</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">Habits tracked</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">{habits.filter(h => !h.isArchived).length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">Based on</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">Loop Habit Tracker</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] pt-1 border-t border-[var(--border)]">
              All data is stored locally in your browser. Nothing is sent to any server.
            </p>
          </div>
        </section>
      </div>

      {/* Clear confirm modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card p-6 w-full max-w-sm animate-bounce-in">
            <h3 className="font-bold text-[var(--text-primary)] text-lg">Clear all data?</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              This will permanently delete all habits and their history. This cannot be undone.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("habitus-storage");
                  window.location.reload();
                }}
                className="flex-1 px-4 py-2 rounded-xl font-semibold text-sm bg-red-500 hover:bg-red-600 text-white transition-all duration-150 active:scale-95"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
