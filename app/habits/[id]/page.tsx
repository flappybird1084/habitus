export const dynamic = "force-dynamic";

import { getHabitWithStats } from "@/lib/actions/habits";
import { getEntries } from "@/lib/actions/entries";
import { getFirstWeekday } from "@/lib/actions/settings";
import { HabitDetailClient } from "./HabitDetailClient";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default async function HabitDetailPage({ params }: Props) {
  const { id } = params;
  const [habit, entries, firstWeekday] = await Promise.all([
    getHabitWithStats(id),
    getEntries(id),
    getFirstWeekday(),
  ]);

  if (!habit) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <p className="text-[var(--text-muted)]">Habit not found</p>
          <Link href="/" className="text-sm text-emerald-500 mt-2 block">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return <HabitDetailClient habit={habit} entries={entries} firstWeekday={firstWeekday} />;
}
