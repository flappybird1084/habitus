export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/PageHeader";
import { HabitForm } from "@/components/HabitForm";

export default function NewHabitPage() {
  return (
    <div className="min-h-full">
      <PageHeader title="New Habit" backHref="/" />
      <HabitForm mode="create" />
    </div>
  );
}
