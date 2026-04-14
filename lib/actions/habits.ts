"use server";

import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { habits as habitsTable } from "@/lib/db/schema";
import { getEntries } from "./entries";
import {
  type Habit,
  type HabitWithStats,
  type Frequency,
  type Reminder,
  todayISO,
  computeScore,
  computeStreaks,
  getPast30Days,
} from "@/lib/models";

function rowToHabit(row: typeof habitsTable.$inferSelect): Habit {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    question: row.question,
    type: row.type as Habit["type"],
    color: row.color,
    frequency: JSON.parse(row.frequency) as Frequency,
    targetDays: row.targetDays ? (JSON.parse(row.targetDays) as boolean[]) : undefined,
    targetValue: row.targetValue,
    targetType: row.targetType as Habit["targetType"],
    unit: row.unit,
    reminder: row.reminder ? (JSON.parse(row.reminder) as Reminder) : undefined,
    isArchived: row.isArchived,
    position: row.position,
    createdAt: row.createdAt,
    uuid: row.uuid,
  };
}

async function habitToStats(habit: Habit): Promise<HabitWithStats> {
  const entries = await getEntries(habit.id);
  const today = todayISO();
  const todayEntry = entries.find((e) => e.date === today) ?? null;
  const score = computeScore(entries, habit.frequency, habit.targetDays);
  const { current, longest } = computeStreaks(entries, habit.frequency, habit.targetDays);
  const past30 = getPast30Days();
  const completed30 = past30.filter((d) =>
    entries.some((e) => e.date === d && e.value === "YES")
  ).length;
  const yesEntries = entries.filter((e) => e.value === "YES");
  const lastFilledDate = yesEntries.length > 0
    ? yesEntries.reduce((latest, e) => e.date > latest ? e.date : latest, yesEntries[0].date)
    : null;
  return {
    ...habit,
    todayEntry,
    currentStreak: current,
    longestStreak: longest,
    score,
    completionRate: completed30 / 30,
    totalCount: yesEntries.length,
    lastFilledDate,
  };
}

export async function getAllHabitsWithStats(): Promise<HabitWithStats[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(habitsTable)
    .orderBy(asc(habitsTable.position));
  const habits = rows.map(rowToHabit).filter((h) => !h.isArchived);
  return Promise.all(habits.map(habitToStats));
}

export async function getHabitWithStats(id: string): Promise<HabitWithStats | null> {
  const db = getDb();
  const rows = await db.select().from(habitsTable).where(eq(habitsTable.id, id));
  if (rows.length === 0) return null;
  return habitToStats(rowToHabit(rows[0]));
}

export async function getHabit(id: string): Promise<Habit | null> {
  const db = getDb();
  const rows = await db.select().from(habitsTable).where(eq(habitsTable.id, id));
  if (rows.length === 0) return null;
  return rowToHabit(rows[0]);
}

export async function getAllHabits(): Promise<Habit[]> {
  const db = getDb();
  const rows = await db.select().from(habitsTable).orderBy(asc(habitsTable.position));
  return rows.map(rowToHabit);
}

export async function addHabit(
  data: Omit<Habit, "id" | "createdAt" | "uuid" | "position">
): Promise<void> {
  const db = getDb();
  const allRows = await db.select({ pos: habitsTable.position }).from(habitsTable);
  const maxPos = allRows.reduce((m, r) => Math.max(m, r.pos), -1);
  const id = Date.now().toString();
  await db.insert(habitsTable).values({
    id,
    name: data.name,
    description: data.description,
    question: data.question,
    type: data.type,
    color: data.color,
    frequency: JSON.stringify(data.frequency),
    targetDays: data.targetDays ? JSON.stringify(data.targetDays) : null,
    targetValue: data.targetValue,
    targetType: data.targetType,
    unit: data.unit,
    reminder: data.reminder ? JSON.stringify(data.reminder) : null,
    isArchived: data.isArchived,
    position: maxPos + 1,
    createdAt: todayISO(),
    uuid: id,
  });
  revalidatePath("/");
  revalidatePath("/stats");
}

export async function updateHabit(id: string, updates: Partial<Habit>): Promise<void> {
  const db = getDb();
  const patch: Partial<typeof habitsTable.$inferInsert> = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.question !== undefined) patch.question = updates.question;
  if (updates.type !== undefined) patch.type = updates.type;
  if (updates.color !== undefined) patch.color = updates.color;
  if (updates.frequency !== undefined) patch.frequency = JSON.stringify(updates.frequency);
  if ("targetDays" in updates) patch.targetDays = updates.targetDays ? JSON.stringify(updates.targetDays) : null;
  if (updates.targetValue !== undefined) patch.targetValue = updates.targetValue;
  if (updates.targetType !== undefined) patch.targetType = updates.targetType;
  if (updates.unit !== undefined) patch.unit = updates.unit;
  if ("reminder" in updates) patch.reminder = updates.reminder ? JSON.stringify(updates.reminder) : null;
  if (updates.isArchived !== undefined) patch.isArchived = updates.isArchived;
  if (updates.position !== undefined) patch.position = updates.position;
  await db.update(habitsTable).set(patch).where(eq(habitsTable.id, id));
  revalidatePath("/");
  revalidatePath(`/habits/${id}`);
  revalidatePath(`/habits/${id}/edit`);
  revalidatePath("/stats");
}

export async function deleteHabit(id: string): Promise<void> {
  const db = getDb();
  await db.delete(habitsTable).where(eq(habitsTable.id, id));
  revalidatePath("/");
  revalidatePath("/stats");
}

export async function archiveHabit(id: string): Promise<void> {
  const db = getDb();
  const rows = await db.select({ isArchived: habitsTable.isArchived }).from(habitsTable).where(eq(habitsTable.id, id));
  if (rows.length === 0) return;
  await db.update(habitsTable).set({ isArchived: !rows[0].isArchived }).where(eq(habitsTable.id, id));
  revalidatePath("/");
  revalidatePath(`/habits/${id}`);
  revalidatePath("/stats");
}

export async function reorderHabits(ids: string[]): Promise<void> {
  const db = getDb();
  for (let i = 0; i < ids.length; i++) {
    await db.update(habitsTable).set({ position: i }).where(eq(habitsTable.id, ids[i]));
  }
  revalidatePath("/");
}

export async function clearAllData(): Promise<void> {
  const db = getDb();
  await db.delete(habitsTable);
  // entries are foreign-key-less; delete separately
  const { entries: entriesTable } = await import("@/lib/db/schema");
  await db.delete(entriesTable);
  revalidatePath("/");
  revalidatePath("/stats");
  revalidatePath("/settings");
}
