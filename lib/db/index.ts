import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import path from "path";
import * as schema from "./schema";
import type { Entry } from "@/lib/models";

const DB_PATH = process.env.HABITUS_DATA_DIR
  ? path.join(process.env.HABITUS_DATA_DIR, "habitus.db")
  : path.join(process.cwd(), "data", "habitus.db");

let _db: BetterSQLite3Database<typeof schema> | null = null;

function runMigrations(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      question TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'YES_NO',
      color INTEGER NOT NULL DEFAULT 8,
      frequency TEXT NOT NULL,
      target_days TEXT,
      target_value REAL NOT NULL DEFAULT 0,
      target_type TEXT NOT NULL DEFAULT 'AT_LEAST',
      unit TEXT NOT NULL DEFAULT '',
      reminder TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      uuid TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      value TEXT NOT NULL DEFAULT 'UNKNOWN',
      notes TEXT NOT NULL DEFAULT '',
      UNIQUE(habit_id, date)
    );

    CREATE INDEX IF NOT EXISTS entries_habit_id_idx ON entries(habit_id);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

const SAMPLE_HABITS = [
  {
    id: "1", name: "Morning Exercise",
    description: "30 minutes of exercise every morning",
    question: "Did you exercise this morning?",
    type: "YES_NO", color: 7,
    frequency: JSON.stringify({ numerator: 1, denominator: 1 }),
    targetValue: 0, targetType: "AT_LEAST", unit: "",
    isArchived: 0, position: 0, createdAt: "2024-01-01", uuid: "uuid-1",
  },
  {
    id: "2", name: "Read",
    description: "Read at least 20 pages",
    question: "Did you read today?",
    type: "YES_NO", color: 11,
    frequency: JSON.stringify({ numerator: 1, denominator: 1 }),
    targetValue: 0, targetType: "AT_LEAST", unit: "",
    isArchived: 0, position: 1, createdAt: "2024-01-01", uuid: "uuid-2",
  },
  {
    id: "3", name: "Meditation",
    description: "10 minutes of mindfulness",
    question: "Did you meditate today?",
    type: "YES_NO", color: 8,
    frequency: JSON.stringify({ numerator: 1, denominator: 1 }),
    targetValue: 0, targetType: "AT_LEAST", unit: "",
    isArchived: 0, position: 2, createdAt: "2024-01-01", uuid: "uuid-3",
  },
  {
    id: "4", name: "Water Intake",
    description: "Drink 8 glasses of water",
    question: "How many glasses did you drink?",
    type: "NUMERICAL", color: 9,
    frequency: JSON.stringify({ numerator: 1, denominator: 1 }),
    targetValue: 8, targetType: "AT_LEAST", unit: "glasses",
    isArchived: 0, position: 3, createdAt: "2024-01-01", uuid: "uuid-4",
  },
  {
    id: "5", name: "No Social Media",
    description: "Avoid social media during work hours",
    question: "Did you avoid social media?",
    type: "YES_NO", color: 0,
    frequency: JSON.stringify({ numerator: 5, denominator: 7 }),
    targetValue: 0, targetType: "AT_LEAST", unit: "",
    isArchived: 0, position: 4, createdAt: "2024-01-01", uuid: "uuid-5",
  },
];

const SAMPLE_PROBS: Record<string, number> = {
  "1": 0.25, "2": 0.35, "3": 0.30, "4": 0.20, "5": 0.40,
};

function seedSampleData(sqlite: Database.Database) {
  const count = (sqlite.prepare("SELECT COUNT(*) as c FROM habits").get() as { c: number }).c;
  if (count > 0) return;

  const insertHabit = sqlite.prepare(`
    INSERT OR IGNORE INTO habits (id, name, description, question, type, color, frequency, target_value, target_type, unit, is_archived, position, created_at, uuid)
    VALUES (@id, @name, @description, @question, @type, @color, @frequency, @targetValue, @targetType, @unit, @isArchived, @position, @createdAt, @uuid)
  `);

  const insertEntry = sqlite.prepare(`
    INSERT OR IGNORE INTO entries (habit_id, date, value, notes)
    VALUES (?, ?, ?, '')
  `);

  const today = new Date();
  const seed = sqlite.transaction(() => {
    for (const h of SAMPLE_HABITS) {
      insertHabit.run(h);
      for (let i = 1; i <= 60; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const yy = d.getFullYear(), mm = String(d.getMonth() + 1).padStart(2, "0"), dd = String(d.getDate()).padStart(2, "0");
        const date = `${yy}-${mm}-${dd}`;
        const prob = SAMPLE_PROBS[h.id] ?? 0.5;
        const value: Entry["value"] = Math.random() > prob ? "YES" : "NO";
        insertEntry.run(h.id, date, value);
      }
    }
    sqlite.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('firstWeekday', '1')").run();
  });

  seed();
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (_db) return _db;
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");
  runMigrations(sqlite);
  seedSampleData(sqlite);
  _db = drizzle(sqlite, { schema });
  return _db;
}
