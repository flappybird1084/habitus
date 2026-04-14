export const dynamic = "force-dynamic";

import { getAllHabitsWithStats } from "@/lib/actions/habits";
import HomePageClient from "@/components/HomePageClient";

export default async function HomePage() {
  const habits = await getAllHabitsWithStats();
  return <HomePageClient habits={habits} />;
}
