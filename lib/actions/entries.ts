"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { entries as entriesTable } from "@/lib/db/schema";
import { type Entry, todayISO } from "@/lib/models";

function rowToEntry(row: typeof entriesTable.$inferSelect): Entry {
  return {
    date: row.date,
    value: row.value as Entry["value"],
    notes: row.notes || undefined,
  };
}

export async function getEntries(habitId: string): Promise<Entry[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(entriesTable)
    .where(eq(entriesTable.habitId, habitId));
  return rows.map(rowToEntry);
}

export async function getEntry(habitId: string, date: string): Promise<Entry | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(entriesTable)
    .where(and(eq(entriesTable.habitId, habitId), eq(entriesTable.date, date)));
  if (rows.length === 0) return null;
  return rowToEntry(rows[0]);
}

export async function setEntry(
  habitId: string,
  date: string,
  value: Entry["value"],
  notes = ""
): Promise<void> {
  const db = getDb();
  // Use INSERT OR REPLACE (via onConflictDoUpdate) for upsert
  await db
    .insert(entriesTable)
    .values({ habitId, date, value, notes })
    .onConflictDoUpdate({
      target: [entriesTable.habitId, entriesTable.date],
      set: { value, notes },
    });
  revalidatePath("/");
  revalidatePath(`/habits/${habitId}`);
  revalidatePath("/stats");
}

export async function toggleEntry(habitId: string, date = todayISO()): Promise<void> {
  const existing = await getEntry(habitId, date);
  const newValue: Entry["value"] = existing?.value === "YES" ? "NO" : "YES";
  await setEntry(habitId, date, newValue);
}
