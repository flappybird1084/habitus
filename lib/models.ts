export type HabitType = "YES_NO" | "NUMERICAL";
export type NumericalHabitType = "AT_LEAST" | "AT_MOST";

export interface Frequency {
  numerator: number;   // times per denominator days
  denominator: number;
}

export const FREQUENCY_PRESETS: Record<string, Frequency> = {
  DAILY: { numerator: 1, denominator: 1 },
  THREE_TIMES_WEEK: { numerator: 3, denominator: 7 },
  TWO_TIMES_WEEK: { numerator: 2, denominator: 7 },
  WEEKLY: { numerator: 1, denominator: 7 },
};

export interface Reminder {
  hour: number;
  minute: number;
  days: boolean[]; // index 0=Sun, 1=Mon, ..., 6=Sat
}

export interface Entry {
  date: string; // ISO date string "YYYY-MM-DD"
  value: EntryValue;
  notes?: string;
}

export type EntryValue = "YES" | "NO" | "SKIP" | "UNKNOWN";

export interface Habit {
  id: string;
  name: string;
  description: string;
  question: string;
  type: HabitType;
  color: number; // 0-19 palette index
  frequency: Frequency;
  targetDays?: boolean[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]; undefined = all days
  targetValue: number;
  targetType: NumericalHabitType;
  unit: string;
  reminder?: Reminder;
  isArchived: boolean;
  position: number;
  createdAt: string; // ISO date
  uuid: string;
}

export interface HabitWithStats extends Habit {
  todayEntry: Entry | null;
  currentStreak: number;
  longestStreak: number;
  score: number; // 0-1
  completionRate: number; // 0-1 for last 30 days
  totalCount: number;
  lastFilledDate: string | null; // ISO date of most recent YES entry
  daysUntilStreakLoss: number | null;
  streakAtRiskToday: boolean;
}

// 20-color palette matching uhabits
export const PALETTE_COLORS: string[] = [
  "#D32F2F", // 0 red
  "#E64A19", // 1 deep orange
  "#F57C00", // 2 orange
  "#FF8F00", // 3 amber
  "#F9A825", // 4 yellow
  "#AFB42B", // 5 lime
  "#7CB342", // 6 light green
  "#388E3C", // 7 green
  "#00897B", // 8 teal (default)
  "#00ACC1", // 9 cyan
  "#039BE5", // 10 light blue
  "#1976D2", // 11 blue
  "#303F9F", // 12 indigo
  "#5E35B1", // 13 deep purple
  "#8E24AA", // 14 purple
  "#D81B60", // 15 pink
  "#5D4037", // 16 brown
  "#424242", // 17 dark grey
  "#757575", // 18 grey
  "#9E9E9E", // 19 light grey
];

export const PALETTE_COLORS_DARK: string[] = [
  "#EF9A9A",
  "#FFAB91",
  "#FFCC80",
  "#FFE082",
  "#FFF176",
  "#E6EE9C",
  "#C5E1A5",
  "#A5D6A7",
  "#80CBC4",
  "#80DEEA",
  "#81D4FA",
  "#90CAF9",
  "#9FA8DA",
  "#B39DDB",
  "#CE93D8",
  "#F48FB1",
  "#BCAAA4",
  "#EEEEEE",
  "#BDBDBD",
  "#9E9E9E",
];

export function getColor(paletteIndex: number, dark = false): string {
  const colors = dark ? PALETTE_COLORS_DARK : PALETTE_COLORS;
  return colors[Math.max(0, Math.min(19, paletteIndex))];
}

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getDayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function formatFrequency(freq: Frequency, targetDays?: boolean[]): string {
  if (targetDays) {
    const selected = targetDays.reduce((acc, v, i) => v ? [...acc, DAY_ABBR[i]] : acc, [] as string[]);
    if (selected.length === 7) return "Daily";
    if (selected.length === 0) return "Custom";
    return selected.join(", ");
  }
  if (freq.numerator === 1 && freq.denominator === 1) return "Daily";
  if (freq.numerator === 3 && freq.denominator === 7) return "3× per week";
  if (freq.numerator === 2 && freq.denominator === 7) return "2× per week";
  if (freq.numerator === 1 && freq.denominator === 7) return "Weekly";
  return `${freq.numerator}× per ${freq.denominator} days`;
}

function localISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return localISO(new Date());
}

export function dateToISO(date: Date): string {
  return localISO(date);
}

export function getPast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(dateToISO(d));
  }
  return days;
}

export function getPastDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(dateToISO(d));
  }
  return days;
}

export function computeScore(entries: Entry[], frequency: Frequency, targetDays?: boolean[]): number {
  // Exponential smoothing score (mirrors uhabits algorithm)
  const multiplier = Math.pow(0.5, frequency.numerator / (14 * frequency.denominator));
  let score = 0;
  const days = getPastDays(100);
  for (const day of days) {
    if (targetDays && !targetDays[getDayOfWeek(day)]) continue;
    const entry = entries.find((e) => e.date === day);
    const checkValue = entry?.value === "YES" ? 1 : 0;
    score = score * multiplier + checkValue * (1 - multiplier);
  }
  return Math.min(1, score);
}

