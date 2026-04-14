"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { settings } from "@/lib/db/schema";

export async function getFirstWeekday(): Promise<number> {
  const db = getDb();
  const rows = await db.select().from(settings).where(eq(settings.key, "firstWeekday"));
  if (rows.length === 0) return 1; // default Monday
  return parseInt(rows[0].value, 10);
}

export async function setFirstWeekday(day: number): Promise<void> {
  const db = getDb();
  await db
    .insert(settings)
    .values({ key: "firstWeekday", value: String(day) })
    .onConflictDoUpdate({ target: settings.key, set: { value: String(day) } });
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/stats");
}
