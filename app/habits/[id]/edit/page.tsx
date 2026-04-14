"use client";

import { useParams } from "next/navigation";
import { useHabitStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { HabitForm } from "@/components/HabitForm";
import Link from "next/link";

export default function EditHabitPage() {
  const params = useParams();
  const id = params.id as string;
  const habits = useHabitStore((s) => s.habits);
  const habit = habits.find((h) => h.id === id);

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
