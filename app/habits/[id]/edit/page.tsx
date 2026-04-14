export const dynamic = "force-dynamic";

import { getHabit } from "@/lib/actions/habits";
import { PageHeader } from "@/components/PageHeader";
import { HabitForm } from "@/components/HabitForm";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default async function EditHabitPage({ params }: Props) {
  const { id } = params;
  const habit = await getHabit(id);

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

  return (
    <div className="min-h-full">
      <PageHeader title="Edit Habit" backHref={`/habits/${id}`} />
      <HabitForm existing={habit} mode="edit" />
    </div>
  );
}
