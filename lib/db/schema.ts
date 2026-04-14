import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const habits = sqliteTable("habits", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  question: text("question").notNull().default(""),
  type: text("type").notNull().default("YES_NO"),
  color: integer("color").notNull().default(8),
  frequency: text("frequency").notNull(), // JSON: { numerator, denominator }
  targetDays: text("target_days"), // JSON: boolean[7] or null
  targetValue: real("target_value").notNull().default(0),
  targetType: text("target_type").notNull().default("AT_LEAST"),
  unit: text("unit").notNull().default(""),
  reminder: text("reminder"), // JSON: { hour, minute, days } or null
  isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull(),
  uuid: text("uuid").notNull(),
});

export const entries = sqliteTable(
  "entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    habitId: text("habit_id").notNull(),
    date: text("date").notNull(), // YYYY-MM-DD
    value: text("value").notNull().default("UNKNOWN"),
    notes: text("notes").notNull().default(""),
  },
  (t) => ({
    habitDateUniq: uniqueIndex("entries_habit_date_uniq").on(t.habitId, t.date),
    habitIdIdx: index("entries_habit_id_idx").on(t.habitId),
  })
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
