"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff } from "lucide-react";
import { ColorPicker } from "./ColorPicker";
import { useHabitStore } from "@/lib/store";
import type { Habit, Frequency } from "@/lib/models";
import { FREQUENCY_PRESETS, formatFrequency } from "@/lib/models";
import { cn } from "@/lib/utils";

interface HabitFormProps {
  existing?: Habit;
  mode: "create" | "edit";
}

const FREQ_OPTIONS = [
  { label: "Daily", value: FREQUENCY_PRESETS.DAILY },
  { label: "3× / week", value: FREQUENCY_PRESETS.THREE_TIMES_WEEK },
  { label: "2× / week", value: FREQUENCY_PRESETS.TWO_TIMES_WEEK },
  { label: "Weekly", value: FREQUENCY_PRESETS.WEEKLY },
];

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DEFAULT_CUSTOM_DAYS: boolean[] = [false, true, false, true, false, true, false]; // Mon/Wed/Fri

function freqMatch(a: Frequency, b: Frequency) {
  return a.numerator === b.numerator && a.denominator === b.denominator;
}

export function HabitForm({ existing, mode }: HabitFormProps) {
  const router = useRouter();
  const addHabit = useHabitStore((s) => s.addHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [question, setQuestion] = useState(existing?.question ?? "");
  const [type, setType] = useState<"YES_NO" | "NUMERICAL">(existing?.type ?? "YES_NO");
  const [color, setColor] = useState(existing?.color ?? 8);
  const [frequency, setFrequency] = useState<Frequency>(
    existing?.frequency ?? FREQUENCY_PRESETS.DAILY
  );
  const [targetValue, setTargetValue] = useState(existing?.targetValue ?? 1);
  const [targetType, setTargetType] = useState<"AT_LEAST" | "AT_MOST">(
    existing?.targetType ?? "AT_LEAST"
  );
  const [unit, setUnit] = useState(existing?.unit ?? "");
  const [hasReminder, setHasReminder] = useState(!!existing?.reminder);
  const [reminderHour, setReminderHour] = useState(existing?.reminder?.hour ?? 8);
  const [reminderMinute, setReminderMinute] = useState(existing?.reminder?.minute ?? 0);

  const [useCustomDays, setUseCustomDays] = useState(!!existing?.targetDays);
  const [customDays, setCustomDays] = useState<boolean[]>(
    existing?.targetDays ?? [...DEFAULT_CUSTOM_DAYS]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Habit name is required";
    if (type === "NUMERICAL" && targetValue <= 0)
      newErrors.targetValue = "Target must be greater than 0";
    if (useCustomDays && !customDays.some(Boolean))
      newErrors.customDays = "Select at least one day";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const habitData = {
      name: name.trim(),
      description: description.trim(),
      question: question.trim(),
      type,
      color,
      frequency: useCustomDays
        ? { numerator: customDays.filter(Boolean).length, denominator: 7 }
        : frequency,
      targetDays: useCustomDays ? customDays : undefined,
      targetValue,
      targetType,
      unit: unit.trim(),
      isArchived: existing?.isArchived ?? false,
      reminder: hasReminder
        ? { hour: reminderHour, minute: reminderMinute, days: new Array(7).fill(true) }
        : undefined,
    };

    if (mode === "create") {
      addHabit(habitData);
    } else if (existing) {
      updateHabit(existing.id, habitData);
    }

    router.push("/");
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-6 animate-fade-in">
      {/* Name */}
      <div>
        <label className="label">Habit name *</label>
        <input
          type="text"
          placeholder="e.g. Morning Exercise"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={cn("input", errors.name && "border-red-400 focus:ring-red-400")}
          autoFocus
        />
        {errors.name && (
          <p className="text-xs text-red-400 mt-1">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="label">Description</label>
        <input
          type="text"
          placeholder="Optional details about this habit"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input"
        />
      </div>

      {/* Question */}
      <div>
        <label className="label">Question</label>
        <input
          type="text"
          placeholder="e.g. Did you exercise today?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="input"
        />
      </div>

      {/* Habit type */}
      <div>
        <label className="label">Habit type</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "YES_NO", label: "Yes / No", desc: "Simple check-in" },
            { value: "NUMERICAL", label: "Numerical", desc: "Track a number" },
          ].map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => setType(value as "YES_NO" | "NUMERICAL")}
              className={cn(
                "card p-3 text-left transition-all duration-150",
                type === value
                  ? "ring-2 ring-emerald-500 bg-emerald-500/5"
                  : "hover:bg-[var(--card-hover)]"
              )}
            >
              <p className="font-semibold text-sm text-[var(--text-primary)]">{label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Numerical target */}
      {type === "NUMERICAL" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Target value *</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={targetValue}
                onChange={(e) => setTargetValue(parseFloat(e.target.value))}
                className={cn("input", errors.targetValue && "border-red-400")}
              />
              {errors.targetValue && (
                <p className="text-xs text-red-400 mt-1">{errors.targetValue}</p>
              )}
            </div>
            <div>
              <label className="label">Unit</label>
              <input
                type="text"
                placeholder="e.g. km, pages, glasses"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">Target type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "AT_LEAST", label: "At least" },
                { value: "AT_MOST", label: "At most" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setTargetType(value as "AT_LEAST" | "AT_MOST")}
                  className={cn(
                    "py-2 px-3 rounded-xl border text-sm font-medium transition-all duration-150",
                    targetType === value
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
      )}

      {/* Frequency */}
      <div>
        <label className="label">Frequency</label>
        <div className="grid grid-cols-3 gap-2">
          {FREQ_OPTIONS.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => { setFrequency(value); setUseCustomDays(false); }}
              className={cn(
                "py-2 px-3 rounded-xl border text-sm font-medium transition-all duration-150",
                !useCustomDays && freqMatch(frequency, value)
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--card-hover)]"
              )}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setUseCustomDays(true)}
            className={cn(
              "py-2 px-3 rounded-xl border text-sm font-medium transition-all duration-150",
              useCustomDays
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--card-hover)]"
            )}
          >
            Custom
          </button>
        </div>

        {useCustomDays && (
          <div className="mt-3">
            <div className="flex justify-between gap-1">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const next = [...customDays];
                    next[i] = !next[i];
                    setCustomDays(next);
                  }}
                  className={cn(
                    "w-9 h-9 rounded-full text-xs font-semibold transition-all duration-150 border",
                    customDays[i]
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--card-hover)]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {errors.customDays && (
              <p className="text-xs text-red-400 mt-1">{errors.customDays}</p>
            )}
          </div>
        )}
      </div>

      {/* Color */}
      <div>
        <label className="label">Color</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      {/* Reminder */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Reminder</label>
          <button
            onClick={() => setHasReminder(!hasReminder)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-all duration-150",
              hasReminder
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            {hasReminder ? <Bell size={12} /> : <BellOff size={12} />}
            {hasReminder ? "On" : "Off"}
          </button>
        </div>
        {hasReminder && (
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={`${String(reminderHour).padStart(2, "0")}:${String(reminderMinute).padStart(2, "0")}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(":").map(Number);
                setReminderHour(h);
                setReminderMinute(m);
              }}
              className="input flex-1"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 pb-4">
        <button onClick={() => router.back()} className="btn-secondary flex-1">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 btn-primary bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
        >
          {mode === "create" ? "Create Habit" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
