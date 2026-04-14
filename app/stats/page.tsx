export const dynamic = "force-dynamic";

import { getAllHabitsWithStats } from "@/lib/actions/habits";
import { StatsClient } from "./StatsClient";

export default async function StatsPage() {
  const habits = await getAllHabitsWithStats();
  return <StatsClient habits={habits} />;
}
