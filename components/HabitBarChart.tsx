"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import { getColor } from "@/lib/models";
import type { Entry } from "@/lib/models";

interface HabitBarChartProps {
  entries: Entry[];
  color: number;
  dark?: boolean;
  view?: "week" | "month" | "year";
}

export function HabitBarChart({
  entries,
  color,
  dark = false,
  view = "month",
}: HabitBarChartProps) {
  const hexColor = getColor(color, dark);

  const data = useMemo(() => {
    const today = new Date();

    if (view === "week") {
      // Last 7 days
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        const iso = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("en-US", { weekday: "short" });
        const entry = entries.find((e) => e.date === iso);
        return { label, value: entry?.value === "YES" ? 1 : 0, date: iso };
      });
    }

    if (view === "month") {
      // Last 30 days grouped by week
      return Array.from({ length: 5 }, (_, weekIdx) => {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - (4 - weekIdx) * 7 - 6);
        let count = 0;
        for (let d = 0; d < 7; d++) {
          const day = new Date(weekStart);
          day.setDate(day.getDate() + d);
          const iso = day.toISOString().split("T")[0];
          if (entries.find((e) => e.date === iso && e.value === "YES")) count++;
        }
        const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return { label, value: count };
      });
    }

    // Year: last 12 months
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const count = entries.filter((e) => {
        const ed = new Date(e.date);
        return ed.getFullYear() === year && ed.getMonth() === month && e.value === "YES";
      }).length;
      return { label, value: count };
    });
  }, [entries, view]);

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barCategoryGap="30%" margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, maxValue]}
          tick={{ fontSize: 10, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          tickCount={3}
        />
        <Tooltip
          cursor={{ fill: "transparent" }}
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--text-secondary)", fontWeight: 600 }}
          itemStyle={{ color: hexColor }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={32}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.value > 0 ? hexColor : (dark ? "#2a2a2a" : "#e5e7eb")}
              fillOpacity={entry.value > 0 ? 1 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
