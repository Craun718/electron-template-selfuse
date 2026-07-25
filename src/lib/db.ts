import { app } from 'electron';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  // Store epoch milliseconds as a plain integer; the timestamp mode returns
  // Date objects that break across IPC serialization (Date -> string).
  createdAt: integer('created_at').notNull(),
});

export type Item = typeof items.$inferSelect;

const schema = { items };

type DB = ReturnType<typeof drizzle<typeof schema>>;

let db: DB | null = null;

// Opens (and lazily creates) the SQLite file under userData and ensures the
// schema exists. Must be called after `app.whenReady()` so getPath is usable.
export function initDatabase(): DB {
  if (db) return db;

  const path = join(app.getPath('userData'), 'app.db');
  const sqlite = new Database(path);
  sqlite.pragma('journal_mode = WAL');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  db = drizzle(sqlite, { schema });
  return db;
}

export function getDatabase(): DB {
  if (!db) throw new Error('Database not initialized. Call initDatabase() after app ready.');
  return db;
}