export function computeStreaks(
  entries: Entry[],
  frequency: Frequency,
  targetDays?: boolean[]
): { current: number; longest: number } {
  const sortedEntries = [...entries]
    .filter((e) => e.value === "YES")
    .sort((a, b) => b.date.localeCompare(a.date));

  if (sortedEntries.length === 0) return { current: 0, longest: 0 };

  // For daily habits or custom targetDays
  if (frequency.denominator === 1 || targetDays) {
    let current = 0;
    let longest = 0;
    let streak = 0;

    const allDays = getPastDays(365);
    for (let i = allDays.length - 1; i >= 0; i--) {
      const day = allDays[i];
      // Non-target days are treated like SKIP
      if (targetDays && !targetDays[getDayOfWeek(day)]) continue;
      const completed = entries.some((e) => e.date === day && e.value === "YES");
      if (completed) {
        streak++;
        longest = Math.max(longest, streak);
      } else if (entries.some((e) => e.date === day && e.value === "SKIP")) {
        // skip doesn't break streak
      } else {
        streak = 0;
      }
    }

    // Current streak: count backwards from today
    current = 0;
    for (let i = allDays.length - 1; i >= 0; i--) {
      const day = allDays[i];
      if (targetDays && !targetDays[getDayOfWeek(day)]) continue;
      const completed = entries.some((e) => e.date === day && e.value === "YES");
      const skipped = entries.some((e) => e.date === day && e.value === "SKIP");
      if (completed) {
        current++;
      } else if (skipped) {
        continue;
      } else {
        break;
      }
    }

    return { current, longest };
  }

  // Non-daily (e.g. 3×/7): a day D is "satisfied" if the window of
  // `denominator` most recent non-SKIP days ending at D contains at least
  // `numerator` YES entries. SKIP days are transparent — they neither
  // count toward the window nor toward the streak length.
  const allDays = getPastDays(365);
  const valueByDate = new Map<string, EntryValue>(
    entries.map((e) => [e.date, e.value])
  );

  const isSatisfied = (endIdx: number): boolean => {
    let yes = 0;
    let counted = 0;
    for (let i = endIdx; i >= 0 && counted < frequency.denominator; i--) {
      const v = valueByDate.get(allDays[i]);
      if (v === "SKIP") continue;
      counted++;
      if (v === "YES") yes++;
    }
    return yes >= frequency.numerator;
  };

  let longest = 0;
  let streak = 0;
  for (let i = allDays.length - 1; i >= 0; i--) {
    if (valueByDate.get(allDays[i]) === "SKIP") continue;
    if (isSatisfied(i)) {
      streak++;
      if (streak > longest) longest = streak;
    } else {
      streak = 0;
    }
  }

  let current = 0;
  for (let i = allDays.length - 1; i >= 0; i--) {
    const v = valueByDate.get(allDays[i]);
    if (v === "SKIP") continue;
    if (isSatisfied(i)) current++;
    else break;
  }

  return { current, longest };
}

// For non-daily habits (e.g. 3×/7): how many days from today until the
// rolling window would no longer be satisfied if the user logs nothing else.
// Returns null when not applicable (daily habits or habits with targetDays
// — those break the moment a target day is missed). Returns 0 when the
// streak is already not satisfied today.
export function daysUntilStreakLoss(
  entries: Entry[],
  frequency: Frequency,
  targetDays?: boolean[]
): number | null {
  if (frequency.denominator === 1 || targetDays) return null;

  const valueByDate = new Map<string, EntryValue>(
    entries.map((e) => [e.date, e.value])
  );
  const todayDate = new Date();

  const valueAtOffset = (offset: number): EntryValue | undefined => {
    if (offset > 0) return undefined; // future days have no entries
    const d = new Date(todayDate);
    d.setDate(d.getDate() + offset);
    return valueByDate.get(dateToISO(d));
  };

  const isSatisfiedAt = (endOffset: number): boolean => {
    let yes = 0;
    let counted = 0;
    let i = endOffset;
    const floor = endOffset - 365;
    while (counted < frequency.denominator && i > floor) {
      const v = valueAtOffset(i);
      if (v === "SKIP") { i--; continue; }
      counted++;
      if (v === "YES") yes++;
      i--;
    }
    return yes >= frequency.numerator;
  };

  if (!isSatisfiedAt(0)) return 0;

  for (let offset = 1; offset <= frequency.denominator + 1; offset++) {
    if (!isSatisfiedAt(offset)) return offset;
  }
  return frequency.denominator + 1;
}

// True when the user must mark today YES to keep an existing streak alive.
// - Daily / target-day habits: there is a streak ending at the most recent
//   prior target day (with SKIP transparent), and today is unmarked.
// - Non-daily habits: today's window is satisfied, but tomorrow's window
//   would drop below the threshold without further action (i.e.
//   daysUntilStreakLoss === 1).
export function streakAtRiskToday(
  entries: Entry[],
  frequency: Frequency,
  targetDays?: boolean[]
): boolean {
  const today = todayISO();
  const todayValue = entries.find((e) => e.date === today)?.value;
  if (todayValue === "YES" || todayValue === "SKIP") return false;

  if (frequency.denominator > 1 && !targetDays) {
    return daysUntilStreakLoss(entries, frequency, targetDays) === 1;
  }

  if (targetDays && !targetDays[getDayOfWeek(today)]) return false;

  const allDays = getPastDays(365);
  for (let i = allDays.length - 2; i >= 0; i--) {
    const day = allDays[i];
    if (targetDays && !targetDays[getDayOfWeek(day)]) continue;
    const v = entries.find((e) => e.date === day)?.value;
    if (v === "YES") return true;
    if (v === "SKIP") continue;
    return false;
  }
  return false;
}
