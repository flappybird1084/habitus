export const dynamic = "force-dynamic";

import { getAllHabits } from "@/lib/actions/habits";
import { getEntries } from "@/lib/actions/entries";
import { getFirstWeekday } from "@/lib/actions/settings";
import { SettingsClient } from "./SettingsClient";
import type { Entry } from "@/lib/models";

export default async function SettingsPage() {
  const [habits, firstWeekday] = await Promise.all([
    getAllHabits(),
    getFirstWeekday(),
  ]);

  // Fetch entries for all habits (needed for CSV export)
  const allEntries: Record<string, Entry[]> = {};
  await Promise.all(
    habits.map(async (h) => {
      allEntries[h.id] = await getEntries(h.id);
    })
  );

  return (
    <SettingsClient
      habits={habits}
      entries={allEntries}
      firstWeekday={firstWeekday}
    />
  );
}
